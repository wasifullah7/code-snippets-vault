/**
 * Advanced queue management system for Node.js applications
 * Multiple queue types with priority, delayed jobs, and retry mechanisms
 */

const EventEmitter = require('events');

/**
 * Base Queue class
 */
class Queue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.name = options.name || 'default';
    this.concurrency = options.concurrency || 1;
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.jobs = [];
    this.running = 0;
    this.paused = false;
    this.stats = {
      completed: 0,
      failed: 0,
      retries: 0,
      total: 0
    };
  }

  /**
   * Add job to queue
   * @param {Function} job - Job function
   * @param {Object} options - Job options
   * @returns {Promise} Job promise
   */
  async add(job, options = {}) {
    const jobId = this.generateId();
    const jobData = {
      id: jobId,
      job,
      options: {
        priority: options.priority || 0,
        delay: options.delay || 0,
        timeout: options.timeout || this.timeout,
        retries: options.retries || this.retries,
        retryDelay: options.retryDelay || this.retryDelay,
        ...options
      },
      attempts: 0,
      createdAt: Date.now(),
      scheduledFor: Date.now() + (options.delay || 0)
    };

    this.jobs.push(jobData);
    this.stats.total++;
    this.emit('job:added', jobData);

    // Sort by priority and scheduled time
    this.jobs.sort((a, b) => {
      if (a.options.priority !== b.options.priority) {
        return b.options.priority - a.options.priority;
      }
      return a.scheduledFor - b.scheduledFor;
    });

    this.process();
    return jobId;
  }

  /**
   * Process jobs
   */
  async process() {
    if (this.paused || this.running >= this.concurrency) return;

    const now = Date.now();
    const availableJobs = this.jobs.filter(job => 
      job.scheduledFor <= now && job.attempts < job.options.retries
    );

    if (availableJobs.length === 0) return;

    const job = availableJobs.shift();
    this.jobs = this.jobs.filter(j => j.id !== job.id);
    this.running++;

    try {
      this.emit('job:started', job);
      
      const result = await this.executeJob(job);
      
      this.stats.completed++;
      this.emit('job:completed', { job, result });
      
    } catch (error) {
      job.attempts++;
      this.stats.retries++;
      
      if (job.attempts >= job.options.retries) {
        this.stats.failed++;
        this.emit('job:failed', { job, error });
      } else {
        // Retry job
        job.scheduledFor = Date.now() + job.options.retryDelay;
        this.jobs.push(job);
        this.jobs.sort((a, b) => a.scheduledFor - b.scheduledFor);
        this.emit('job:retry', { job, error, attempt: job.attempts });
      }
    } finally {
      this.running--;
      this.process();
    }
  }

  /**
   * Execute job with timeout
   * @param {Object} job - Job data
   * @returns {Promise} Job result
   */
  async executeJob(job) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Job timeout'));
      }, job.options.timeout);

      Promise.resolve(job.job())
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Pause queue
   */
  pause() {
    this.paused = true;
    this.emit('queue:paused');
  }

  /**
   * Resume queue
   */
  resume() {
    this.paused = false;
    this.emit('queue:resumed');
    this.process();
  }

  /**
   * Clear queue
   */
  clear() {
    this.jobs = [];
    this.emit('queue:cleared');
  }

  /**
   * Get queue size
   * @returns {number} Queue size
   */
  size() {
    return this.jobs.length;
  }

  /**
   * Get queue status
   * @returns {Object} Queue status
   */
  getStatus() {
    return {
      name: this.name,
      size: this.jobs.length,
      running: this.running,
      paused: this.paused,
      concurrency: this.concurrency,
      stats: { ...this.stats }
    };
  }

  /**
   * Generate unique job ID
   * @returns {string} Job ID
   */
  generateId() {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Priority Queue with multiple priority levels
 */
class PriorityQueue extends Queue {
  constructor(options = {}) {
    super(options);
    this.priorityLevels = options.priorityLevels || ['high', 'medium', 'low'];
    this.priorityMap = {
      high: 3,
      medium: 2,
      low: 1
    };
  }

  /**
   * Add job with priority
   * @param {Function} job - Job function
   * @param {string} priority - Priority level
   * @param {Object} options - Job options
   * @returns {Promise} Job ID
   */
  async addWithPriority(job, priority = 'medium', options = {}) {
    const priorityValue = this.priorityMap[priority] || 2;
    return this.add(job, { ...options, priority: priorityValue });
  }

  /**
   * Add high priority job
   * @param {Function} job - Job function
   * @param {Object} options - Job options
   * @returns {Promise} Job ID
   */
  async addHigh(job, options = {}) {
    return this.addWithPriority(job, 'high', options);
  }

  /**
   * Add medium priority job
   * @param {Function} job - Job function
   * @param {Object} options - Job options
   * @returns {Promise} Job ID
   */
  async addMedium(job, options = {}) {
    return this.addWithPriority(job, 'medium', options);
  }

  /**
   * Add low priority job
   * @param {Function} job - Job function
   * @param {Object} options - Job options
   * @returns {Promise} Job ID
   */
  async addLow(job, options = {}) {
    return this.addWithPriority(job, 'low', options);
  }
}

/**
 * Delayed Queue for scheduled jobs
 */
class DelayedQueue extends Queue {
  constructor(options = {}) {
    super(options);
    this.timer = null;
    this.startTimer();
  }

  /**
   * Add delayed job
   * @param {Function} job - Job function
   * @param {number} delay - Delay in milliseconds
   * @param {Object} options - Job options
   * @returns {Promise} Job ID
   */
  async addDelayed(job, delay, options = {}) {
    return this.add(job, { ...options, delay });
  }

  /**
   * Add job scheduled for specific time
   * @param {Function} job - Job function
   * @param {Date|number} time - Scheduled time
   * @param {Object} options - Job options
   * @returns {Promise} Job ID
   */
  async addScheduled(job, time, options = {}) {
    const scheduledTime = time instanceof Date ? time.getTime() : time;
    const delay = Math.max(0, scheduledTime - Date.now());
    return this.addDelayed(job, delay, options);
  }

  /**
   * Start timer for processing delayed jobs
   */
  startTimer() {
    this.timer = setInterval(() => {
      this.process();
    }, 1000);
  }

  /**
   * Stop timer
   */
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Destroy queue
   */
  destroy() {
    this.stopTimer();
    this.clear();
    this.removeAllListeners();
  }
}

/**
 * Rate Limited Queue
 */
class RateLimitedQueue extends Queue {
  constructor(options = {}) {
    super(options);
    this.rateLimit = options.rateLimit || 100; // jobs per second
    this.rateLimitWindow = options.rateLimitWindow || 1000; // window in milliseconds
    this.jobTimestamps = [];
  }

  /**
   * Check rate limit
   * @returns {boolean} Whether job can be processed
   */
  checkRateLimit() {
    const now = Date.now();
    this.jobTimestamps = this.jobTimestamps.filter(
      timestamp => now - timestamp < this.rateLimitWindow
    );
    
    return this.jobTimestamps.length < this.rateLimit;
  }

  /**
   * Process jobs with rate limiting
   */
  async process() {
    if (this.paused || this.running >= this.concurrency || !this.checkRateLimit()) {
      return;
    }

    const now = Date.now();
    const availableJobs = this.jobs.filter(job => 
      job.scheduledFor <= now && job.attempts < job.options.retries
    );

    if (availableJobs.length === 0) return;

    const job = availableJobs.shift();
    this.jobs = this.jobs.filter(j => j.id !== job.id);
    this.running++;
    this.jobTimestamps.push(now);

    try {
      this.emit('job:started', job);
      
      const result = await this.executeJob(job);
      
      this.stats.completed++;
      this.emit('job:completed', { job, result });
      
    } catch (error) {
      job.attempts++;
      this.stats.retries++;
      
      if (job.attempts >= job.options.retries) {
        this.stats.failed++;
        this.emit('job:failed', { job, error });
      } else {
        job.scheduledFor = Date.now() + job.options.retryDelay;
        this.jobs.push(job);
        this.jobs.sort((a, b) => a.scheduledFor - b.scheduledFor);
        this.emit('job:retry', { job, error, attempt: job.attempts });
      }
    } finally {
      this.running--;
      this.process();
    }
  }
}

/**
 * Queue Manager for multiple queues
 */
class QueueManager {
  constructor() {
    this.queues = new Map();
  }

  /**
   * Create queue
   * @param {string} name - Queue name
   * @param {string} type - Queue type
   * @param {Object} options - Queue options
   * @returns {Queue} Queue instance
   */
  createQueue(name, type = 'default', options = {}) {
    let queue;

    switch (type) {
      case 'priority':
        queue = new PriorityQueue({ name, ...options });
        break;
      case 'delayed':
        queue = new DelayedQueue({ name, ...options });
        break;
      case 'rate-limited':
        queue = new RateLimitedQueue({ name, ...options });
        break;
      default:
        queue = new Queue({ name, ...options });
    }

    this.queues.set(name, queue);
    return queue;
  }

  /**
   * Get queue by name
   * @param {string} name - Queue name
   * @returns {Queue} Queue instance
   */
  getQueue(name) {
    return this.queues.get(name);
  }

  /**
   * Remove queue
   * @param {string} name - Queue name
   * @returns {boolean} Success status
   */
  removeQueue(name) {
    const queue = this.queues.get(name);
    if (queue) {
      if (queue.destroy) {
        queue.destroy();
      }
      this.queues.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Get all queues
   * @returns {Array} Array of queue names
   */
  getQueues() {
    return Array.from(this.queues.keys());
  }

  /**
   * Get all queue statuses
   * @returns {Object} Queue statuses
   */
  getAllStatuses() {
    const statuses = {};
    for (const [name, queue] of this.queues) {
      statuses[name] = queue.getStatus();
    }
    return statuses;
  }

  /**
   * Pause all queues
   */
  pauseAll() {
    for (const queue of this.queues.values()) {
      queue.pause();
    }
  }

  /**
   * Resume all queues
   */
  resumeAll() {
    for (const queue of this.queues.values()) {
      queue.resume();
    }
  }

  /**
   * Clear all queues
   */
  clearAll() {
    for (const queue of this.queues.values()) {
      queue.clear();
    }
  }
}

// Example usage:
// const manager = new QueueManager();
// 
// // Create different types of queues
// const defaultQueue = manager.createQueue('default', 'default', { concurrency: 2 });
// const priorityQueue = manager.createQueue('priority', 'priority', { concurrency: 1 });
// const delayedQueue = manager.createQueue('delayed', 'delayed', { concurrency: 1 });
// const rateLimitedQueue = manager.createQueue('rate-limited', 'rate-limited', { 
//   concurrency: 1, 
//   rateLimit: 10 
// });
// 
// // Add jobs to different queues
// await defaultQueue.add(async () => {
//   console.log('Processing default job');
//   await new Promise(resolve => setTimeout(resolve, 1000));
// });
// 
// await priorityQueue.addHigh(async () => {
//   console.log('Processing high priority job');
// });
// 
// await delayedQueue.addDelayed(async () => {
//   console.log('Processing delayed job');
// }, 5000);
// 
// await rateLimitedQueue.add(async () => {
//   console.log('Processing rate limited job');
// });
// 
// // Listen to events
// defaultQueue.on('job:completed', ({ job, result }) => {
//   console.log(`Job ${job.id} completed`);
// });
// 
// defaultQueue.on('job:failed', ({ job, error }) => {
//   console.log(`Job ${job.id} failed:`, error.message);
// });

module.exports = {
  Queue,
  PriorityQueue,
  DelayedQueue,
  RateLimitedQueue,
  QueueManager
};
