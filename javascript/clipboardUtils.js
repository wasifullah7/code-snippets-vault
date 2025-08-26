/**
 * Clipboard utilities for copying text to clipboard
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<boolean>} Success status
 */
const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
};

/**
 * Read text from clipboard
 * @returns {Promise<string>} Clipboard text
 */
const readFromClipboard = async () => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      return await navigator.clipboard.readText();
    } else {
      throw new Error('Clipboard API not supported');
    }
  } catch (error) {
    console.error('Failed to read clipboard:', error);
    return '';
  }
};

module.exports = { copyToClipboard, readFromClipboard };
