/**
 * Image manipulation and utility functions
 */

/**
 * Load image from URL
 * @param {string} url - Image URL
 * @returns {Promise<HTMLImageElement>} Loaded image
 */
export const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Resize image to specified dimensions
 * @param {HTMLImageElement|HTMLCanvasElement} source - Source image
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @param {string} quality - Image quality ('low', 'medium', 'high')
 * @returns {string} Data URL of resized image
 */
export const resizeImage = (source, width, height, quality = 'medium') => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = width;
  canvas.height = height;
  
  const qualityMap = { low: 0.6, medium: 0.8, high: 0.9 };
  const imageQuality = qualityMap[quality] || 0.8;
  
  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', imageQuality);
};

/**
 * Convert image to base64
 * @param {File|HTMLImageElement} image - Image file or element
 * @param {string} format - Output format ('jpeg', 'png', 'webp')
 * @param {number} quality - Quality (0-1)
 * @returns {Promise<string>} Base64 data URL
 */
export const imageToBase64 = async (image, format = 'jpeg', quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (image instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(image);
    } else if (image instanceof HTMLImageElement) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.drawImage(image, 0, 0);
      
      const mimeType = `image/${format}`;
      resolve(canvas.toDataURL(mimeType, quality));
    } else {
      reject(new Error('Invalid image type'));
    }
  });
};

/**
 * Get dominant color from image
 * @param {HTMLImageElement|string} image - Image element or URL
 * @returns {Promise<string>} Hex color code
 */
export const getDominantColor = async (image) => {
  const img = typeof image === 'string' ? await loadImage(image) : image;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = 1;
  canvas.height = 1;
  
  ctx.drawImage(img, 0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
};

/**
 * Create image thumbnail
 * @param {File|string} image - Image file or URL
 * @param {number} size - Thumbnail size in pixels
 * @returns {Promise<string>} Thumbnail data URL
 */
export const createThumbnail = async (image, size = 150) => {
  let img;
  
  if (image instanceof File) {
    img = await loadImage(URL.createObjectURL(image));
  } else {
    img = await loadImage(image);
  }
  
  const aspectRatio = img.naturalWidth / img.naturalHeight;
  let width, height;
  
  if (aspectRatio > 1) {
    width = size;
    height = size / aspectRatio;
  } else {
    height = size;
    width = size * aspectRatio;
  }
  
  return resizeImage(img, width, height, 'medium');
};

/**
 * Compress image file
 * @param {File} file - Image file
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @param {number} quality - Compression quality (0-1)
 * @returns {Promise<File>} Compressed file
 */
export const compressImage = async (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        resolve(compressedFile);
      }, 'image/jpeg', quality);
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Check if file is an image
 * @param {File} file - File to check
 * @returns {boolean} True if image
 */
export const isImageFile = (file) => {
  return file.type.startsWith('image/');
};

/**
 * Get image dimensions from file
 * @param {File} file - Image file
 * @returns {Promise<Object>} Dimensions {width, height}
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
