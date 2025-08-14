/**
 * Advanced DOM manipulation utilities for modern JavaScript
 * Collection of commonly needed DOM operations with performance optimizations
 */

/**
 * Create element with attributes and content
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {string|Element} content - Element content
 * @returns {Element} Created element
 */
function createElement(tag, attributes = {}, content = '') {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Set content
  if (content) {
    if (typeof content === 'string') {
      element.textContent = content;
    } else if (content instanceof Element) {
      element.appendChild(content);
    }
  }
  
  return element;
}

/**
 * Add multiple event listeners to element
 * @param {Element} element - Target element
 * @param {Object} events - Event listeners object
 * @returns {Element} Element with listeners added
 */
function addEventListeners(element, events) {
  Object.entries(events).forEach(([event, handler]) => {
    element.addEventListener(event, handler);
  });
  return element;
}

/**
 * Remove multiple event listeners from element
 * @param {Element} element - Target element
 * @param {Object} events - Event listeners object
 * @returns {Element} Element with listeners removed
 */
function removeEventListeners(element, events) {
  Object.entries(events).forEach(([event, handler]) => {
    element.removeEventListener(event, handler);
  });
  return element;
}

/**
 * Toggle element visibility
 * @param {Element} element - Target element
 * @param {boolean} show - Show or hide element
 * @param {string} display - Display value when showing (default: 'block')
 * @returns {Element} Modified element
 */
function toggleVisibility(element, show, display = 'block') {
  element.style.display = show ? display : 'none';
  return element;
}

/**
 * Toggle element class
 * @param {Element} element - Target element
 * @param {string} className - Class name to toggle
 * @param {boolean} force - Force add or remove
 * @returns {Element} Modified element
 */
function toggleClass(element, className, force) {
  element.classList.toggle(className, force);
  return element;
}

/**
 * Add multiple classes to element
 * @param {Element} element - Target element
 * @param {Array|string} classes - Classes to add
 * @returns {Element} Modified element
 */
function addClasses(element, classes) {
  const classArray = Array.isArray(classes) ? classes : classes.split(' ');
  element.classList.add(...classArray);
  return element;
}

/**
 * Remove multiple classes from element
 * @param {Element} element - Target element
 * @param {Array|string} classes - Classes to remove
 * @returns {Element} Modified element
 */
function removeClasses(element, classes) {
  const classArray = Array.isArray(classes) ? classes : classes.split(' ');
  element.classList.remove(...classArray);
  return element;
}

/**
 * Check if element has any of the specified classes
 * @param {Element} element - Target element
 * @param {Array|string} classes - Classes to check
 * @returns {boolean} True if element has any of the classes
 */
function hasAnyClass(element, classes) {
  const classArray = Array.isArray(classes) ? classes : classes.split(' ');
  return classArray.some(className => element.classList.contains(className));
}

/**
 * Get element by selector with fallback
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element (default: document)
 * @returns {Element|null} Found element or null
 */
