/**
 * Advanced file utilities for modern JavaScript
 * Comprehensive file handling, validation, and manipulation utilities
 */

/**
 * Get file extension from filename or path
 * @param {string} filename - File name or path
 * @returns {string} File extension (without dot)
 */
function getFileExtension(filename) {
  if (!filename || typeof filename !== 'string') return '';
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.slice(lastDotIndex + 1).toLowerCase() : '';
}

/**
 * Get file name without extension
 * @param {string} filename - File name or path
 * @returns {string} File name without extension
 */
function getFileNameWithoutExtension(filename) {
  if (!filename || typeof filename !== 'string') return '';
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
}

/**
 * Get file size in human readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Human readable file size
 */
function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Validate file type by extension
 * @param {string} filename - File name
 * @param {Array} allowedExtensions - Array of allowed extensions
 * @returns {boolean} Whether file type is valid
 */
function isValidFileType(filename, allowedExtensions = []) {
  const extension = getFileExtension(filename);
  return allowedExtensions.length === 0 || allowedExtensions.includes(extension);
}

/**
 * Validate file size
 * @param {number} fileSize - File size in bytes
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {boolean} Whether file size is valid
 */
function isValidFileSize(fileSize, maxSize) {
  return fileSize <= maxSize;
}

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @param {string} prefix - Optional prefix
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalName, prefix = '') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const nameWithoutExt = getFileNameWithoutExtension(originalName);
  
  const uniqueName = `${prefix}${nameWithoutExt}_${timestamp}_${random}`;
  return extension ? `${uniqueName}.${extension}` : uniqueName;
}

/**
 * Sanitize filename (remove special characters)
 * @param {string} filename - Original filename
 * @param {string} replacement - Character to replace invalid chars with
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename, replacement = '_') {
  if (!filename || typeof filename !== 'string') return '';
  
  // Remove or replace invalid characters
  return filename
    .replace(/[<>:"/\\|?*]/g, replacement)
    .replace(/\s+/g, replacement)
    .replace(new RegExp(`${replacement}+`, 'g'), replacement)
    .replace(new RegExp(`^${replacement}|${replacement}$`, 'g'), '');
}

/**
 * Get MIME type from file extension
 * @param {string} filename - File name
 * @returns {string} MIME type
 */
function getMimeType(filename) {
  const extension = getFileExtension(filename);
  const mimeTypes = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Text
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'csv': 'text/csv',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4',
    
    // Video
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'webm': 'video/webm'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Check if file is an image
 * @param {string} filename - File name
 * @returns {boolean} Whether file is an image
 */
function isImage(filename) {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tiff'];
  return imageExtensions.includes(getFileExtension(filename));
}

/**
 * Check if file is a document
 * @param {string} filename - File name
 * @returns {boolean} Whether file is a document
 */
function isDocument(filename) {
  const docExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
  return docExtensions.includes(getFileExtension(filename));
}

/**
 * Check if file is a video
 * @param {string} filename - File name
 * @returns {boolean} Whether file is a video
 */
function isVideo(filename) {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];
  return videoExtensions.includes(getFileExtension(filename));
}

/**
 * Check if file is an audio file
 * @param {string} filename - File name
 * @returns {boolean} Whether file is an audio file
 */
function isAudio(filename) {
  const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'];
  return audioExtensions.includes(getFileExtension(filename));
}

/**
 * Parse file path into components
 * @param {string} filePath - File path
 * @returns {Object} Parsed path components
 */
function parseFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return { directory: '', filename: '', extension: '', name: '' };
  }
  
  const lastSlashIndex = filePath.lastIndexOf('/');
  const lastBackslashIndex = filePath.lastIndexOf('\\');
  const lastSeparatorIndex = Math.max(lastSlashIndex, lastBackslashIndex);
  
  const directory = lastSeparatorIndex > 0 ? filePath.slice(0, lastSeparatorIndex + 1) : '';
  const filename = lastSeparatorIndex >= 0 ? filePath.slice(lastSeparatorIndex + 1) : filePath;
  const extension = getFileExtension(filename);
  const name = getFileNameWithoutExtension(filename);
  
  return { directory, filename, extension, name };
}

/**
 * Build file path from components
 * @param {Object} components - Path components
 * @returns {string} Constructed file path
 */
function buildFilePath(components = {}) {
  const { directory = '', filename = '', name = '', extension = '' } = components;
  
  if (filename) {
    return directory + filename;
  }
  
  if (name && extension) {
    return directory + name + '.' + extension;
  }
  
  return directory + name;
}

/**
 * Get relative path between two paths
 * @param {string} fromPath - Source path
 * @param {string} toPath - Target path
 * @returns {string} Relative path
 */
function getRelativePath(fromPath, toPath) {
  const fromParts = fromPath.split(/[/\\]/).filter(Boolean);
  const toParts = toPath.split(/[/\\]/).filter(Boolean);
  
  let commonPrefixLength = 0;
  for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
    if (fromParts[i] === toParts[i]) {
      commonPrefixLength++;
    } else {
      break;
    }
  }
  
  const upLevels = fromParts.length - commonPrefixLength;
  const relativeParts = toParts.slice(commonPrefixLength);
  
  const upPath = '../'.repeat(upLevels);
  const downPath = relativeParts.join('/');
  
  return upPath + downPath;
}

/**
 * Normalize file path (resolve . and ..)
 * @param {string} filePath - File path to normalize
 * @returns {string} Normalized path
 */
function normalizePath(filePath) {
  if (!filePath || typeof filePath !== 'string') return '';
  
  const parts = filePath.split(/[/\\]/);
  const normalized = [];
  
  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      if (normalized.length > 0) {
        normalized.pop();
      }
    } else {
      normalized.push(part);
    }
  }
  
  return normalized.join('/');
}

/**
 * File upload validator
 * @param {File} file - File object
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateFileUpload(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = [],
    allowedExtensions = [],
    maxFileNameLength = 255
  } = options;
  
  const errors = [];
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${formatFileSize(maxSize)}`);
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }
  
  // Check file extension
  if (allowedExtensions.length > 0 && !isValidFileType(file.name, allowedExtensions)) {
    errors.push(`File extension is not allowed`);
  }
  
  // Check filename length
  if (file.name.length > maxFileNameLength) {
    errors.push(`Filename is too long (max ${maxFileNameLength} characters)`);
  }
  
  // Check for invalid characters in filename
  const sanitized = sanitizeFilename(file.name);
  if (sanitized !== file.name) {
    errors.push('Filename contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    fileSize: formatFileSize(file.size),
    mimeType: file.type,
    extension: getFileExtension(file.name)
  };
}

module.exports = {
  getFileExtension,
  getFileNameWithoutExtension,
  formatFileSize,
  isValidFileType,
  isValidFileSize,
  generateUniqueFilename,
  sanitizeFilename,
  getMimeType,
  isImage,
  isDocument,
  isVideo,
  isAudio,
  parseFilePath,
  buildFilePath,
  getRelativePath,
  normalizePath,
  validateFileUpload
};
