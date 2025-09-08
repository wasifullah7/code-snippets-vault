/**
 * Animation utility functions for DOM elements
 */

/**
 * Fade in element
 * @param {Element} element - Element to fade in
 * @param {number} duration - Animation duration in ms
 * @param {string} display - Display value when showing
 * @returns {Promise} Promise that resolves when animation completes
 */
const fadeIn = (element, duration = 300, display = 'block') => {
  return new Promise((resolve) => {
    element.style.opacity = '0';
    element.style.display = display;
    
    const start = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = progress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};

/**
 * Fade out element
 * @param {Element} element - Element to fade out
 * @param {number} duration - Animation duration in ms
 * @returns {Promise} Promise that resolves when animation completes
 */
const fadeOut = (element, duration = 300) => {
  return new Promise((resolve) => {
    const start = performance.now();
    const startOpacity = parseFloat(getComputedStyle(element).opacity);
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = startOpacity * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};

/**
 * Slide down element
 * @param {Element} element - Element to slide down
 * @param {number} duration - Animation duration in ms
 * @returns {Promise} Promise that resolves when animation completes
 */
const slideDown = (element, duration = 300) => {
  return new Promise((resolve) => {
    element.style.height = '0px';
    element.style.overflow = 'hidden';
    element.style.display = 'block';
    
    const targetHeight = element.scrollHeight;
    const start = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.height = (targetHeight * progress) + 'px';
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.height = 'auto';
        element.style.overflow = '';
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};

/**
 * Slide up element
 * @param {Element} element - Element to slide up
 * @param {number} duration - Animation duration in ms
 * @returns {Promise} Promise that resolves when animation completes
 */
const slideUp = (element, duration = 300) => {
  return new Promise((resolve) => {
    const startHeight = element.offsetHeight;
    element.style.height = startHeight + 'px';
    element.style.overflow = 'hidden';
    
    const start = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.height = (startHeight * (1 - progress)) + 'px';
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
        element.style.height = '';
        element.style.overflow = '';
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};

/**
 * Animate element properties
 * @param {Element} element - Element to animate
 * @param {Object} properties - CSS properties to animate
 * @param {number} duration - Animation duration in ms
 * @param {string} easing - Easing function
 * @returns {Promise} Promise that resolves when animation completes
 */
const animate = (element, properties, duration = 300, easing = 'ease') => {
  return new Promise((resolve) => {
    const start = performance.now();
    const startValues = {};
    
    Object.keys(properties).forEach(prop => {
      startValues[prop] = parseFloat(getComputedStyle(element)[prop]) || 0;
    });
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      Object.entries(properties).forEach(([prop, targetValue]) => {
        const startValue = startValues[prop];
        const currentValue = startValue + (targetValue - startValue) * progress;
        element.style[prop] = currentValue + (prop.includes('opacity') ? '' : 'px');
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};

/**
 * Bounce animation
 * @param {Element} element - Element to bounce
 * @param {number} duration - Animation duration in ms
 * @returns {Promise} Promise that resolves when animation completes
 */
const bounce = (element, duration = 600) => {
  return new Promise((resolve) => {
    const start = performance.now();
    const startScale = 1;
    const bounceScale = 1.2;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      let scale;
      if (progress < 0.5) {
        scale = startScale + (bounceScale - startScale) * (progress * 2);
      } else {
        scale = bounceScale - (bounceScale - startScale) * ((progress - 0.5) * 2);
      }
      
      element.style.transform = `scale(${scale})`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.transform = '';
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};

/**
 * Shake animation
 * @param {Element} element - Element to shake
 * @param {number} duration - Animation duration in ms
 * @param {number} intensity - Shake intensity
 * @returns {Promise} Promise that resolves when animation completes
 */
const shake = (element, duration = 500, intensity = 10) => {
  return new Promise((resolve) => {
    const start = performance.now();
    const startX = 0;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      const shakeX = Math.sin(progress * Math.PI * 10) * intensity * (1 - progress);
      element.style.transform = `translateX(${shakeX}px)`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.transform = '';
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};

/**
 * Pulse animation
 * @param {Element} element - Element to pulse
 * @param {number} duration - Animation duration in ms
 * @param {number} scale - Pulse scale
 * @returns {Promise} Promise that resolves when animation completes
 */
const pulse = (element, duration = 1000, scale = 1.1) => {
  return new Promise((resolve) => {
    const start = performance.now();
    const startScale = 1;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      const pulseScale = startScale + Math.sin(progress * Math.PI * 2) * (scale - startScale) * 0.5;
      element.style.transform = `scale(${pulseScale})`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.transform = '';
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};

/**
 * Rotate animation
 * @param {Element} element - Element to rotate
 * @param {number} duration - Animation duration in ms
 * @param {number} degrees - Rotation degrees
 * @returns {Promise} Promise that resolves when animation completes
 */
const rotate = (element, duration = 1000, degrees = 360) => {
  return new Promise((resolve) => {
    const start = performance.now();
    const startRotation = 0;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentRotation = startRotation + (degrees * progress);
      element.style.transform = `rotate(${currentRotation}deg)`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.transform = '';
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};

/**
 * Slide element from direction
 * @param {Element} element - Element to slide
 * @param {string} direction - Slide direction ('left', 'right', 'up', 'down')
 * @param {number} duration - Animation duration in ms
 * @returns {Promise} Promise that resolves when animation completes
 */
const slideFrom = (element, direction = 'left', duration = 300) => {
  return new Promise((resolve) => {
    const start = performance.now();
    const startValues = {
      left: { x: -element.offsetWidth, y: 0 },
      right: { x: element.offsetWidth, y: 0 },
      up: { x: 0, y: -element.offsetHeight },
      down: { x: 0, y: element.offsetHeight }
    };
    
    const startValue = startValues[direction] || startValues.left;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentX = startValue.x * (1 - progress);
      const currentY = startValue.y * (1 - progress);
      
      element.style.transform = `translate(${currentX}px, ${currentY}px)`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.transform = '';
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};

/**
 * Stop all animations on element
 * @param {Element} element - Element to stop animations on
 */
const stopAnimations = (element) => {
  element.style.animation = 'none';
  element.style.transition = 'none';
  element.style.transform = '';
  element.style.opacity = '';
  element.style.height = '';
  element.style.width = '';
};

/**
 * Check if element is animating
 * @param {Element} element - Element to check
 * @returns {boolean} True if element is animating
 */
const isAnimating = (element) => {
  const computedStyle = getComputedStyle(element);
  return computedStyle.animationName !== 'none' || computedStyle.transitionProperty !== 'none';
};

module.exports = {
  fadeIn,
  fadeOut,
  slideDown,
  slideUp,
  animate,
  bounce,
  shake,
  pulse,
  rotate,
  slideFrom,
  stopAnimations,
  isAnimating
};
