/**
 * CSS class manipulation utilities
 */

/**
 * Add classes to element
 * @param {Element} element - DOM element
 * @param {...string} classes - Classes to add
 */
export const addClasses = (element, ...classes) => {
  element.classList.add(...classes);
};

/**
 * Remove classes from element
 * @param {Element} element - DOM element
 * @param {...string} classes - Classes to remove
 */
export const removeClasses = (element, ...classes) => {
  element.classList.remove(...classes);
};

/**
 * Toggle class on element
 * @param {Element} element - DOM element
 * @param {string} className - Class to toggle
 * @param {boolean} force - Force add/remove
 * @returns {boolean} True if class was added
 */
export const toggleClass = (element, className, force) => {
  return element.classList.toggle(className, force);
};

/**
 * Check if element has class
 * @param {Element} element - DOM element
 * @param {string} className - Class to check
 * @returns {boolean} True if element has class
 */
export const hasClass = (element, className) => {
  return element.classList.contains(className);
};

/**
 * Replace class on element
 * @param {Element} element - DOM element
 * @param {string} oldClass - Class to remove
 * @param {string} newClass - Class to add
 */
export const replaceClass = (element, oldClass, newClass) => {
  element.classList.remove(oldClass);
  element.classList.add(newClass);
};

/**
 * Get all classes of element
 * @param {Element} element - DOM element
 * @returns {Array} Array of class names
 */
export const getClasses = (element) => {
  return Array.from(element.classList);
};

/**
 * Set classes on element (replaces all existing)
 * @param {Element} element - DOM element
 * @param {string|Array} classes - Classes to set
 */
export const setClasses = (element, classes) => {
  const classList = Array.isArray(classes) ? classes : classes.split(' ');
  element.className = classList.join(' ');
};

/**
 * CSS class manipulation utilities
 */

/**
 * Add classes to element
 * @param {Element} element - DOM element
 * @param {...string} classes - Classes to add
 */
export const addClasses = (element, ...classes) => {
  element.classList.add(...classes);
};

/**
 * Remove classes from element
 * @param {Element} element - DOM element
 * @param {...string} classes - Classes to remove
 */
export const removeClasses = (element, ...classes) => {
  element.classList.remove(...classes);
};

/**
 * Toggle class on element
 * @param {Element} element - DOM element
 * @param {string} className - Class to toggle
 * @param {boolean} force - Force add/remove
 * @returns {boolean} True if class was added
 */
export const toggleClass = (element, className, force) => {
  return element.classList.toggle(className, force);
};

/**
 * Check if element has class
 * @param {Element} element - DOM element
 * @param {string} className - Class to check
 * @returns {boolean} True if element has class
 */
export const hasClass = (element, className) => {
  return element.classList.contains(className);
};

/**
 * Replace class on element
 * @param {Element} element - DOM element
 * @param {string} oldClass - Class to remove
 * @param {string} newClass - Class to add
 */
export const replaceClass = (element, oldClass, newClass) => {
  element.classList.remove(oldClass);
  element.classList.add(newClass);
};

/**
 * Get all classes of element
 * @param {Element} element - DOM element
 * @returns {Array} Array of class names
 */
export const getClasses = (element) => {
  return Array.from(element.classList);
};

/**
 * Set classes on element (replaces all existing)
 * @param {Element} element - DOM element
 * @param {string|Array} classes - Classes to set
 */
export const setClasses = (element, classes) => {
  const classList = Array.isArray(classes) ? classes : classes.split(' ');
  element.className = classList.join(' ');
};
