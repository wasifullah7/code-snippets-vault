import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom React hook for keyboard event handling
 * @param {Object} options - Configuration options
 * @param {boolean} options.preventDefault - Prevent default behavior (default: false)
 * @param {boolean} options.stopPropagation - Stop event propagation (default: false)
 * @param {Element} options.target - Target element (default: window)
 * @returns {Object} Keyboard state and utilities
 */
export default function useKeyboard(options = {}) {
  const {
    preventDefault = false,
    stopPropagation = false,
    target = window
  } = options;

  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [lastKey, setLastKey] = useState(null);
  const [keyCombo, setKeyCombo] = useState([]);
  const [isListening, setIsListening] = useState(false);
  
  const handlersRef = useRef(new Map());
  const keyComboRef = useRef([]);
  const keyComboTimeoutRef = useRef(null);

  /**
   * Handle key down events
   */
  const handleKeyDown = useCallback((event) => {
    const key = event.key.toLowerCase();
    
    if (preventDefault) event.preventDefault();
    if (stopPropagation) event.stopPropagation();
    
    setPressedKeys(prev => new Set([...prev, key]));
    setLastKey(key);
    
    // Update key combo
    keyComboRef.current = [...keyComboRef.current, key];
    setKeyCombo([...keyComboRef.current]);
    
    // Clear key combo after 2 seconds
    clearTimeout(keyComboTimeoutRef.current);
    keyComboTimeoutRef.current = setTimeout(() => {
      keyComboRef.current = [];
      setKeyCombo([]);
    }, 2000);
    
    // Execute key down handlers
    const keyHandlers = handlersRef.current.get(`keydown:${key}`);
    if (keyHandlers) {
      keyHandlers.forEach(handler => handler(event));
    }
    
    // Execute combo handlers
    const comboKey = keyComboRef.current.join('+');
    const comboHandlers = handlersRef.current.get(`combo:${comboKey}`);
    if (comboHandlers) {
      comboHandlers.forEach(handler => handler(event));
    }
  }, [preventDefault, stopPropagation]);

  /**
   * Handle key up events
   */
  const handleKeyUp = useCallback((event) => {
    const key = event.key.toLowerCase();
    
    if (preventDefault) event.preventDefault();
    if (stopPropagation) event.stopPropagation();
    
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
    
    // Execute key up handlers
    const keyHandlers = handlersRef.current.get(`keyup:${key}`);
    if (keyHandlers) {
      keyHandlers.forEach(handler => handler(event));
    }
  }, [preventDefault, stopPropagation]);

  /**
   * Start listening to keyboard events
   */
  const startListening = useCallback(() => {
    if (isListening) return;
    
    target.addEventListener('keydown', handleKeyDown);
    target.addEventListener('keyup', handleKeyUp);
    setIsListening(true);
  }, [isListening, target, handleKeyDown, handleKeyUp]);

  /**
   * Stop listening to keyboard events
   */
  const stopListening = useCallback(() => {
    if (!isListening) return;
    
    target.removeEventListener('keydown', handleKeyDown);
    target.removeEventListener('keyup', handleKeyUp);
    setIsListening(false);
  }, [isListening, target, handleKeyDown, handleKeyUp]);

  /**
   * Add keyboard event handler
   * @param {string} key - Key or key combination
   * @param {Function} handler - Event handler
   * @param {string} eventType - Event type (keydown, keyup, combo)
   */
  const addHandler = useCallback((key, handler, eventType = 'keydown') => {
    const handlerKey = `${eventType}:${key.toLowerCase()}`;
    
    if (!handlersRef.current.has(handlerKey)) {
      handlersRef.current.set(handlerKey, new Set());
    }
    
    handlersRef.current.get(handlerKey).add(handler);
    
    // Auto-start listening if not already
    if (!isListening) {
      startListening();
    }
  }, [isListening, startListening]);

  /**
   * Remove keyboard event handler
   * @param {string} key - Key or key combination
   * @param {Function} handler - Event handler
   * @param {string} eventType - Event type
   */
  const removeHandler = useCallback((key, handler, eventType = 'keydown') => {
    const handlerKey = `${eventType}:${key.toLowerCase()}`;
    
    if (handlersRef.current.has(handlerKey)) {
      const handlers = handlersRef.current.get(handlerKey);
      handlers.delete(handler);
      
      if (handlers.size === 0) {
        handlersRef.current.delete(handlerKey);
      }
    }
  }, []);

  /**
   * Check if key is currently pressed
   * @param {string} key - Key to check
   * @returns {boolean} Key pressed status
   */
  const isKeyPressed = useCallback((key) => {
    return pressedKeys.has(key.toLowerCase());
  }, [pressedKeys]);

  /**
   * Check if multiple keys are pressed
   * @param {Array} keys - Keys to check
   * @returns {boolean} All keys pressed status
   */
  const areKeysPressed = useCallback((keys) => {
    return keys.every(key => pressedKeys.has(key.toLowerCase()));
  }, [pressedKeys]);

  /**
   * Get pressed keys as array
   * @returns {Array} Array of pressed keys
   */
  const getPressedKeys = useCallback(() => {
    return Array.from(pressedKeys);
  }, [pressedKeys]);

  /**
   * Clear all handlers and reset state
   */
  const clear = useCallback(() => {
    stopListening();
    handlersRef.current.clear();
    setPressedKeys(new Set());
    setLastKey(null);
    setKeyCombo([]);
    keyComboRef.current = [];
    clearTimeout(keyComboTimeoutRef.current);
  }, [stopListening]);

  // Auto-start listening on mount
  useEffect(() => {
    startListening();
    
    return () => {
      stopListening();
      clearTimeout(keyComboTimeoutRef.current);
    };
  }, [startListening, stopListening]);
  
  return {
    // State
    pressedKeys,
    lastKey,
    keyCombo,
    isListening,
    
    // Actions
    startListening,
    stopListening,
    addHandler,
    removeHandler,
    clear,
    
    // Utilities
    isKeyPressed,
    areKeysPressed,
    getPressedKeys
  };
}

