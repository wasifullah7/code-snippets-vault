/**
 * Advanced event handling utilities for modern JavaScript
 * Collection of commonly needed event operations with performance optimizations
 */

/**
 * Event delegation handler
 * @param {string} selector - CSS selector for target elements
 * @param {string} eventType - Type of event to listen for
 * @param {Function} handler - Event handler function
 * @param {Element} container - Container element (default: document)
 * @returns {Function} Remove function
 */
function delegate(selector, eventType, handler, container = document) {
  const eventHandler = (event) => {
    const target = event.target.closest(selector);
    if (target && container.contains(target)) {
      handler.call(target, event, target);
    }
  };

  container.addEventListener(eventType, eventHandler, true);
  
  return () => {
    container.removeEventListener(eventType, eventHandler, true);
  };
}

/**
 * Throttled event handler
 * @param {Function} handler - Event handler function
 * @param {number} delay - Throttle delay in milliseconds
 * @returns {Function} Throttled handler
 */
function throttle(handler, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return handler.apply(this, args);
    }
  };
}

/**
 * Debounced event handler
 * @param {Function} handler - Event handler function
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced handler
 */
function debounce(handler, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      handler.apply(this, args);
    }, delay);
  };
}

/**
 * Add multiple event listeners to element
 * @param {Element} element - Target element
 * @param {Object} events - Event listeners object
 * @returns {Function} Remove function
 */
function addEventListeners(element, events) {
  const handlers = [];
  
  Object.entries(events).forEach(([eventType, handler]) => {
    element.addEventListener(eventType, handler);
    handlers.push({ eventType, handler });
  });
  
  return () => {
    handlers.forEach(({ eventType, handler }) => {
      element.removeEventListener(eventType, handler);
    });
  };
}

/**
 * Remove multiple event listeners from element
 * @param {Element} element - Target element
 * @param {Object} events - Event listeners object
 */
function removeEventListeners(element, events) {
  Object.entries(events).forEach(([eventType, handler]) => {
    element.removeEventListener(eventType, handler);
  });
}

/**
 * Create custom event
 * @param {string} eventName - Event name
 * @param {Object} detail - Event detail data
 * @param {Object} options - Event options
 * @returns {CustomEvent} Custom event
 */
function createCustomEvent(eventName, detail = {}, options = {}) {
  return new CustomEvent(eventName, {
    detail,
    bubbles: options.bubbles !== false,
    cancelable: options.cancelable !== false,
    composed: options.composed || false
  });
}

/**
 * Dispatch custom event
 * @param {Element} element - Target element
 * @param {string} eventName - Event name
 * @param {Object} detail - Event detail data
 * @param {Object} options - Event options
 * @returns {boolean} Event was cancelled
 */
function dispatchCustomEvent(element, eventName, detail = {}, options = {}) {
  const event = createCustomEvent(eventName, detail, options);
  return element.dispatchEvent(event);
}

/**
 * Event listener with automatic cleanup
 * @param {Element} element - Target element
 * @param {string} eventType - Event type
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 * @returns {Function} Remove function
 */
function addEventListener(element, eventType, handler, options = {}) {
  element.addEventListener(eventType, handler, options);
  
  return () => {
    element.removeEventListener(eventType, handler, options);
  };
}

/**
 * One-time event listener
 * @param {Element} element - Target element
 * @param {string} eventType - Event type
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 * @returns {Function} Remove function
 */
function addOneTimeListener(element, eventType, handler, options = {}) {
  const wrappedHandler = (event) => {
    handler(event);
    element.removeEventListener(eventType, wrappedHandler, options);
  };
  
  element.addEventListener(eventType, wrappedHandler, options);
  
  return () => {
    element.removeEventListener(eventType, wrappedHandler, options);
  };
}

/**
 * Event listener with condition
 * @param {Element} element - Target element
 * @param {string} eventType - Event type
 * @param {Function} condition - Condition function
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 * @returns {Function} Remove function
 */
