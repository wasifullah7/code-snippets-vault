import { useState, useCallback } from 'react';

/**
 * React hook for clipboard operations
 * @param {string} initialText - Initial text to copy
 * @returns {Object} Clipboard state and functions
 */
const useClipboard = (initialText = '') => {
  const [copied, setCopied] = useState(false);
  const [text, setText] = useState(initialText);

  const copyToClipboard = useCallback(async (textToCopy = text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (result) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
        return result;
      }
    } catch (error) {
      console.error('Failed to copy text:', error);
      return false;
    }
  }, [text]);

  const readFromClipboard = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        const clipboardText = await navigator.clipboard.readText();
        setText(clipboardText);
        return clipboardText;
      } else {
        throw new Error('Clipboard API not supported');
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      return '';
    }
  }, []);

  return {
    copied,
    text,
    setText,
    copyToClipboard,
    readFromClipboard
  };
};

export default useClipboard;
