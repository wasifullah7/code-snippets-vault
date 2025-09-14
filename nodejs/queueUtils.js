/**
 * Queue utilities for Node.js
 */

const EventEmitter = require('events');

/**
 * Simple queue implementation
 */
class Queue {
  constructor() {
    this.items = [];
  }

  /**
   * Add item to queue
   * @param {*} item - Item to add
   */
  enqueue(item) {
    this.items.push(item);
  }

  /**
   * Remove and return first item
   * @returns {*} First item or undefined
   */
  dequeue() {
    return this.items.shift();
  }

  /**
   * Get first item without removing
   * @returns {*} First item or undefined
   */
  peek() {
    return this.items[0];
  }

  /**
   * Check if queue is empty
   * @returns {boolean} Empty status
   */
  isEmpty() {
    return this.items.length === 0;
  }

  /**
   * Get queue size
   * @returns {number} Queue size
   */
  size() {
    return this.items.length;
  }

  /**
   * Clear queue
   */
  clear() {
    this.items = [];
  }

  /**
   * Convert queue to array
   * @returns {Array} Queue items
   */
  toArray() {
    return [...this.items];
  }
}

/**
 * Priority queue implementation
 */
class PriorityQueue {
  constructor(compareFn = (a, b) => a.priority - b.priority) {
    this.items = [];
    this.compare = compareFn;
  }

  /**
   * Add item with priority
   * @param {*} item - Item to add
   * @param {number} priority - Priority (lower = higher priority)
   */
  enqueue(item, priority = 0) {
    const queueItem = { item, priority };
    this.items.push(queueItem);
    this.items.sort(this.compare);
  }

  /**
   * Remove and return highest priority item
   * @returns {*} Highest priority item
   */
  dequeue() {
    return this.items.shift()?.item;
  }

  /**
   * Get highest priority item without removing
   * @returns {*} Highest priority item
   */
  peek() {
    return this.items[0]?.item;
  }

  /**
   * Check if queue is empty
   * @returns {boolean} Empty status
   */
  isEmpty() {
    return this.items.length === 0;
  }

  /**
   * Get queue size
   * @returns {number} Queue size
   */
  size() {
    return this.items.length;
  }

  /**
   * Clear queue
   */
  clear() {
    this.items = [];
  }
}

/**
 * Async queue for processing tasks
 */
class AsyncQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.concurrency = options.concurrency || 1;
    this.timeout = options.timeout || 0;
    this.retries = options.retries || 0;
    this.delay = options.delay || 0;
    
    this.queue = [];
    this.running = 0;
    this.paused = false;
    this.drained = true;
  }

  /**
   * Add task to queue
   * @param {Function} task - Task function
   * @param {Object} options - Task options
   * @returns {Promise} Task result
   */
  async push(task, options = {}) {
    return new Promise((resolve, reject) => {
      const taskItem = {
        task,
        resolve,
        reject,
        retries: options.retries || this.retries,
        timeout: options.timeout || this.timeout,
        ...options
      };

      this.queue.push(taskItem);
      this.drained = false;
      
      this.emit('taskAdded', taskItem);
      this.process();
    });
  }

  /**
   * Process queue tasks
   */
  async process() {
    if (this.paused || this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const taskItem = this.queue.shift();
    
    try {
      this.emit('taskStart', taskItem);
      
      // Apply timeout if specified
      let result;
      if (taskItem.timeout > 0) {
        result = await Promise.race([
          taskItem.task(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Task timeout')), taskItem.timeout)
          )
        ]);
      } else {
        result = await taskItem.task();
      }

      this.emit('taskSuccess', taskItem, result);
      taskItem.resolve(result);
      
    } catch (error) {
      this.emit('taskError', taskItem, error);
      
      // Retry logic
      if (taskItem.retries > 0) {
        taskItem.retries--;
        this.queue.unshift(taskItem);
        this.emit('taskRetry', taskItem, error);
      } else {
        taskItem.reject(error);
      }
    } finally {
      this.running--;
      
      // Apply delay between tasks
      if (this.delay > 0 && this.queue.length > 0) {
        setTimeout(() => this.process(), this.delay);
      } else {
        this.process();
      }
      
      // Check if drained
      if (this.running === 0 && this.queue.length === 0 && !this.drained) {
        this.drained = true;
        this.emit('drained');
      }
    }
  }

  /**
   * Pause queue processing
   */
  pause() {
    this.paused = true;
    this.emit('paused');
  }

  /**
   * Resume queue processing
   */
  resume() {
    this.paused = false;
    this.emit('resumed');
    this.process();
  }

  /**
   * Get queue statistics
   * @returns {Object} Queue stats
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      running: this.running,
      paused: this.paused,
      drained: this.drained,
      concurrency: this.concurrency
    };
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue.forEach(taskItem => {
      taskItem.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    this.emit('cleared');
  }

  /**
   * Wait for queue to be drained
   * @returns {Promise} Promise that resolves when drained
   */
  async waitForDrain() {
    if (this.drained) return Promise.resolve();
    
    return new Promise(resolve => {
      this.once('drained', resolve);
    });
  }
}

