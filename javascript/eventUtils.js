/**
 * Event handling utilities
 */
const delegate = (selector, event, handler, parent = document) => {
  const delegatedHandler = (e) => {
    if (e.target.matches(selector)) {
      handler(e, e.target);
    }
  };
  parent.addEventListener(event, delegatedHandler);
  return () => parent.removeEventListener(event, delegatedHandler);
};

const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const debounce = (func, delay, immediate = false) => {
  let timeout;
  return function(...args) {
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    }, delay);
    if (callNow) func.apply(this, args);
  };
};

const addEventListeners = (element, events) => {
  Object.entries(events).forEach(([event, handler]) => {
    element.addEventListener(event, handler);
  });
  return element;
};

const createCustomEvent = (eventName, detail = {}) => {
  return new CustomEvent(eventName, { detail });
};

const dispatchCustomEvent = (element, eventName, detail = {}) => {
  const event = createCustomEvent(eventName, detail);
  element.dispatchEvent(event);
};

module.exports = {
  delegate, throttle, debounce, addEventListeners, 
  createCustomEvent, dispatchCustomEvent
};