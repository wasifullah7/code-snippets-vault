/**
 * Theme and dark mode utilities
 */

/**
 * Get system theme preference
 * @returns {string} 'dark' or 'light'
 */
export const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Get stored theme preference
 * @param {string} key - Storage key (default: 'theme')
 * @returns {string|null} Stored theme or null
 */
export const getStoredTheme = (key = 'theme') => {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Failed to get stored theme:', error);
    return null;
  }
};

/**
 * Set stored theme preference
 * @param {string} theme - Theme to store
 * @param {string} key - Storage key (default: 'theme')
 */
export const setStoredTheme = (theme, key = 'theme') => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, theme);
  } catch (error) {
    console.warn('Failed to store theme:', error);
  }
};

/**
 * Get current theme (stored or system)
 * @param {string} key - Storage key (default: 'theme')
 * @returns {string} Current theme
 */
export const getCurrentTheme = (key = 'theme') => {
  return getStoredTheme(key) || getSystemTheme();
};

/**
 * Apply theme to document
 * @param {string} theme - Theme to apply
 * @param {string} selector - CSS selector for theme class (default: 'html')
 */
export const applyTheme = (theme, selector = 'html') => {
  if (typeof document === 'undefined') return;
  
  const element = document.querySelector(selector);
  if (!element) return;
  
  // Remove existing theme classes
  element.classList.remove('light', 'dark', 'auto');
  
  // Add new theme class
  element.classList.add(theme);
  
  // Set data attribute for CSS targeting
  element.setAttribute('data-theme', theme);
  
  // Update meta theme-color for mobile browsers
  updateMetaThemeColor(theme);
};

/**
 * Update meta theme-color for mobile browsers
 * @param {string} theme - Theme name
 */
export const updateMetaThemeColor = (theme) => {
  if (typeof document === 'undefined') return;
  
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    document.head.appendChild(metaThemeColor);
  }
  
  // Set theme color based on theme
  const colors = {
    light: '#ffffff',
    dark: '#000000',
    auto: getSystemTheme() === 'dark' ? '#000000' : '#ffffff'
  };
  
  metaThemeColor.content = colors[theme] || colors.light;
};

/**
 * Toggle between light and dark theme
 * @param {string} key - Storage key (default: 'theme')
 * @returns {string} New theme
 */
export const toggleTheme = (key = 'theme') => {
  const currentTheme = getCurrentTheme(key);
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  setTheme(newTheme, key);
  return newTheme;
};

/**
 * Set theme and apply it
 * @param {string} theme - Theme to set
 * @param {string} key - Storage key (default: 'theme')
 * @param {string} selector - CSS selector for theme class (default: 'html')
 */
export const setTheme = (theme, key = 'theme', selector = 'html') => {
  setStoredTheme(theme, key);
  applyTheme(theme, selector);
};

/**
 * Initialize theme system
 * @param {Object} options - Configuration options
 * @param {string} options.defaultTheme - Default theme (default: 'auto')
 * @param {string} options.storageKey - Storage key (default: 'theme')
 * @param {string} options.selector - CSS selector (default: 'html')
 * @param {Function} options.onThemeChange - Theme change callback
 */
export const initializeTheme = (options = {}) => {
  const {
    defaultTheme = 'auto',
    storageKey = 'theme',
    selector = 'html',
    onThemeChange
  } = options;
  
  // Get initial theme
  const storedTheme = getStoredTheme(storageKey);
  const initialTheme = storedTheme || defaultTheme;
  
  // Apply initial theme
  setTheme(initialTheme, storageKey, selector);
  
  // Listen for system theme changes
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      if (getStoredTheme(storageKey) === 'auto') {
        const systemTheme = e.matches ? 'dark' : 'light';
        applyTheme('auto', selector);
        
        if (onThemeChange) {
          onThemeChange('auto', systemTheme);
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    // Return cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }
  
  return () => {}; // No-op cleanup function
};

/**
 * Create theme CSS variables
 * @param {Object} lightTheme - Light theme colors
 * @param {Object} darkTheme - Dark theme colors
 * @returns {string} CSS string
 */
export const createThemeCSS = (lightTheme, darkTheme) => {
  const createCSSVariables = (theme, prefix = '') => {
    return Object.entries(theme)
      .map(([key, value]) => `  --${prefix}${key}: ${value};`)
      .join('\n');
  };
  
  return `
    :root {
${createCSSVariables(lightTheme)}
    }
    
    [data-theme="dark"] {
${createCSSVariables(darkTheme)}
    }
    
    @media (prefers-color-scheme: dark) {
      [data-theme="auto"] {
${createCSSVariables(darkTheme)}
      }
    }
  `;
};

/**
 * Theme manager class
 */
export class ThemeManager {
  constructor(options = {}) {
    this.options = {
      defaultTheme: 'auto',
      storageKey: 'theme',
      selector: 'html',
      ...options
    };
    
    this.currentTheme = null;
    this.systemTheme = getSystemTheme();
    this.listeners = new Set();
    this.cleanup = null;
  }
  
  /**
   * Initialize theme manager
   */
  init() {
    const storedTheme = getStoredTheme(this.options.storageKey);
    this.currentTheme = storedTheme || this.options.defaultTheme;
    
    this.applyTheme(this.currentTheme);
    this.setupSystemThemeListener();
    
    return this;
  }
  
  /**
   * Apply theme
   * @param {string} theme - Theme to apply
   */
  applyTheme(theme) {
    setTheme(theme, this.options.storageKey, this.options.selector);
    this.currentTheme = theme;
    this.notifyListeners(theme);
  }
  
  /**
   * Toggle theme
   * @returns {string} New theme
   */
  toggle() {
    const current = this.getCurrentTheme();
    const newTheme = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    return newTheme;
  }
  
  /**
   * Get current theme
   * @returns {string} Current theme
   */
  getCurrentTheme() {
    return this.currentTheme || getCurrentTheme(this.options.storageKey);
  }
  
  /**
   * Get resolved theme (actual light/dark)
   * @returns {string} Resolved theme
   */
  getResolvedTheme() {
    const theme = this.getCurrentTheme();
    return theme === 'auto' ? this.systemTheme : theme;
  }
  
  /**
   * Add theme change listener
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
  }
  
  /**
   * Remove theme change listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners
   * @param {string} theme - Theme that changed
   */
  notifyListeners(theme) {
    this.listeners.forEach(listener => {
      try {
        listener(theme, this.getResolvedTheme());
      } catch (error) {
        console.error('Theme listener error:', error);
      }
    });
  }
  
  /**
   * Setup system theme listener
   */
  setupSystemThemeListener() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      this.systemTheme = e.matches ? 'dark' : 'light';
      
      if (this.getCurrentTheme() === 'auto') {
        this.applyTheme('auto');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    this.cleanup = () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }
  
  /**
   * Destroy theme manager
   */
  destroy() {
    if (this.cleanup) {
      this.cleanup();
    }
    this.listeners.clear();
  }
}
