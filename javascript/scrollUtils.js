/**
 * Scroll-related utility functions
 */

/**
 * Smooth scroll to element
 * @param {Element|string} target - Element or selector
 * @param {Object} options - Scroll options
 */
export const scrollToElement = (target, options = {}) => {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return;

  const {
    behavior = 'smooth',
    block = 'start',
    inline = 'nearest',
    offset = 0
  } = options;

  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior
  });
};

/**
 * Scroll to top of page
 * @param {Object} options - Scroll options
 */
export const scrollToTop = (options = {}) => {
  const { behavior = 'smooth' } = options;
  window.scrollTo({ top: 0, behavior });
};

/**
 * Scroll to bottom of page
 * @param {Object} options - Scroll options
 */
export const scrollToBottom = (options = {}) => {
  const { behavior = 'smooth' } = options;
  window.scrollTo({ 
    top: document.documentElement.scrollHeight, 
    behavior 
  });
};

/**
 * Check if element is in viewport
 * @param {Element} element - DOM element
 * @param {number} threshold - Visibility threshold (0-1)
 * @returns {boolean} True if element is visible
 */
export const isInViewport = (element, threshold = 0) => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const verticalVisible = (rect.top <= windowHeight * (1 - threshold)) && 
                         (rect.bottom >= windowHeight * threshold);
  const horizontalVisible = (rect.left <= windowWidth * (1 - threshold)) && 
                           (rect.right >= windowWidth * threshold);
  
  return verticalVisible && horizontalVisible;
};

/**
 * Get current scroll position
 * @returns {Object} Scroll position {x, y}
 */
export const getScrollPosition = () => ({
  x: window.pageXOffset || document.documentElement.scrollLeft,
  y: window.pageYOffset || document.documentElement.scrollTop
});

/**
 * Lock body scroll
 */
export const lockScroll = () => {
  document.body.style.overflow = 'hidden';
};

/**
 * Unlock body scroll
 */
export const unlockScroll = () => {
  document.body.style.overflow = '';
};

/**
 * Check if page is scrolled to bottom
 * @param {number} threshold - Threshold in pixels
 * @returns {boolean} True if at bottom
 */
export const isAtBottom = (threshold = 0) => {
  return (window.innerHeight + window.scrollY) >= 
         (document.body.offsetHeight - threshold);
};

/**
 * Scroll-related utility functions
 */

/**
 * Smooth scroll to element
 * @param {Element|string} target - Element or selector
 * @param {Object} options - Scroll options
 */
export const scrollToElement = (target, options = {}) => {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return;

  const {
    behavior = 'smooth',
    block = 'start',
    inline = 'nearest',
    offset = 0
  } = options;

  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior
  });
};

/**
 * Scroll to top of page
 * @param {Object} options - Scroll options
 */
export const scrollToTop = (options = {}) => {
  const { behavior = 'smooth' } = options;
  window.scrollTo({ top: 0, behavior });
};

/**
 * Scroll to bottom of page
 * @param {Object} options - Scroll options
 */
export const scrollToBottom = (options = {}) => {
  const { behavior = 'smooth' } = options;
  window.scrollTo({ 
    top: document.documentElement.scrollHeight, 
    behavior 
  });
};

/**
 * Check if element is in viewport
 * @param {Element} element - DOM element
 * @param {number} threshold - Visibility threshold (0-1)
 * @returns {boolean} True if element is visible
 */
export const isInViewport = (element, threshold = 0) => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const verticalVisible = (rect.top <= windowHeight * (1 - threshold)) && 
                         (rect.bottom >= windowHeight * threshold);
  const horizontalVisible = (rect.left <= windowWidth * (1 - threshold)) && 
                           (rect.right >= windowWidth * threshold);
  
  return verticalVisible && horizontalVisible;
};

/**
 * Get current scroll position
 * @returns {Object} Scroll position {x, y}
 */
export const getScrollPosition = () => ({
  x: window.pageXOffset || document.documentElement.scrollLeft,
  y: window.pageYOffset || document.documentElement.scrollTop
});

/**
 * Lock body scroll
 */
export const lockScroll = () => {
  document.body.style.overflow = 'hidden';
};

/**
 * Unlock body scroll
 */
export const unlockScroll = () => {
  document.body.style.overflow = '';
};

/**
 * Check if page is scrolled to bottom
 * @param {number} threshold - Threshold in pixels
 * @returns {boolean} True if at bottom
 */
export const isAtBottom = (threshold = 0) => {
  return (window.innerHeight + window.scrollY) >= 
         (document.body.offsetHeight - threshold);
};