function getElement(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Get all elements by selector
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element (default: document)
 * @returns {NodeList} Found elements
 */
function getElements(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

/**
 * Get element dimensions and position
 * @param {Element} element - Target element
 * @returns {Object} Element dimensions and position
 */
function getElementRect(element) {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    right: rect.right + window.scrollX,
    bottom: rect.bottom + window.scrollY,
    x: rect.x + window.scrollX,
    y: rect.y + window.scrollY
  };
}

/**
 * Check if element is in viewport
 * @param {Element} element - Target element
 * @param {number} threshold - Visibility threshold (0-1)
 * @returns {boolean} True if element is in viewport
 */
function isInViewport(element, threshold = 0) {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
  const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
  
  const visibleArea = visibleHeight * visibleWidth;
  const totalArea = rect.height * rect.width;
  
  return visibleArea / totalArea > threshold;
}

/**
 * Scroll element into view
 * @param {Element} element - Target element
 * @param {Object} options - Scroll options
 * @returns {Promise} Promise that resolves when scrolling is complete
 */
function scrollIntoView(element, options = {}) {
  const {
    behavior = 'smooth',
    block = 'start',
    inline = 'nearest'
  } = options;
  
  return new Promise((resolve) => {
    element.scrollIntoView({ behavior, block, inline });
    
    if (behavior === 'smooth') {
      setTimeout(resolve, 1000);
    } else {
      resolve();
    }
  });
}

/**
 * Get computed styles for element
 * @param {Element} element - Target element
 * @param {Array} properties - CSS properties to get
 * @returns {Object} Computed styles
 */
function getComputedStyles(element, properties = []) {
  const computed = window.getComputedStyle(element);
  
  if (properties.length === 0) {
    return computed;
  }
  
  return properties.reduce((styles, property) => {
    styles[property] = computed.getPropertyValue(property);
    return styles;
  }, {});
}

/**
 * Set multiple CSS properties on element
 * @param {Element} element - Target element
 * @param {Object} styles - CSS properties object
 * @returns {Element} Modified element
 */
function setStyles(element, styles) {
  Object.assign(element.style, styles);
  return element;
}

/**
 * Get element's text content with whitespace normalization
 * @param {Element} element - Target element
 * @param {boolean} trim - Trim whitespace (default: true)
 * @returns {string} Normalized text content
 */
function getTextContent(element, trim = true) {
  let text = element.textContent || element.innerText || '';
  return trim ? text.trim() : text;
}

/**
 * Set element's text content safely
 * @param {Element} element - Target element
 * @param {string} text - Text content
 * @returns {Element} Modified element
 */
function setTextContent(element, text) {
  element.textContent = text || '';
  return element;
}

/**
 * Get element's HTML content
 * @param {Element} element - Target element
 * @returns {string} HTML content
 */
function getHTML(element) {
  return element.innerHTML;
}

/**
 * Set element's HTML content safely
 * @param {Element} element - Target element
 * @param {string} html - HTML content
 * @returns {Element} Modified element
 */
function setHTML(element, html) {
  element.innerHTML = html || '';
  return element;
}

/**
 * Clone element with all its children
 * @param {Element} element - Target element
 * @param {boolean} deep - Deep clone (default: true)
 * @returns {Element} Cloned element
 */
function cloneElement(element, deep = true) {
  return element.cloneNode(deep);
}

/**
 * Remove element from DOM
 * @param {Element} element - Target element
 * @returns {Element} Removed element
 */
function removeElement(element) {
  if (element.parentNode) {
    element.parentNode.removeChild(element);
  }
  return element;
}

/**
 * Replace element with new element
 * @param {Element} oldElement - Element to replace
 * @param {Element} newElement - New element
 * @returns {Element} New element
 */
function replaceElement(oldElement, newElement) {
  if (oldElement.parentNode) {
    oldElement.parentNode.replaceChild(newElement, oldElement);
  }
  return newElement;
}

/**
 * Insert element after target element
 * @param {Element} target - Target element
 * @param {Element} element - Element to insert
 * @returns {Element} Inserted element
 */
function insertAfter(target, element) {
  if (target.parentNode) {
    target.parentNode.insertBefore(element, target.nextSibling);
  }
  return element;
}

/**
 * Insert element before target element
 * @param {Element} target - Target element
 * @param {Element} element - Element to insert
 * @returns {Element} Inserted element
 */
function insertBefore(target, element) {
  if (target.parentNode) {
    target.parentNode.insertBefore(element, target);
  }
  return element;
}

/**
 * Get all child elements of element
 * @param {Element} element - Target element
 * @param {string} selector - Optional CSS selector filter
 * @returns {Array} Child elements
 */
function getChildren(element, selector = null) {
  const children = Array.from(element.children);
  return selector ? children.filter(child => child.matches(selector)) : children;
}

/**
 * Get parent element with optional selector filter
 * @param {Element} element - Target element
 * @param {string} selector - Optional CSS selector filter
 * @returns {Element|null} Parent element
 */
function getParent(element, selector = null) {
  let parent = element.parentElement;
  
  if (!selector) return parent;
  
  while (parent) {
    if (parent.matches(selector)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  
  return null;
}

/**
 * Get all sibling elements
 * @param {Element} element - Target element
 * @param {string} selector - Optional CSS selector filter
 * @returns {Array} Sibling elements
 */
function getSiblings(element, selector = null) {
  const siblings = Array.from(element.parentElement?.children || []);
  const filtered = siblings.filter(sibling => sibling !== element);
  return selector ? filtered.filter(sibling => sibling.matches(selector)) : filtered;
}

/**
 * Check if element matches selector
 * @param {Element} element - Target element
 * @param {string} selector - CSS selector
 * @returns {boolean} True if element matches selector
 */
function matches(element, selector) {
  return element.matches(selector);
}

/**
 * Find closest ancestor that matches selector
 * @param {Element} element - Target element
 * @param {string} selector - CSS selector
 * @returns {Element|null} Closest matching ancestor
 */
function closest(element, selector) {
  return element.closest(selector);
}

// Example usage:
// const button = createElement('button', {
//   className: 'btn btn-primary',
//   type: 'button'
// }, 'Click me');
// 
// addEventListeners(button, {
//   click: () => console.log('Button clicked'),
//   mouseenter: () => button.style.backgroundColor = 'blue'
// });
// 
// document.body.appendChild(button);
// 
// toggleVisibility(button, false);
// toggleClass(button, 'active', true);
// 
// const rect = getElementRect(button);
// console.log('Button position:', rect);
// 
// if (isInViewport(button)) {
//   console.log('Button is visible');
// }
// 
// setStyles(button, {
//   backgroundColor: 'red',
//   color: 'white',
//   padding: '10px 20px'
// });

module.exports = {
  createElement,
  addEventListeners,
  removeEventListeners,
  toggleVisibility,
  toggleClass,
  addClasses,
  removeClasses,
  hasAnyClass,
  getElement,
  getElements,
  getElementRect,
  isInViewport,
  scrollIntoView,
  getComputedStyles,
  setStyles,
  getTextContent,
  setTextContent,
  getHTML,
  setHTML,
  cloneElement,
  removeElement,
  replaceElement,
  insertAfter,
  insertBefore,
  getChildren,
  getParent,
  getSiblings,
  matches,
  closest
};