function addConditionalListener(element, eventType, condition, handler, options = {}) {
  const wrappedHandler = (event) => {
    if (condition(event)) {
      handler(event);
    }
  };
  
  element.addEventListener(eventType, wrappedHandler, options);
  
  return () => {
    element.removeEventListener(eventType, wrappedHandler, options);
  };
}

/**
 * Prevent default and stop propagation
 * @param {Event} event - Event object
 */
function preventAndStop(event) {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Get event target with fallback
 * @param {Event} event - Event object
 * @returns {Element} Target element
 */
function getEventTarget(event) {
  return event.target || event.srcElement;
}

/**
 * Get event coordinates
 * @param {Event} event - Event object
 * @returns {Object} Coordinates object
 */
function getEventCoordinates(event) {
  if (event.touches && event.touches[0]) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
  }
  
  return {
    x: event.clientX || 0,
    y: event.clientY || 0
  };
}

/**
 * Check if event is from keyboard
 * @param {Event} event - Event object
 * @returns {boolean} True if keyboard event
 */
function isKeyboardEvent(event) {
  return event.type.startsWith('key');
}

/**
 * Check if event is from mouse
 * @param {Event} event - Event object
 * @returns {boolean} True if mouse event
 */
function isMouseEvent(event) {
  return event.type.startsWith('mouse');
}

/**
 * Check if event is from touch
 * @param {Event} event - Event object
 * @returns {boolean} True if touch event
 */
function isTouchEvent(event) {
  return event.type.startsWith('touch');
}

/**
 * Get key code with fallback
 * @param {KeyboardEvent} event - Keyboard event
 * @returns {string} Key code
 */
function getKeyCode(event) {
  return event.code || event.keyCode || event.which;
}

/**
 * Check if specific key was pressed
 * @param {KeyboardEvent} event - Keyboard event
 * @param {string} key - Key to check
 * @returns {boolean} True if key was pressed
 */
function isKeyPressed(event, key) {
  return getKeyCode(event) === key;
}

/**
 * Check if modifier key is pressed
 * @param {KeyboardEvent} event - Keyboard event
 * @param {string} modifier - Modifier key (ctrl, alt, shift, meta)
 * @returns {boolean} True if modifier is pressed
 */
function isModifierPressed(event, modifier) {
  const modifiers = {
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey
  };
  
  return modifiers[modifier] || false;
}

/**
 * Event bus for custom event handling
 */
class EventBus {
  constructor() {
    this.events = {};
  }

  /**
   * Subscribe to event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(handler);
    
    return () => {
      this.off(event, handler);
    };
  }

  /**
   * Unsubscribe from event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  off(event, handler) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(h => h !== handler);
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    });
  }

  /**
   * Subscribe once to event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {Function} Unsubscribe function
   */
  once(event, handler) {
    const onceHandler = (data) => {
      handler(data);
      this.off(event, onceHandler);
    };
    
    return this.on(event, onceHandler);
  }

  /**
   * Clear all events
   */
  clear() {
    this.events = {};
  }
}

// Example usage:
// const removeClick = addEventListener(button, 'click', (e) => {
//   console.log('Button clicked');
// });
// 
// const removeDelegated = delegate('.item', 'click', (e, target) => {
//   console.log('Item clicked:', target);
// });
// 
// const throttledScroll = throttle((e) => {
//   console.log('Scroll throttled');
// }, 100);
// 
// const debouncedResize = debounce((e) => {
//   console.log('Resize debounced');
// }, 250);
// 
// const eventBus = new EventBus();
// const unsubscribe = eventBus.on('userLogin', (user) => {
//   console.log('User logged in:', user);
// });
// 
// eventBus.emit('userLogin', { id: 1, name: 'John' });

module.exports = {
  delegate,
  throttle,
  debounce,
  addEventListeners,
  removeEventListeners,
  createCustomEvent,
  dispatchCustomEvent,
  addEventListener,
  addOneTimeListener,
  addConditionalListener,
  preventAndStop,
  getEventTarget,
  getEventCoordinates,
  isKeyboardEvent,
  isMouseEvent,
  isTouchEvent,
  getKeyCode,
  isKeyPressed,
  isModifierPressed,
  EventBus
};