/**
 * Hook for specific key handling
 * @param {string|Array} keys - Keys to listen for
 * @param {Function} handler - Event handler
 * @param {Object} options - Options
 * @returns {Object} Keyboard state
 */
export function useKey(keys, handler, options = {}) {
  const { eventType = 'keydown', ...keyboardOptions } = options;
  const keyboard = useKeyboard(keyboardOptions);
  
  const keysArray = Array.isArray(keys) ? keys : [keys];
  
  useEffect(() => {
    keysArray.forEach(key => {
      keyboard.addHandler(key, handler, eventType);
    });
    
    return () => {
      keysArray.forEach(key => {
        keyboard.removeHandler(key, handler, eventType);
      });
    };
  }, [keysArray, handler, eventType, keyboard]);
  
  return keyboard;
}

/**
 * Hook for key combination handling
 * @param {string} combo - Key combination (e.g., 'ctrl+s')
 * @param {Function} handler - Event handler
 * @param {Object} options - Options
 * @returns {Object} Keyboard state
 */
export function useKeyCombo(combo, handler, options = {}) {
  const keyboard = useKeyboard(options);
  
  useEffect(() => {
    keyboard.addHandler(combo, handler, 'combo');
    
    return () => {
      keyboard.removeHandler(combo, handler, 'combo');
    };
  }, [combo, handler, keyboard]);
  
  return keyboard;
}

/**
 * Hook for escape key handling
 * @param {Function} handler - Event handler
 * @param {Object} options - Options
 * @returns {Object} Keyboard state
 */
export function useEscape(handler, options = {}) {
  return useKey('escape', handler, options);
}

/**
 * Hook for arrow keys handling
 * @param {Function} handler - Event handler
 * @param {Object} options - Options
 * @returns {Object} Keyboard state
 */
export function useArrowKeys(handler, options = {}) {
  return useKey(['arrowup', 'arrowdown', 'arrowleft', 'arrowright'], handler, options);
}

/**
 * Hook for modifier keys handling
 * @param {Function} handler - Event handler
 * @param {Object} options - Options
 * @returns {Object} Keyboard state
 */
export function useModifierKeys(handler, options = {}) {
  return useKey(['ctrl', 'alt', 'shift', 'meta'], handler, options);
}