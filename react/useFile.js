import { useState, useCallback, useRef } from 'react';

/**
 * React hook for file operations
 * @param {Object} options - Hook options
 * @returns {Object} File state and functions
 */
const useFile = (options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    allowedExtensions = [],
    multiple = false
  } = options;

  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  // Validate file
  const validateFile = useCallback((file) => {
    const fileErrors = [];

    // Check file size
    if (file.size > maxSize) {
      fileErrors.push(`File size exceeds maximum allowed size of ${formatFileSize(maxSize)}`);
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      fileErrors.push(`File type ${file.type} is not allowed`);
    }

    // Check file extension
    if (allowedExtensions.length > 0) {
      const extension = getFileExtension(file.name);
      if (!allowedExtensions.includes(extension)) {
        fileErrors.push(`File extension .${extension} is not allowed`);
      }
    }

    return fileErrors;
  }, [maxSize, allowedTypes, allowedExtensions]);

  // Format file size
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Get file extension
  const getFileExtension = useCallback((filename) => {
    if (!filename || typeof filename !== 'string') return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }, []);

  // Check if file is an image
  const isImageFile = useCallback((filename) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'];
    const extension = getFileExtension(filename);
    return imageExtensions.includes(extension);
  }, [getFileExtension]);

  // Check if file is a video
  const isVideoFile = useCallback((filename) => {
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];
    const extension = getFileExtension(filename);
    return videoExtensions.includes(extension);
  }, [getFileExtension]);

  // Check if file is an audio file
  const isAudioFile = useCallback((filename) => {
    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'wma', 'm4a'];
    const extension = getFileExtension(filename);
    return audioExtensions.includes(extension);
  }, [getFileExtension]);

  // Check if file is a document
  const isDocumentFile = useCallback((filename) => {
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'];
    const extension = getFileExtension(filename);
    return documentExtensions.includes(extension);
  }, [getFileExtension]);

  // Get file type category
  const getFileType = useCallback((filename) => {
    if (isImageFile(filename)) return 'image';
    if (isVideoFile(filename)) return 'video';
    if (isAudioFile(filename)) return 'audio';
    if (isDocumentFile(filename)) return 'document';
    return 'unknown';
  }, [isImageFile, isVideoFile, isAudioFile, isDocumentFile]);

  // Get file icon
  const getFileIcon = useCallback((filename) => {
    const fileType = getFileType(filename);
    
    const icons = {
      'image': '🖼️',
      'video': '🎥',
      'audio': '🎵',
      'document': '📄',
      'unknown': '📁'
    };
    
    return icons[fileType] || icons.unknown;
  }, [getFileType]);

  // Add files
  const addFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles);
    const validFiles = [];
    const newErrors = [];

    fileArray.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length === 0) {
        validFiles.push(file);
      } else {
        newErrors.push({ file: file.name, errors: fileErrors });
      }
    });

    if (validFiles.length > 0) {
      setFiles(prev => multiple ? [...prev, ...validFiles] : validFiles);
    }

    setErrors(newErrors);
    return { validFiles, errors: newErrors };
  }, [validateFile, multiple]);

  // Remove file
  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
    setErrors([]);
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((event) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      addFiles(selectedFiles);
    }
  }, [addFiles]);

  // Handle drag over
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  // Handle drop
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles) {
      addFiles(droppedFiles);
    }
  }, [addFiles]);

  // Open file picker
  const openFilePicker = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Get file preview URL
  const getFilePreview = useCallback((file) => {
    if (!file) return null;
    
    if (isImageFile(file.name) || isVideoFile(file.name)) {
      return URL.createObjectURL(file);
    }
    
    return null;
  }, [isImageFile, isVideoFile]);

  // Revoke preview URL
  const revokeFilePreview = useCallback((url) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }, []);

  // Get total size
  const getTotalSize = useCallback(() => {
    return files.reduce((total, file) => total + file.size, 0);
  }, [files]);

  // Get formatted total size
  const getFormattedTotalSize = useCallback(() => {
    return formatFileSize(getTotalSize());
  }, [getTotalSize, formatFileSize]);

  // Check if files are valid
  const areFilesValid = useCallback(() => {
    return errors.length === 0 && files.length > 0;
  }, [errors, files]);

  // Get file info
  const getFileInfo = useCallback((file) => {
    return {
      name: file.name,
      size: file.size,
      formattedSize: formatFileSize(file.size),
      type: file.type,
      extension: getFileExtension(file.name),
      fileType: getFileType(file.name),
      icon: getFileIcon(file.name),
      lastModified: new Date(file.lastModified),
      preview: getFilePreview(file)
    };
  }, [formatFileSize, getFileExtension, getFileType, getFileIcon, getFilePreview]);

  // Get all files info
  const getAllFilesInfo = useCallback(() => {
    return files.map(getFileInfo);
  }, [files, getFileInfo]);

  // Filter files by type
  const filterFilesByType = useCallback((fileType) => {
    return files.filter(file => getFileType(file.name) === fileType);
  }, [files, getFileType]);

  // Sort files
  const sortFiles = useCallback((sortBy = 'name', order = 'asc') => {
    const sortedFiles = [...files].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'type':
          aValue = getFileType(a.name);
          bValue = getFileType(b.name);
          break;
        case 'lastModified':
          aValue = a.lastModified;
          bValue = b.lastModified;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFiles(sortedFiles);
  }, [files, getFileType]);

  return {
    // State
    files,
    isDragging,
    errors,
    
    // File operations
    addFiles,
    removeFile,
    clearFiles,
    
    // File validation
    validateFile,
    areFilesValid,
    
    // File info
    getFileInfo,
    getAllFilesInfo,
    getFileType,
    getFileIcon,
    isImageFile,
    isVideoFile,
    isAudioFile,
    isDocumentFile,
    
    // File utilities
    formatFileSize,
    getFileExtension,
    getTotalSize,
    getFormattedTotalSize,
    
    // File filtering and sorting
    filterFilesByType,
    sortFiles,
    
    // Event handlers
    handleFileInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    
    // File picker
    openFilePicker,
    fileInputRef,
    
    // Preview
    getFilePreview,
    revokeFilePreview
  };
};

export default useFile;
