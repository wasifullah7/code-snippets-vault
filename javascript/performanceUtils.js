/**
 * Advanced performance monitoring and optimization utilities
 * @param {Object} options - Configuration options
 * @param {boolean} options.enableLogging - Enable console logging (default: true)
 * @param {number} options.sampleRate - Performance sampling rate (default: 1000)
 * @param {boolean} options.trackMemory - Track memory usage (default: true)
 * @param {boolean} options.trackNetwork - Track network performance (default: true)
 * @returns {Object} Performance utilities
 */
class PerformanceUtils {
    constructor(options = {}) {
      this.options = {
        enableLogging: options.enableLogging !== false,
        sampleRate: options.sampleRate || 1000,
        trackMemory: options.trackMemory !== false,
        trackNetwork: options.trackNetwork !== false,
        ...options
      };
  
      this.metrics = {
        timers: new Map(),
        marks: new Map(),
        measures: new Map(),
        memory: [],
        network: [],
        errors: []
      };
  
      this.observers = new Map();
      this.isMonitoring = false;
      this.sampleInterval = null;
  
      this.initPerformanceObserver();
    }
  
    /**
     * Initialize Performance Observer
     */
    initPerformanceObserver() {
      if (!window.PerformanceObserver) {
        console.warn('PerformanceObserver not supported');
        return;
      }
  
      try {
        // Observe navigation timing
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.metrics.measures.set(entry.name, {
              startTime: entry.startTime,
              duration: entry.duration,
              entryType: entry.entryType,
              timestamp: Date.now()
            });
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation', 'measure'] });
  
        // Observe resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (this.options.trackNetwork) {
              this.metrics.network.push({
                name: entry.name,
                duration: entry.duration,
                transferSize: entry.transferSize,
                decodedBodySize: entry.decodedBodySize,
                initiatorType: entry.initiatorType,
                timestamp: Date.now()
              });
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
  
        this.observers.set('navigation', navigationObserver);
        this.observers.set('resource', resourceObserver);
  
      } catch (error) {
        console.warn('PerformanceObserver initialization failed:', error);
      }
    }
  
    /**
     * Start performance timer
     * @param {string} name - Timer name
     * @returns {string} Timer ID
     */
    startTimer(name) {
      const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.metrics.timers.set(id, {
        name,
        startTime: performance.now(),
        startTimestamp: Date.now()
      });
      
      if (this.options.enableLogging) {
        console.log(`⏱️ Timer started: ${name} (${id})`);
      }
      
      return id;
    }
  
    /**
     * End performance timer
     * @param {string} id - Timer ID
     * @returns {Object} Timer result
     */
    endTimer(id) {
      const timer = this.metrics.timers.get(id);
      if (!timer) {
        throw new Error(`Timer with ID ${id} not found`);
      }
  
      const endTime = performance.now();
      const duration = endTime - timer.startTime;
      
      const result = {
        id,
        name: timer.name,
        duration: Math.round(duration * 100) / 100,
        startTime: timer.startTime,
        endTime,
        startTimestamp: timer.startTimestamp,
        endTimestamp: Date.now()
      };
  
      this.metrics.timers.delete(id);
      
      if (this.options.enableLogging) {
        console.log(`⏱️ Timer ended: ${timer.name} - ${result.duration}ms`);
      }
      
      return result;
    }
  
    /**
     * Measure function execution time
     * @param {Function} fn - Function to measure
     * @param {string} name - Measurement name
     * @param {Array} args - Function arguments
     * @returns {Promise<Object>} Measurement result
     */
    async measureFunction(fn, name = 'anonymous', args = []) {
      const timerId = this.startTimer(name);
      
      try {
        const startMemory = this.getMemoryUsage();
        const result = await fn(...args);
        const endMemory = this.getMemoryUsage();
        
        const timerResult = this.endTimer(timerId);
        
        return {
          ...timerResult,
          result,
          memoryDelta: {
            used: endMemory.used - startMemory.used,
            total: endMemory.total - startMemory.total
          }
        };
      } catch (error) {
        this.endTimer(timerId);
        this.metrics.errors.push({
          name,
          error: error.message,
          timestamp: Date.now()
        });
        throw error;
      }
    }
  
