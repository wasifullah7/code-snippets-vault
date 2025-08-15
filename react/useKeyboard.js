import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom React hook for keyboard event handling
 * Provides advanced keyboard interaction capabilities
 * @param {Object} options - Hook options
 * @returns {Object} Keyboard state and handlers
 */
function useKeyboard(options = {}) {
  const {
    target = window,
    preventDefault = false,
    stopPropagation = false,
    enabled = true
  } = options;

  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [lastKey, setLastKey] = useState(null);
  const [keyHistory, setKeyHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [modifiers, setModifiers] = useState({
    ctrl: false,
    alt: false,
    shift: false,
    meta: false
  });

  const keyDownHandler = useCallback((event) => {
    if (!enabled) return;
    
    if (preventDefault) event.preventDefault();
    if (stopPropagation) event.stopPropagation();

    const key = event.key.toLowerCase();
    const code = event.code;
    
    setPressedKeys(prev => new Set([...prev, key]));
    setLastKey({ key, code, timestamp: Date.now() });
    
    setKeyHistory(prev => [...prev.slice(-9), { key, code, timestamp: Date.now() }]);
    
    setModifiers({
      ctrl: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey
    });
    
    setIsTyping(true);
  }, [enabled, preventDefault, stopPropagation]);

  const keyUpHandler = useCallback((event) => {
    if (!enabled) return;
    
    if (preventDefault) event.preventDefault();
    if (stopPropagation) event.stopPropagation();

    const key = event.key.toLowerCase();
    
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
    
    setModifiers({
      ctrl: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey
    });
    
    // Reset typing state after a delay
    setTimeout(() => setIsTyping(false), 1000);
  }, [enabled, preventDefault, stopPropagation]);

  useEffect(() => {
    if (!enabled) return;
    
    target.addEventListener('keydown', keyDownHandler);
    target.addEventListener('keyup', keyUpHandler);
    
    return () => {
      target.removeEventListener('keydown', keyDownHandler);
      target.removeEventListener('keyup', keyUpHandler);
    };
  }, [target, keyDownHandler, keyUpHandler, enabled]);

  return {
    pressedKeys,
    lastKey,
    keyHistory,
    isTyping,
    modifiers,
    isKeyPressed: (key) => pressedKeys.has(key.toLowerCase()),
    isModifierPressed: (modifier) => modifiers[modifier] || false,
    clearHistory: () => setKeyHistory([])
  };
}

/**
 * Hook for specific key combinations
 * @param {Array} keys - Array of keys to listen for
 * @param {Function} callback - Callback function
 * @param {Object} options - Hook options
 */
function useKeyCombination(keys, callback, options = {}) {
  const { target = window, enabled = true } = options;
  const [isActive, setIsActive] = useState(false);
  
  const keyDownHandler = useCallback((event) => {
    if (!enabled) return;
    
    const pressedKeys = new Set();
    const key = event.key.toLowerCase();
    pressedKeys.add(key);
    
    if (event.ctrlKey) pressedKeys.add('ctrl');
    if (event.altKey) pressedKeys.add('alt');
    if (event.shiftKey) pressedKeys.add('shift');
    if (event.metaKey) pressedKeys.add('meta');
    
    const allKeysPressed = keys.every(k => pressedKeys.has(k.toLowerCase()));
    
    if (allKeysPressed && !isActive) {
      setIsActive(true);
      callback(event);
    }
  }, [keys, callback, enabled, isActive]);
  
  const keyUpHandler = useCallback(() => {
    setIsActive(false);
  }, []);
  
  useEffect(() => {
    if (!enabled) return;
    
    target.addEventListener('keydown', keyDownHandler);
    target.addEventListener('keyup', keyUpHandler);
    
    return () => {
      target.removeEventListener('keydown', keyDownHandler);
      target.removeEventListener('keyup', keyUpHandler);
    };
  }, [target, keyDownHandler, keyUpHandler, enabled]);
}

/**
 * Hook for keyboard shortcuts
 * @param {Object} shortcuts - Shortcuts configuration
 * @param {Object} options - Hook options
 */
function useKeyboardShortcuts(shortcuts, options = {}) {
  const { target = window, enabled = true } = options;
  
  const keyDownHandler = useCallback((event) => {
    if (!enabled) return;
    
    const pressedKeys = new Set();
    const key = event.key.toLowerCase();
    pressedKeys.add(key);
    
    if (event.ctrlKey) pressedKeys.add('ctrl');
    if (event.altKey) pressedKeys.add('alt');
    if (event.shiftKey) pressedKeys.add('shift');
    if (event.metaKey) pressedKeys.add('meta');
    
    const keyCombo = Array.from(pressedKeys).sort().join('+');
    
    if (shortcuts[keyCombo]) {
      event.preventDefault();
      shortcuts[keyCombo](event);
    }
  }, [shortcuts, enabled]);
  
  useEffect(() => {
    if (!enabled) return;
    
    target.addEventListener('keydown', keyDownHandler);
    
    return () => {
      target.removeEventListener('keydown', keyDownHandler);
    };
  }, [target, keyDownHandler, enabled]);
}

/**
 * Hook for typing detection
 * @param {Object} options - Hook options
 */
function useTyping(options = {}) {
  const { 
    target = window, 
    enabled = true, 
    idleTime = 1000,
    minLength = 1 
  } = options;
  
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [lastTyped, setLastTyped] = useState(null);
  const timeoutRef = useRef(null);
  
  const keyDownHandler = useCallback((event) => {
    if (!enabled) return;
    
    // Ignore modifier keys and special keys
    if (event.ctrlKey || event.altKey || event.metaKey || 
        event.key.length > 1 || event.key === 'Shift') {
      return;
    }
    
    setIsTyping(true);
    setLastTyped(Date.now());
    
    if (event.key === 'Backspace') {
      setTypedText(prev => prev.slice(0, -1));
    } else if (event.key === 'Enter') {
      setTypedText('');
    } else {
      setTypedText(prev => prev + event.key);
    }
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, idleTime);
  }, [enabled, idleTime]);
  
  useEffect(() => {
    if (!enabled) return;
    
    target.addEventListener('keydown', keyDownHandler);
    
    return () => {
      target.removeEventListener('keydown', keyDownHandler);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [target, keyDownHandler, enabled]);
  
  return {
    isTyping,
    typedText,
    lastTyped,
    hasTypedEnough: typedText.length >= minLength,
    clearText: () => setTypedText('')
  };
}

/**
 * Hook for keyboard navigation
 * @param {Object} options - Hook options
 */
function useKeyboardNavigation(options = {}) {
  const { 
    target = window, 
    enabled = true,
    items = [],
    initialIndex = 0,
    loop = true 
  } = options;
  
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [focused, setFocused] = useState(false);
  
  const keyDownHandler = useCallback((event) => {
    if (!enabled || items.length === 0) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setCurrentIndex(prev => {
          if (prev < items.length - 1) return prev + 1;
          return loop ? 0 : prev;
        });
        break;
      case 'ArrowUp':
        event.preventDefault();
        setCurrentIndex(prev => {
          if (prev > 0) return prev - 1;
          return loop ? items.length - 1 : prev;
        });
        break;
      case 'Home':
        event.preventDefault();
        setCurrentIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setCurrentIndex(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (items[currentIndex]?.onSelect) {
          items[currentIndex].onSelect();
        }
        break;
    }
  }, [enabled, items, currentIndex, loop]);
  
  const focusHandler = useCallback(() => {
    setFocused(true);
  }, []);
  
  const blurHandler = useCallback(() => {
    setFocused(false);
  }, []);
  
  useEffect(() => {
    if (!enabled) return;
    
    target.addEventListener('keydown', keyDownHandler);
    target.addEventListener('focus', focusHandler);
    target.addEventListener('blur', blurHandler);
    
    return () => {
      target.removeEventListener('keydown', keyDownHandler);
      target.removeEventListener('focus', focusHandler);
      target.removeEventListener('blur', blurHandler);
    };
  }, [target, keyDownHandler, focusHandler, blurHandler, enabled]);
  
  return {
    currentIndex,
    currentItem: items[currentIndex] || null,
    focused,
    goToIndex: setCurrentIndex,
    goToNext: () => setCurrentIndex(prev => 
      prev < items.length - 1 ? prev + 1 : (loop ? 0 : prev)
    ),
    goToPrevious: () => setCurrentIndex(prev => 
      prev > 0 ? prev - 1 : (loop ? items.length - 1 : prev)
    ),
    goToFirst: () => setCurrentIndex(0),
    goToLast: () => setCurrentIndex(items.length - 1)
  };
}

/**
 * Hook for keyboard accessibility
 * @param {Object} options - Hook options
 */
function useKeyboardAccessibility(options = {}) {
  const { 
    target = window, 
    enabled = true,
    onEscape,
    onEnter,
    onSpace,
    onTab,
    onArrowKeys 
  } = options;
  
  const keyDownHandler = useCallback((event) => {
    if (!enabled) return;
    
    switch (event.key) {
      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape(event);
        }
        break;
      case 'Enter':
        if (onEnter) {
          event.preventDefault();
          onEnter(event);
        }
        break;
      case ' ':
        if (onSpace) {
          event.preventDefault();
          onSpace(event);
        }
        break;
      case 'Tab':
        if (onTab) {
          onTab(event);
        }
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (onArrowKeys) {
          event.preventDefault();
          onArrowKeys(event);
        }
        break;
    }
  }, [enabled, onEscape, onEnter, onSpace, onTab, onArrowKeys]);
  
  useEffect(() => {
    if (!enabled) return;
    
    target.addEventListener('keydown', keyDownHandler);
    
    return () => {
      target.removeEventListener('keydown', keyDownHandler);
    };
  }, [target, keyDownHandler, enabled]);
}

export {
  useKeyboard,
  useKeyCombination,
  useKeyboardShortcuts,
  useTyping,
  useKeyboardNavigation,
  useKeyboardAccessibility
};

export default useKeyboard;
