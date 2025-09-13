import { useCallback, useReducer, useRef } from 'react';

/**
 * Enhanced useReducer with middleware support
 * @param {Function} reducer - Reducer function
 * @param {*} initialState - Initial state
 * @param {Function} initializer - State initializer function
 * @returns {Array} [state, dispatch, getState]
 */
export default function useEnhancedReducer(reducer, initialState, initializer = undefined) {
  const [state, dispatch] = useReducer(reducer, initialState, initializer);
  const stateRef = useRef(state);
  
  // Update ref when state changes
  stateRef.current = state;
  
  // Get current state function
  const getState = useCallback(() => stateRef.current, []);
  
  return [state, dispatch, getState];
}

/**
 * useReducer with logger middleware
 * @param {Function} reducer - Reducer function
 * @param {*} initialState - Initial state
 * @param {string} name - Logger name
 * @returns {Array} [state, dispatch]
 */
export function useReducerWithLogger(reducer, initialState, name = 'Reducer') {
  const [state, dispatch] = useReducer((state, action) => {
    console.group(`${name} Action:`, action.type);
    console.log('Previous State:', state);
    console.log('Action:', action);
    
    const newState = reducer(state, action);
    
    console.log('Next State:', newState);
    console.groupEnd();
    
    return newState;
  }, initialState);
  
  return [state, dispatch];
}

/**
 * useReducer with persistence
 * @param {Function} reducer - Reducer function
 * @param {*} initialState - Initial state
 * @param {string} key - Storage key
 * @param {Object} options - Persistence options
 * @returns {Array} [state, dispatch]
 */
export function usePersistentReducer(reducer, initialState, key, options = {}) {
  const { storage = localStorage, serialize = JSON.stringify, deserialize = JSON.parse } = options;
  
  const [state, dispatch] = useReducer((state, action) => {
    const newState = reducer(state, action);
    
    try {
      storage.setItem(key, serialize(newState));
    } catch (error) {
      console.warn('Failed to persist state:', error);
    }
    
    return newState;
  }, initialState, (initialState) => {
    try {
      const saved = storage.getItem(key);
      return saved ? deserialize(saved) : initialState;
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
      return initialState;
    }
  });
  
  return [state, dispatch];
}

/**
 * useReducer with undo/redo functionality
 * @param {Function} reducer - Reducer function
 * @param {*} initialState - Initial state
 * @param {number} maxHistory - Maximum history size
 * @returns {Object} { state, dispatch, undo, redo, canUndo, canRedo }
 */
export function useUndoReducer(reducer, initialState, maxHistory = 50) {
  const initialStateWithHistory = {
    present: initialState,
    past: [],
    future: []
  };
  
  const undoReducer = (state, action) => {
    const { past, present, future } = state;
    
    switch (action.type) {
      case 'UNDO':
        if (past.length === 0) return state;
        
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        
        return {
          past: newPast,
          present: previous,
          future: [present, ...future]
        };
        
      case 'REDO':
        if (future.length === 0) return state;
        
        const next = future[0];
        const newFuture = future.slice(1);
        
        return {
          past: [...past, present],
          present: next,
          future: newFuture
        };
        
      default:
        const newPresent = reducer(present, action);
        
        if (newPresent === present) return state;
        
        const newPast = [...past, present];
        if (newPast.length > maxHistory) {
          newPast.shift();
        }
        
        return {
          past: newPast,
          present: newPresent,
          future: []
        };
    }
  };
  
  const [state, dispatch] = useReducer(undoReducer, initialStateWithHistory);
  
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  
  return {
    state: state.present,
    dispatch,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0
  };
}

/**
 * useReducer with async actions
 * @param {Function} reducer - Reducer function
 * @param {*} initialState - Initial state
 * @param {Function} asyncMiddleware - Async middleware
 * @returns {Array} [state, dispatch]
 */
export function useAsyncReducer(reducer, initialState, asyncMiddleware) {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  const asyncDispatch = useCallback(async (action) => {
    if (typeof action === 'function') {
      return action(dispatch, () => state);
    }
    
    if (asyncMiddleware) {
      return asyncMiddleware(dispatch, action);
    }
    
    return dispatch(action);
  }, [dispatch, state]);
  
  return [state, asyncDispatch];
}

/**
 * useReducer with computed values
 * @param {Function} reducer - Reducer function
 * @param {*} initialState - Initial state
 * @param {Function} compute - Computed values function
 * @returns {Object} { state, dispatch, computed }
 */
export function useComputedReducer(reducer, initialState, compute) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const computed = compute ? compute(state) : {};
  
  return { state, dispatch, computed };
}