    /**
     * Create performance mark
     * @param {string} name - Mark name
     * @param {Object} detail - Additional details
     */
    mark(name, detail = {}) {
      if (window.performance && window.performance.mark) {
        window.performance.mark(name, { detail });
        this.metrics.marks.set(name, {
          timestamp: performance.now(),
          detail,
          wallTime: Date.now()
        });
        
        if (this.options.enableLogging) {
          console.log(`📍 Mark created: ${name}`, detail);
        }
      }
    }
  
    /**
     * Create performance measure
     * @param {string} name - Measure name
     * @param {string} startMark - Start mark name
     * @param {string} endMark - End mark name
     * @returns {Object} Measure result
     */
    measure(name, startMark, endMark) {
      if (window.performance && window.performance.measure) {
        try {
          const measure = window.performance.measure(name, startMark, endMark);
          
          const result = {
            name,
            duration: measure.duration,
            startTime: measure.startTime,
            endTime: measure.endTime,
            timestamp: Date.now()
          };
          
          this.metrics.measures.set(name, result);
          
          if (this.options.enableLogging) {
            console.log(`📏 Measure created: ${name} - ${result.duration}ms`);
          }
          
          return result;
        } catch (error) {
          console.warn(`Failed to create measure ${name}:`, error);
          return null;
        }
      }
      return null;
    }
  
    /**
     * Get memory usage information
     * @returns {Object} Memory usage data
     */
    getMemoryUsage() {
      if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        return {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        };
      }
      
