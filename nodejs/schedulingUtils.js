/**
 * Task scheduling utilities for Node.js
 */

const cron = require('node-cron');

/**
 * Schedule a task using cron expression
 * @param {string} cronExpression - Cron expression
 * @param {Function} task - Task function
 * @param {Object} options - Scheduling options
 * @returns {Object} Scheduled task object
 */
const scheduleTask = (cronExpression, task, options = {}) => {
  const {
    name = 'unnamed-task',
    timezone = null,
    scheduled = true,
    runOnInit = false
  } = options;

  const taskOptions = {
    scheduled,
    timezone
  };

  const scheduledTask = cron.schedule(cronExpression, task, taskOptions);

  if (runOnInit) {
    task();
  }

  return {
    name,
    cronExpression,
    task,
    scheduledTask,
    start: () => scheduledTask.start(),
    stop: () => scheduledTask.stop(),
    destroy: () => scheduledTask.destroy(),
    getStatus: () => scheduledTask.getStatus(),
    isRunning: () => scheduledTask.running
  };
};

/**
 * Schedule a one-time task
 * @param {Date|number} when - When to run the task
 * @param {Function} task - Task function
 * @param {Object} options - Options
 * @returns {Object} Scheduled task object
 */
const scheduleOnce = (when, task, options = {}) => {
  const {
    name = 'one-time-task',
    maxRetries = 0,
    retryDelay = 1000
  } = options;

  let timeoutId = null;
  let retryCount = 0;
  let isExecuted = false;

  const executeTask = async () => {
    try {
      await task();
      isExecuted = true;
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++;
        timeoutId = setTimeout(executeTask, retryDelay);
      } else {
        console.error(`Task ${name} failed after ${maxRetries} retries:`, error);
      }
    }
  };

  const delay = when instanceof Date ? when.getTime() - Date.now() : when;
  
  if (delay > 0) {
    timeoutId = setTimeout(executeTask, delay);
  } else {
    executeTask();
  }

  return {
    name,
    when,
    task,
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
    isExecuted: () => isExecuted,
    getRetryCount: () => retryCount
  };
};

/**
 * Schedule a recurring task with interval
 * @param {number} interval - Interval in milliseconds
 * @param {Function} task - Task function
 * @param {Object} options - Options
 * @returns {Object} Scheduled task object
 */
