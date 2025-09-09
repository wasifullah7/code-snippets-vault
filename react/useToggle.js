import { useCallback, useState } from 'react';

/**
 * useToggle - simple boolean state toggler
 * @param {boolean} initialValue
 * @returns {[boolean, Function, Function, Function]} [value, toggle, setTrue, setFalse]
 */
export default function useToggle(initialValue = false) {
  const [value, setValue] = useState(Boolean(initialValue));

  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, toggle, setTrue, setFalse];
}


