const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Copy text to clipboard (Node.js)
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
const copyToClipboard = async (text) => {
  try {
    const platform = process.platform;
    
    if (platform === 'win32') {
      // Windows
      await execAsync(`echo ${text} | clip`);
    } else if (platform === 'darwin') {
      // macOS
      await execAsync(`echo '${text}' | pbcopy`);
    } else {
      // Linux
      await execAsync(`echo '${text}' | xclip -selection clipboard`);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Read text from clipboard (Node.js)
 * @returns {Promise<string>} Clipboard text
 */
const readFromClipboard = async () => {
  try {
    const platform = process.platform;
    
    if (platform === 'win32') {
      // Windows
      const { stdout } = await execAsync('powershell -command "Get-Clipboard"');
      return stdout.trim();
    } else if (platform === 'darwin') {
      // macOS
      const { stdout } = await execAsync('pbpaste');
      return stdout.trim();
    } else {
      // Linux
      const { stdout } = await execAsync('xclip -selection clipboard -o');
      return stdout.trim();
    }
  } catch (error) {
    console.error('Failed to read from clipboard:', error);
    return '';
  }
};

/**
 * Check if clipboard is available
 * @returns {Promise<boolean>} Availability status
 */
const isClipboardAvailable = async () => {
  try {
    const platform = process.platform;
    
    if (platform === 'win32') {
      await execAsync('where clip');
    } else if (platform === 'darwin') {
      await execAsync('which pbcopy');
    } else {
      await execAsync('which xclip');
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  copyToClipboard,
  readFromClipboard,
  isClipboardAvailable
};