const scheduleInterval = (interval, task, options = {}) => {
  const {
    name = 'interval-task',
    immediate = false,
    maxExecutions = null,
    stopOnError = false
  } = options;

  let intervalId = null;
  let executionCount = 0;
  let isRunning = false;

  const executeTask = async () => {
    if (isRunning) return;
    
    isRunning = true;
    executionCount++;

    try {
      await task();
    } catch (error) {
      console.error(`Task ${name} error:`, error);
      if (stopOnError) {
        stop();
      }
    } finally {
      isRunning = false;
    }

    if (maxExecutions && executionCount >= maxExecutions) {
      stop();
    }
  };

  const start = () => {
    if (!intervalId) {
      if (immediate) {
        executeTask();
      }
      intervalId = setInterval(executeTask, interval);
    }
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  start();

  return {
    name,
    interval,
    task,
    start,
    stop,
    isRunning: () => !!intervalId,
    getExecutionCount: () => executionCount,
    getMaxExecutions: () => maxExecutions
  };
};

/**
 * Task scheduler manager
 */
class TaskScheduler {
  constructor() {
    this.tasks = new Map();
    this.isShutdown = false;
  }

  /**
   * Add a scheduled task
   * @param {string} name - Task name
   * @param {string} cronExpression - Cron expression
   * @param {Function} task - Task function
   * @param {Object} options - Options
   * @returns {Object} Task reference
   */
  addTask(name, cronExpression, task, options = {}) {
    if (this.tasks.has(name)) {
      throw new Error(`Task with name "${name}" already exists`);
    }

    const scheduledTask = scheduleTask(cronExpression, task, { name, ...options });
    this.tasks.set(name, scheduledTask);

    return scheduledTask;
  }

  /**
   * Add a one-time task
   * @param {string} name - Task name
   * @param {Date|number} when - When to run
   * @param {Function} task - Task function
   * @param {Object} options - Options
   * @returns {Object} Task reference
   */
  addOneTimeTask(name, when, task, options = {}) {
    if (this.tasks.has(name)) {
      throw new Error(`Task with name "${name}" already exists`);
    }

    const scheduledTask = scheduleOnce(when, task, { name, ...options });
    this.tasks.set(name, scheduledTask);

    return scheduledTask;
  }

  /**
   * Add an interval task
   * @param {string} name - Task name
   * @param {number} interval - Interval in milliseconds
   * @param {Function} task - Task function
   * @param {Object} options - Options
   * @returns {Object} Task reference
   */
  addIntervalTask(name, interval, task, options = {}) {
    if (this.tasks.has(name)) {
      throw new Error(`Task with name "${name}" already exists`);
    }

    const scheduledTask = scheduleInterval(interval, task, { name, ...options });
    this.tasks.set(name, scheduledTask);

    return scheduledTask;
  }

  /**
   * Remove a task
   * @param {string} name - Task name
   * @returns {boolean} Success status
   */
  removeTask(name) {
    const task = this.tasks.get(name);
    if (task) {
      if (task.destroy) {
        task.destroy();
      } else if (task.cancel) {
        task.cancel();
      } else if (task.stop) {
        task.stop();
      }
      this.tasks.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Start a task
   * @param {string} name - Task name
   * @returns {boolean} Success status
   */
  startTask(name) {
    const task = this.tasks.get(name);
    if (task && task.start) {
      task.start();
      return true;
    }
    return false;
  }

  /**
   * Stop a task
   * @param {string} name - Task name
   * @returns {boolean} Success status
   */
  stopTask(name) {
    const task = this.tasks.get(name);
    if (task && task.stop) {
      task.stop();
      return true;
    }
    return false;
  }

  /**
   * Get task by name
   * @param {string} name - Task name
   * @returns {Object|null} Task object or null
   */
  getTask(name) {
    return this.tasks.get(name) || null;
  }

  /**
   * Get all tasks
   * @returns {Array} Array of task objects
   */
  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  /**
   * Get task names
   * @returns {Array} Array of task names
   */
  getTaskNames() {
    return Array.from(this.tasks.keys());
  }

  /**
   * Get running tasks
   * @returns {Array} Array of running task names
   */
  getRunningTasks() {
    return Array.from(this.tasks.entries())
      .filter(([name, task]) => {
        if (task.isRunning) {
          return task.isRunning();
        }
        if (task.getStatus) {
          return task.getStatus() === 'scheduled';
        }
        return false;
      })
      .map(([name]) => name);
  }

  /**
   * Get task statistics
   * @returns {Object} Task statistics
   */
  getStats() {
    const tasks = Array.from(this.tasks.values());
    const running = tasks.filter(task => {
      if (task.isRunning) return task.isRunning();
      if (task.getStatus) return task.getStatus() === 'scheduled';
      return false;
    }).length;

    return {
      totalTasks: this.tasks.size,
      runningTasks: running,
      stoppedTasks: this.tasks.size - running,
      taskNames: this.getTaskNames()
    };
  }

  /**
   * Start all tasks
   */
  startAllTasks() {
    this.tasks.forEach(task => {
      if (task.start) {
        task.start();
      }
    });
  }

  /**
   * Stop all tasks
   */
  stopAllTasks() {
    this.tasks.forEach(task => {
      if (task.stop) {
        task.stop();
      }
    });
  }

  /**
   * Shutdown scheduler and clean up
   */
  shutdown() {
    if (this.isShutdown) return;

    this.stopAllTasks();
    this.tasks.forEach(task => {
      if (task.destroy) {
        task.destroy();
      }
    });
    this.tasks.clear();
    this.isShutdown = true;
  }

  /**
   * Check if scheduler is shutdown
   * @returns {boolean} Shutdown status
   */
  isShutdown() {
    return this.isShutdown;
  }
}

/**
 * Create a task scheduler instance
 * @returns {TaskScheduler} Scheduler instance
 */
const createScheduler = () => {
  return new TaskScheduler();
};

/**
 * Common cron expressions
 */
const cronExpressions = {
  everyMinute: '* * * * *',
  every5Minutes: '*/5 * * * *',
  every10Minutes: '*/10 * * * *',
  every15Minutes: '*/15 * * * *',
  every30Minutes: '*/30 * * * *',
  everyHour: '0 * * * *',
  every2Hours: '0 */2 * * *',
  every6Hours: '0 */6 * * *',
  every12Hours: '0 */12 * * *',
  everyDay: '0 0 * * *',
  everyDayAt: (hour, minute = 0) => `${minute} ${hour} * * *`,
  everyWeek: '0 0 * * 0',
  everyMonth: '0 0 1 * *',
  everyWeekday: '0 0 * * 1-5',
  everyWeekend: '0 0 * * 0,6'
};

/**
 * Validate cron expression
 * @param {string} cronExpression - Cron expression to validate
 * @returns {boolean} Valid status
 */
const validateCronExpression = (cronExpression) => {
  try {
    return cron.validate(cronExpression);
  } catch (error) {
    return false;
  }
};

/**
 * Parse cron expression
 * @param {string} cronExpression - Cron expression
 * @returns {Object} Parsed cron fields
 */
const parseCronExpression = (cronExpression) => {
  const fields = cronExpression.split(' ');
  if (fields.length !== 5) {
    throw new Error('Invalid cron expression format');
  }

  return {
    minute: fields[0],
    hour: fields[1],
    dayOfMonth: fields[2],
    month: fields[3],
    dayOfWeek: fields[4]
  };
};

/**
 * Get next execution time
 * @param {string} cronExpression - Cron expression
 * @returns {Date|null} Next execution time
 */
const getNextExecution = (cronExpression) => {
  try {
    const task = cron.schedule(cronExpression, () => {});
    const nextDate = task.nextDate();
    task.destroy();
    return nextDate;
  } catch (error) {
    return null;
  }
};

module.exports = {
  scheduleTask,
  scheduleOnce,
  scheduleInterval,
  TaskScheduler,
  createScheduler,
  cronExpressions,
  validateCronExpression,
  parseCronExpression,
  getNextExecution
};
