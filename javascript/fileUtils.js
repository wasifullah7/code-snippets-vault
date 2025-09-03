/**
 * File utility functions for file operations
 */

/**
 * Get file extension from filename
 * @param {string} filename - Filename to get extension from
 * @returns {string} File extension (without dot)
 */
const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

/**
 * Get filename without extension
 * @param {string} filename - Filename to remove extension from
 * @returns {string} Filename without extension
 */
const getFilenameWithoutExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
};

/**
 * Check if file has specific extension
 * @param {string} filename - Filename to check
 * @param {string|Array} extensions - Extension(s) to check for
 * @returns {boolean} True if file has specified extension
 */
const hasFileExtension = (filename, extensions) => {
  if (!filename || !extensions) return false;
  
  const fileExt = getFileExtension(filename);
  
  if (Array.isArray(extensions)) {
    return extensions.some(ext => ext.toLowerCase() === fileExt);
  }
  
  return fileExt === extensions.toLowerCase();
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted file size
 */
const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Convert file size string to bytes
 * @param {string} sizeString - File size string (e.g., "1.5 MB")
 * @returns {number} Size in bytes
 */
const parseFileSize = (sizeString) => {
  if (!sizeString || typeof sizeString !== 'string') return 0;
  
  const units = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024
  };
  
  const match = sizeString.match(/^([\d.]+)\s*([KMGT]?B)$/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  return value * (units[unit] || 1);
};

/**
 * Check if file is an image
 * @param {string} filename - Filename to check
 * @returns {boolean} True if file is an image
 */
const isImageFile = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'];
  return hasFileExtension(filename, imageExtensions);
};

/**
 * Check if file is a video
 * @param {string} filename - Filename to check
 * @returns {boolean} True if file is a video
 */
const isVideoFile = (filename) => {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];
  return hasFileExtension(filename, videoExtensions);
};

/**
 * Check if file is an audio file
 * @param {string} filename - Filename to check
 * @returns {boolean} True if file is an audio file
 */
const isAudioFile = (filename) => {
  const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'wma', 'm4a'];
  return hasFileExtension(filename, audioExtensions);
};

/**
 * Check if file is a document
 * @param {string} filename - Filename to check
 * @returns {boolean} True if file is a document
 */
const isDocumentFile = (filename) => {
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'];
  return hasFileExtension(filename, documentExtensions);
};

/**
 * Check if file is a spreadsheet
 * @param {string} filename - Filename to check
 * @returns {boolean} True if file is a spreadsheet
 */
const isSpreadsheetFile = (filename) => {
  const spreadsheetExtensions = ['xls', 'xlsx', 'csv', 'ods', 'numbers'];
  return hasFileExtension(filename, spreadsheetExtensions);
};

/**
 * Check if file is a presentation
 * @param {string} filename - Filename to check
 * @returns {boolean} True if file is a presentation
 */
const isPresentationFile = (filename) => {
  const presentationExtensions = ['ppt', 'pptx', 'odp', 'key'];
  return hasFileExtension(filename, presentationExtensions);
};

/**
 * Check if file is an archive
 * @param {string} filename - Filename to check
 * @returns {boolean} True if file is an archive
 */
const isArchiveFile = (filename) => {
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
  return hasFileExtension(filename, archiveExtensions);
};

/**
 * Check if file is executable
 * @param {string} filename - Filename to check
 * @returns {boolean} True if file is executable
 */
const isExecutableFile = (filename) => {
  const executableExtensions = ['exe', 'msi', 'app', 'dmg', 'deb', 'rpm', 'sh', 'bat'];
  return hasFileExtension(filename, executableExtensions);
};

/**
 * Get file type category
 * @param {string} filename - Filename to get type for
 * @returns {string} File type category
 */
const getFileType = (filename) => {
  if (isImageFile(filename)) return 'image';
  if (isVideoFile(filename)) return 'video';
  if (isAudioFile(filename)) return 'audio';
  if (isDocumentFile(filename)) return 'document';
  if (isSpreadsheetFile(filename)) return 'spreadsheet';
  if (isPresentationFile(filename)) return 'presentation';
  if (isArchiveFile(filename)) return 'archive';
  if (isExecutableFile(filename)) return 'executable';
  return 'unknown';
};

/**
 * Get file icon based on type
 * @param {string} filename - Filename to get icon for
 * @returns {string} File icon name
 */
const getFileIcon = (filename) => {
  const fileType = getFileType(filename);
  
  const icons = {
    'image': '🖼️',
    'video': '🎥',
    'audio': '🎵',
    'document': '📄',
    'spreadsheet': '📊',
    'presentation': '📽️',
    'archive': '📦',
    'executable': '⚙️',
    'unknown': '📁'
  };
  
  return icons[fileType] || icons.unknown;
};

/**
 * Validate filename
 * @param {string} filename - Filename to validate
 * @returns {Object} Validation result with isValid and errors
 */