      // Fallback for browsers without memory API
      return {
        used: 0,
        total: 0,
        limit: 0,
        percentage: 0
      };
    }
  
    /**
     * Start memory monitoring
     * @param {number} interval - Monitoring interval in ms
     */
    startMemoryMonitoring(interval = this.options.sampleRate) {
      if (!this.options.trackMemory) return;
      
      this.sampleInterval = setInterval(() => {
        const memory = this.getMemoryUsage();
        this.metrics.memory.push({
          ...memory,
          timestamp: Date.now()
        });
        
        // Keep only last 1000 samples
        if (this.metrics.memory.length > 1000) {
          this.metrics.memory = this.metrics.memory.slice(-1000);
        }
      }, interval);
      
      this.isMonitoring = true;
      
      if (this.options.enableLogging) {
        console.log('🔍 Memory monitoring started');
      }
    }
  
    /**
     * Stop memory monitoring
     */
    stopMemoryMonitoring() {
      if (this.sampleInterval) {
        clearInterval(this.sampleInterval);
        this.sampleInterval = null;
        this.isMonitoring = false;
        
        if (this.options.enableLogging) {
          console.log('🔍 Memory monitoring stopped');
        }
      }
    }
  
    /**
     * Get network performance metrics
     * @returns {Object} Network metrics
     */
    getNetworkMetrics() {
      if (!this.options.trackNetwork) return {};
      
      const network = this.metrics.network;
      if (network.length === 0) return {};
      
      const totalSize = network.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
      const avgDuration = network.reduce((sum, entry) => sum + entry.duration, 0) / network.length;
      
      return {
        totalRequests: network.length,
        totalSize,
        averageDuration: avgDuration,
        requestsByType: network.reduce((acc, entry) => {
          acc[entry.initiatorType] = (acc[entry.initiatorType] || 0) + 1;
          return acc;
        }, {}),
        slowestRequests: network
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5)
      };
    }
  
    /**
     * Get performance summary
     * @returns {Object} Performance summary
     */
    getPerformanceSummary() {
      const memory = this.getMemoryUsage();
      const network = this.getNetworkMetrics();
      
      const activeTimers = this.metrics.timers.size;
      const totalMarks = this.metrics.marks.size;
      const totalMeasures = this.metrics.measures.size;
      const totalErrors = this.metrics.errors.length;
      
      return {
        memory,
        network,
        timers: {
          active: activeTimers,
          total: this.metrics.timers.size
        },
        marks: totalMarks,
        measures: totalMeasures,
        errors: totalErrors,
        monitoring: this.isMonitoring,
        timestamp: Date.now()
      };
    }
  
    /**
     * Debounce function with performance tracking
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @param {string} name - Performance tracking name
     * @returns {Function} Debounced function
     */
    debounce(fn, delay, name = 'debounced') {
      let timeoutId;
      let lastCallTime = 0;
      
      return function (...args) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallTime;
        
        clearTimeout(timeoutId);
        
        if (timeSinceLastCall > delay) {
          // Execute immediately if enough time has passed
          lastCallTime = now;
          return this.measureFunction(fn, `${name}_immediate`, args);
        } else {
          // Debounce the call
          timeoutId = setTimeout(() => {
            lastCallTime = Date.now();
            return this.measureFunction(fn, `${name}_debounced`, args);
          }, delay);
        }
      }.bind(this);
    }
  
    /**
     * Throttle function with performance tracking
     * @param {Function} fn - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @param {string} name - Performance tracking name
     * @returns {Function} Throttled function
     */
    throttle(fn, limit, name = 'throttled') {
      let inThrottle = false;
      let lastExecTime = 0;
      
      return function (...args) {
        const now = Date.now();
        
        if (!inThrottle) {
          inThrottle = true;
          lastExecTime = now;
          
          this.measureFunction(fn, `${name}_throttled`, args);
          
          setTimeout(() => {
            inThrottle = false;
          }, limit);
        }
      }.bind(this);
    }
  
    /**
     * Monitor DOM mutations
     * @param {Element} target - Target element
     * @param {Function} callback - Callback function
     * @returns {MutationObserver} Observer instance
     */
    monitorDOM(target, callback) {
      if (!window.MutationObserver) {
        console.warn('MutationObserver not supported');
        return null;
      }
      
      const observer = new MutationObserver((mutations) => {
        const performanceData = {
          mutations: mutations.length,
          timestamp: Date.now(),
          memory: this.getMemoryUsage()
        };
        
        callback(mutations, performanceData);
      });
      
      observer.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true
      });
      
      this.observers.set('dom', observer);
      return observer;
    }
  
    /**
     * Clean up resources
     */
    destroy() {
      this.stopMemoryMonitoring();
      
      // Disconnect all observers
      this.observers.forEach(observer => {
        if (observer.disconnect) {
          observer.disconnect();
        }
      });
      
      this.observers.clear();
      this.metrics.timers.clear();
      this.metrics.marks.clear();
      this.metrics.measures.clear();
      this.metrics.memory = [];
      this.metrics.network = [];
      this.metrics.errors = [];
      
      if (this.options.enableLogging) {
        console.log('🧹 Performance utilities cleaned up');
      }
    }
  }
  
  // Example usage:
  // const perf = new PerformanceUtils({
  //   enableLogging: true,
  //   trackMemory: true,
  //   trackNetwork: true,
  //   sampleRate: 2000
  // });
  // 
  // // Start monitoring
  // perf.startMemoryMonitoring();
  // 
  // // Measure function execution
  // const result = await perf.measureFunction(
  //   () => new Promise(resolve => setTimeout(resolve, 1000)),
  //   'async-operation'
  // );
  // console.log('Function took:', result.duration, 'ms');
  // 
  // // Create marks and measures
  // perf.mark('start-process');
  // // ... do work ...
  // perf.mark('end-process');
  // perf.measure('total-process', 'start-process', 'end-process');
  // 
  // // Get performance summary
  // const summary = perf.getPerformanceSummary();
  // console.log('Performance summary:', summary);
  // 
  // // Clean up
  // perf.destroy();
  
  module.exports = PerformanceUtils;