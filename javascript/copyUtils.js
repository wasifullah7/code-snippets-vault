/**
 * Copy and clipboard utility functions
 */

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
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
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy text: ', error);
    return false;
  }
};

/**
 * Copy element content to clipboard
 * @param {Element} element - DOM element
 * @returns {Promise<boolean>} Success status
 */
export const copyElementToClipboard = async (element) => {
  const text = element.textContent || element.innerText || '';
  return copyToClipboard(text);
};

/**
 * Copy JSON object to clipboard as formatted string
 * @param {Object} obj - Object to copy
 * @param {number} indent - Indentation spaces
 * @returns {Promise<boolean>} Success status
 */
export const copyJSONToClipboard = async (obj, indent = 2) => {
  try {
    const jsonString = JSON.stringify(obj, null, indent);
    return copyToClipboard(jsonString);
  } catch (error) {
    console.error('Failed to stringify object: ', error);
    return false;
  }
};

/**
 * Copy HTML content to clipboard
 * @param {string} html - HTML string to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyHTMLToClipboard = async (html) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      const blob = new Blob([html], { type: 'text/html' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blob,
          'text/plain': new Blob([html.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
        })
      ]);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to copy HTML: ', error);
    return false;
  }
};

/**
 * Copy image to clipboard
 * @param {string|Blob} image - Image URL or Blob
 * @returns {Promise<boolean>} Success status
 */
export const copyImageToClipboard = async (image) => {
  try {
    if (!navigator.clipboard || !window.isSecureContext) {
      return false;
    }

    let blob;
    if (typeof image === 'string') {
      const response = await fetch(image);
      blob = await response.blob();
    } else {
      blob = image;
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ]);
    return true;
  } catch (error) {
    console.error('Failed to copy image: ', error);
    return false;
  }
};

/**
 * Read text from clipboard
 * @returns {Promise<string>} Clipboard text
 */
export const readFromClipboard = async () => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      return await navigator.clipboard.readText();
    }
    return '';
  } catch (error) {
    console.error('Failed to read from clipboard: ', error);
    return '';
  }
};

/**
 * Check if clipboard API is supported
 * @returns {boolean} Support status
 */
export const isClipboardSupported = () => {
  return !!(navigator.clipboard && window.isSecureContext);
};