const validateFilename = (filename) => {
  const errors = [];
  
  if (!filename || typeof filename !== 'string') {
    errors.push('Filename is required');
    return { isValid: false, errors };
  }
  
  if (filename.length === 0) {
    errors.push('Filename cannot be empty');
  }
  
  if (filename.length > 255) {
    errors.push('Filename is too long (max 255 characters)');
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(filename)) {
    errors.push('Filename contains invalid characters');
  }
  
  // Check for reserved names (Windows)
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  if (reservedNames.includes(filename.toUpperCase())) {
    errors.push('Filename is a reserved name');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize filename
 * @param {string} filename - Filename to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized filename
 */
const sanitizeFilename = (filename, options = {}) => {
  if (!filename || typeof filename !== 'string') return '';
  
  const {
    replaceSpaces = true,
    replaceDots = false,
    maxLength = 255,
    replacement = '_'
  } = options;
  
  let sanitized = filename;
  
  // Replace invalid characters
  sanitized = sanitized.replace(/[<>:"/\\|?*]/g, replacement);
  
  // Replace spaces
  if (replaceSpaces) {
    sanitized = sanitized.replace(/\s+/g, replacement);
  }
  
  // Replace multiple dots (except for file extension)
  if (replaceDots) {
    const lastDotIndex = sanitized.lastIndexOf('.');
    if (lastDotIndex > 0) {
      const name = sanitized.substring(0, lastDotIndex).replace(/\.+/g, replacement);
      const ext = sanitized.substring(lastDotIndex);
      sanitized = name + ext;
    } else {
      sanitized = sanitized.replace(/\.+/g, replacement);
    }
  }
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
  
  // Truncate if too long
  if (sanitized.length > maxLength) {
    const lastDotIndex = sanitized.lastIndexOf('.');
    if (lastDotIndex > 0) {
      const name = sanitized.substring(0, lastDotIndex);
      const ext = sanitized.substring(lastDotIndex);
      const maxNameLength = maxLength - ext.length;
      sanitized = name.substring(0, maxNameLength) + ext;
    } else {
      sanitized = sanitized.substring(0, maxLength);
    }
  }
  
  return sanitized || 'untitled';
};

/**
 * Generate unique filename
 * @param {string} filename - Base filename
 * @param {Array} existingFiles - Array of existing filenames
 * @returns {string} Unique filename
 */
const generateUniqueFilename = (filename, existingFiles = []) => {
  if (!existingFiles.includes(filename)) return filename;
  
  const name = getFilenameWithoutExtension(filename);
  const ext = getFileExtension(filename);
  const extension = ext ? `.${ext}` : '';
  
  let counter = 1;
  let uniqueName = `${name}_${counter}${extension}`;
  
  while (existingFiles.includes(uniqueName)) {
    counter++;
    uniqueName = `${name}_${counter}${extension}`;
  }
  
  return uniqueName;
};

/**
 * Get file path components
 * @param {string} filepath - File path to parse
 * @returns {Object} Path components
 */
const parseFilePath = (filepath) => {
  if (!filepath || typeof filepath !== 'string') {
    return { dirname: '', basename: '', filename: '', extension: '' };
  }
  
  const lastSlashIndex = filepath.lastIndexOf('/');
  const lastBackslashIndex = filepath.lastIndexOf('\\');
  const lastSeparatorIndex = Math.max(lastSlashIndex, lastBackslashIndex);
  
  const dirname = lastSeparatorIndex > 0 ? filepath.substring(0, lastSeparatorIndex) : '';
  const basename = lastSeparatorIndex >= 0 ? filepath.substring(lastSeparatorIndex + 1) : filepath;
  const filename = getFilenameWithoutExtension(basename);
  const extension = getFileExtension(basename);
  
  return {
    dirname,
    basename,
    filename,
    extension: extension ? `.${extension}` : ''
  };
};

/**
 * Join path components
 * @param {...string} parts - Path parts to join
 * @returns {string} Joined path
 */
const joinPath = (...parts) => {
  return parts
    .filter(part => part && typeof part === 'string')
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');
};

/**
 * Normalize file path
 * @param {string} filepath - File path to normalize
 * @returns {string} Normalized path
 */
const normalizePath = (filepath) => {
  if (!filepath || typeof filepath !== 'string') return '';
  
  // Replace backslashes with forward slashes
  let normalized = filepath.replace(/\\/g, '/');
  
  // Remove duplicate slashes
  normalized = normalized.replace(/\/+/g, '/');
  
  // Remove trailing slash (except for root)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
};

module.exports = {
  getFileExtension,
  getFilenameWithoutExtension,
  hasFileExtension,
  formatFileSize,
  parseFileSize,
  isImageFile,
  isVideoFile,
  isAudioFile,
  isDocumentFile,
  isSpreadsheetFile,
  isPresentationFile,
  isArchiveFile,
  isExecutableFile,
  getFileType,
  getFileIcon,
  validateFilename,
  sanitizeFilename,
  generateUniqueFilename,
  parseFilePath,
  joinPath,
  normalizePath
};