/**
 * Rate-limited queue
 */
class RateLimitedQueue extends AsyncQueue {
  constructor(options = {}) {
    super(options);
    this.rateLimit = options.rateLimit || 1000; // requests per window
    this.window = options.window || 60000; // window in ms
    this.requests = [];
  }

  /**
   * Add task with rate limiting
   * @param {Function} task - Task function
   * @param {Object} options - Task options
   * @returns {Promise} Task result
   */
  async push(task, options = {}) {
    return new Promise((resolve, reject) => {
      const taskItem = {
        task,
        resolve,
        reject,
        timestamp: Date.now(),
        ...options
      };

      // Check rate limit
      this.cleanupOldRequests();
      
      if (this.requests.length >= this.rateLimit) {
        const delay = this.window - (Date.now() - this.requests[0].timestamp);
        setTimeout(() => this.push(task, options), delay);
        return;
      }

      this.requests.push(taskItem);
      super.push(task, options);
    });
  }

  /**
   * Clean up old requests outside the window
   */
  cleanupOldRequests() {
    const now = Date.now();
    this.requests = this.requests.filter(req => now - req.timestamp < this.window);
  }
}

/**
 * Circular buffer implementation
 */
class CircularBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  /**
   * Add item to buffer
   * @param {*} item - Item to add
   * @returns {boolean} Success status
   */
  enqueue(item) {
    if (this.size === this.capacity) {
      // Buffer is full, overwrite oldest item
      this.tail = (this.tail + 1) % this.capacity;
    } else {
      this.size++;
    }
    
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    return true;
  }

  /**
   * Remove and return oldest item
   * @returns {*} Oldest item or undefined
   */
  dequeue() {
    if (this.size === 0) return undefined;
    
    const item = this.buffer[this.tail];
    this.tail = (this.tail + 1) % this.capacity;
    this.size--;
    return item;
  }

  /**
   * Get oldest item without removing
   * @returns {*} Oldest item or undefined
   */
  peek() {
    return this.size === 0 ? undefined : this.buffer[this.tail];
  }

  /**
   * Check if buffer is empty
   * @returns {boolean} Empty status
   */
  isEmpty() {
    return this.size === 0;
  }

  /**
   * Check if buffer is full
   * @returns {boolean} Full status
   */
  isFull() {
    return this.size === this.capacity;
  }

  /**
   * Get buffer size
   * @returns {number} Buffer size
   */
  getSize() {
    return this.size;
  }

  /**
   * Clear buffer
   */
  clear() {
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  /**
   * Convert buffer to array
   * @returns {Array} Buffer items in order
   */
  toArray() {
    const result = [];
    for (let i = 0; i < this.size; i++) {
      const index = (this.tail + i) % this.capacity;
      result.push(this.buffer[index]);
    }
    return result;
  }
}

module.exports = {
  Queue,
  PriorityQueue,
  AsyncQueue,
  RateLimitedQueue,
  CircularBuffer
};
