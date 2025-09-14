/**
 * Web Worker utilities
 */

/**
 * Create a web worker from a function
 * @param {Function} workerFunction - Function to run in worker
 * @returns {Worker} Web worker instance
 */
export const createWorker = (workerFunction) => {
  const blob = new Blob([`(${workerFunction.toString()})()`], {
    type: 'application/javascript'
  });
  
  return new Worker(URL.createObjectURL(blob));
};

/**
 * Create a worker pool for parallel processing
 * @param {Function} workerFunction - Worker function
 * @param {number} poolSize - Number of workers (default: navigator.hardwareConcurrency)
 * @returns {WorkerPool} Worker pool instance
 */
export const createWorkerPool = (workerFunction, poolSize = navigator.hardwareConcurrency || 4) => {
  return new WorkerPool(workerFunction, poolSize);
};

/**
 * Worker Pool class for managing multiple workers
 */
export class WorkerPool {
  constructor(workerFunction, poolSize) {
    this.workers = [];
    this.queue = [];
    this.busyWorkers = new Set();
    
    // Create workers
    for (let i = 0; i < poolSize; i++) {
      const worker = createWorker(workerFunction);
      worker.id = i;
      this.workers.push(worker);
    }
  }
  
  /**
   * Execute task on available worker
   * @param {*} data - Data to send to worker
   * @param {Array} transferList - Transferable objects
   * @returns {Promise} Task result
   */
  async execute(data, transferList = []) {
    return new Promise((resolve, reject) => {
      const task = { data, transferList, resolve, reject };
      
      const availableWorker = this.getAvailableWorker();
      
      if (availableWorker) {
        this.executeTask(availableWorker, task);
      } else {
        this.queue.push(task);
      }
    });
  }
  
  /**
   * Get available worker
   * @returns {Worker|null} Available worker or null
   */
  getAvailableWorker() {
    return this.workers.find(worker => !this.busyWorkers.has(worker.id));
  }
  
  /**
   * Execute task on worker
   * @param {Worker} worker - Worker instance
   * @param {Object} task - Task object
   */
  executeTask(worker, task) {
    this.busyWorkers.add(worker.id);
    
    const handleMessage = (event) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      
      this.busyWorkers.delete(worker.id);
      task.resolve(event.data);
      
      // Process next task in queue
      const nextTask = this.queue.shift();
      if (nextTask) {
        this.executeTask(worker, nextTask);
      }
    };
    
    const handleError = (error) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      
      this.busyWorkers.delete(worker.id);
      task.reject(error);
      
      // Process next task in queue
      const nextTask = this.queue.shift();
      if (nextTask) {
        this.executeTask(worker, nextTask);
      }
    };
    
    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    
    worker.postMessage(task.data, task.transferList);
  }
  
  /**
   * Terminate all workers
   */
  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.busyWorkers.clear();
    this.queue = [];
  }
  
  /**
   * Get pool statistics
   * @returns {Object} Pool stats
   */
  getStats() {
    return {
      totalWorkers: this.workers.length,
      busyWorkers: this.busyWorkers.size,
      availableWorkers: this.workers.length - this.busyWorkers.size,
      queuedTasks: this.queue.length
    };
  }
}

/**
 * Process array data in parallel using workers
 * @param {Array} data - Data array to process
 * @param {Function} processor - Processing function
 * @param {number} chunkSize - Chunk size for processing
 * @param {number} poolSize - Worker pool size
 * @returns {Promise<Array>} Processed data
 */
export const processArrayInParallel = async (data, processor, chunkSize = 1000, poolSize = 4) => {
  // Create worker function
  const workerFunction = () => {
    self.onmessage = (event) => {
      const { chunk, processorCode } = event.data;
      
      try {
        // Recreate processor function in worker context
        const processor = new Function('return ' + processorCode)();
        const result = chunk.map(item => processor(item));
        self.postMessage(result);
      } catch (error) {
        self.postMessage({ error: error.message });
      }
    };
  };
  
  // Create worker pool
  const pool = createWorkerPool(workerFunction, poolSize);
  
  try {
    // Split data into chunks
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    
    // Process chunks in parallel
    const results = await Promise.all(
      chunks.map(chunk => 
        pool.execute({
          chunk,
          processorCode: processor.toString()
        })
      )
    );
    
    // Flatten results
    return results.flat();
    
  } finally {
    pool.terminate();
  }
};

/**
 * Create a shared worker
 * @param {string} scriptURL - Worker script URL
 * @param {string} name - Worker name
 * @returns {SharedWorker} Shared worker instance
 */
export const createSharedWorker = (scriptURL, name = 'shared-worker') => {
  if (!('SharedWorker' in window)) {
    throw new Error('SharedWorker is not supported');
  }
  
  return new SharedWorker(scriptURL, { name });
};

/**
 * Worker message handler utility
 * @param {Object} handlers - Message handlers
 * @returns {Function} Message handler function
 */
export const createWorkerMessageHandler = (handlers) => {
  return (event) => {
    const { type, data, id } = event.data;
    
    if (handlers[type]) {
      try {
        const result = handlers[type](data);
        
        // Handle async handlers
        if (result instanceof Promise) {
          result
            .then(value => self.postMessage({ id, type: 'success', data: value }))
            .catch(error => self.postMessage({ id, type: 'error', error: error.message }));
        } else {
          self.postMessage({ id, type: 'success', data: result });
        }
      } catch (error) {
        self.postMessage({ id, type: 'error', error: error.message });
      }
    } else {
      self.postMessage({ id, type: 'error', error: `Unknown message type: ${type}` });
    }
  };
};

/**
 * Worker communication helper
 */
export class WorkerCommunicator {
  constructor(worker) {
    this.worker = worker;
    this.messageId = 0;
    this.pendingMessages = new Map();
    
    this.worker.onmessage = (event) => {
      const { id, type, data, error } = event.data;
      
      if (this.pendingMessages.has(id)) {
        const { resolve, reject } = this.pendingMessages.get(id);
        this.pendingMessages.delete(id);
        
        if (type === 'success') {
          resolve(data);
        } else {
          reject(new Error(error));
        }
      }
    };
    
    this.worker.onerror = (error) => {
      // Reject all pending messages
      this.pendingMessages.forEach(({ reject }) => {
        reject(error);
      });
      this.pendingMessages.clear();
    };
  }
  
  /**
   * Send message to worker
   * @param {string} type - Message type
   * @param {*} data - Message data
   * @returns {Promise} Response promise
   */
  send(type, data) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      
      this.pendingMessages.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, data });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          reject(new Error('Message timeout'));
        }
      }, 30000);
    });
  }
  
  /**
   * Terminate worker
   */
  terminate() {
    this.worker.terminate();
    this.pendingMessages.clear();
  }
}
