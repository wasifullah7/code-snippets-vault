/**
 * Advanced file upload utility with validation, processing, and storage
 * @param {Object} options - Configuration options
 * @param {Array} options.allowedTypes - Allowed MIME types
 * @param {number} options.maxSize - Maximum file size in bytes
 * @param {string} options.uploadDir - Upload directory path
 * @param {boolean} options.generateThumbnails - Generate image thumbnails
 * @param {Object} options.thumbnailSizes - Thumbnail dimensions
 * @param {boolean} options.overwrite - Overwrite existing files
 * @param {string} options.namingStrategy - File naming strategy
 */
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

class FileUpload {
  constructor(options = {}) {
    this.options = {
      allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      maxSize: options.maxSize || 5 * 1024 * 1024, // 5MB
      uploadDir: options.uploadDir || './uploads',
      generateThumbnails: options.generateThumbnails || false,
      thumbnailSizes: options.thumbnailSizes || [
        { width: 150, height: 150, suffix: 'thumb' },
        { width: 300, height: 300, suffix: 'medium' }
      ],
      overwrite: options.overwrite || false,
      namingStrategy: options.namingStrategy || 'timestamp', // timestamp, hash, original
      ...options
    };

    this.ensureUploadDirectory();
  }

  /**
   * Ensure upload directory exists
   */
  async ensureUploadDirectory() {
    try {
      await fs.mkdir(this.options.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  /**
   * Validate file
   * @param {Object} file - File object
   * @returns {Object} Validation result
   */
  validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > this.options.maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${this.formatBytes(this.options.maxSize)}`);
    }

    // Check file type
    if (!this.options.allowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Check if file exists (if overwrite is disabled)
    if (!this.options.overwrite) {
      const filePath = path.join(this.options.uploadDir, file.originalname);
      if (fs.existsSync(filePath)) {
        errors.push('File already exists');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate unique filename
   * @param {string} originalName - Original filename
   * @param {string} mimetype - File MIME type
   * @returns {string} Unique filename
   */
  generateFilename(originalName, mimetype) {
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);

    switch (this.options.namingStrategy) {
      case 'hash':
        const hash = crypto.createHash('md5').update(originalName + Date.now()).digest('hex');
        return `${hash}${ext}`;
      
      case 'timestamp':
        const timestamp = Date.now();
        return `${timestamp}_${nameWithoutExt}${ext}`;
      
      case 'original':
      default:
        return originalName;
    }
  }

  /**
   * Process and save file
   * @param {Object} file - File object from multer
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Upload result
   */
  async processFile(file, options = {}) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate filename
      const filename = this.generateFilename(file.originalname, file.mimetype);
      const filePath = path.join(this.options.uploadDir, filename);

      // Save file
      await fs.writeFile(filePath, file.buffer);

      const result = {
        originalName: file.originalname,
        filename,
        path: filePath,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
        thumbnails: []
      };

      // Generate thumbnails for images
      if (this.options.generateThumbnails && file.mimetype.startsWith('image/')) {
        result.thumbnails = await this.generateThumbnails(filePath, filename);
      }

      return result;
    } catch (error) {
      throw new Error(`File processing failed: ${error.message}`);
    }
  }

  /**
   * Generate thumbnails for image
   * @param {string} filePath - Original file path
   * @param {string} filename - Original filename
   * @returns {Promise<Array>} Thumbnail information
   */
  async generateThumbnails(filePath, filename) {
    const thumbnails = [];
    const ext = path.extname(filename);
    const nameWithoutExt = path.basename(filename, ext);

    for (const size of this.options.thumbnailSizes) {
      try {
        const thumbnailFilename = `${nameWithoutExt}_${size.suffix}${ext}`;
        const thumbnailPath = path.join(this.options.uploadDir, thumbnailFilename);

        await sharp(filePath)
          .resize(size.width, size.height, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);

        thumbnails.push({
          filename: thumbnailFilename,
          path: thumbnailPath,
          width: size.width,
          height: size.height,
          suffix: size.suffix
        });
      } catch (error) {
        console.error(`Failed to generate thumbnail ${size.suffix}:`, error);
      }
    }

    return thumbnails;
  }

  /**
   * Delete file and its thumbnails
   * @param {string} filename - Filename to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(filename) {
    try {
      const filePath = path.join(this.options.uploadDir, filename);
      
      // Delete main file
      await fs.unlink(filePath);

      // Delete thumbnails
      const ext = path.extname(filename);
      const nameWithoutExt = path.basename(filename, ext);
      
      const files = await fs.readdir(this.options.uploadDir);
      const thumbnailFiles = files.filter(file => 
        file.startsWith(nameWithoutExt) && file !== filename
      );

      for (const thumbnailFile of thumbnailFiles) {
        const thumbnailPath = path.join(this.options.uploadDir, thumbnailFile);
        await fs.unlink(thumbnailPath);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  /**
   * Get file information
   * @param {string} filename - Filename to get info for
   * @returns {Promise<Object>} File information
   */
  async getFileInfo(filename) {
    try {
      const filePath = path.join(this.options.uploadDir, filename);
      const stats = await fs.stat(filePath);
      
      return {
        filename,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isImage: this.isImageFile(filename)
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  /**
   * Check if file is an image
   * @param {string} filename - Filename to check
   * @returns {boolean} Is image file
   */
  isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const ext = path.extname(filename).toLowerCase();
    return imageExtensions.includes(ext);
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get upload statistics
   * @returns {Promise<Object>} Upload statistics
   */
  async getUploadStats() {
    try {
      const files = await fs.readdir(this.options.uploadDir);
      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        fileTypes: {},
        recentUploads: []
      };

      for (const file of files) {
        const filePath = path.join(this.options.uploadDir, file);
        const fileStats = await fs.stat(filePath);
        
        stats.totalSize += fileStats.size;
        
        const ext = path.extname(file).toLowerCase();
        stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
        
        if (fileStats.mtime > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
          stats.recentUploads.push({
            filename: file,
            size: fileStats.size,
            uploaded: fileStats.mtime
          });
        }
      }

      stats.totalSizeFormatted = this.formatBytes(stats.totalSize);
      return stats;
    } catch (error) {
      throw new Error(`Failed to get upload stats: ${error.message}`);
    }
  }
}

// Example usage:
// const fileUpload = new FileUpload({
//   allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
//   maxSize: 10 * 1024 * 1024, // 10MB
//   uploadDir: './uploads',
//   generateThumbnails: true,
//   thumbnailSizes: [
//     { width: 150, height: 150, suffix: 'thumb' },
//     { width: 300, height: 300, suffix: 'medium' }
//   ],
//   namingStrategy: 'timestamp'
// });
// 
// // Process uploaded file
// const result = await fileUpload.processFile(req.file);
// console.log('Upload result:', result);
// 
// // Delete file
// const deleted = await fileUpload.deleteFile('filename.jpg');
// 
// // Get file info
// const fileInfo = await fileUpload.getFileInfo('filename.jpg');
// 
// // Get upload stats
// const stats = await fileUpload.getUploadStats();

module.exports = FileUpload;