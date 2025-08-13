/**
 * Advanced color manipulation utilities for modern web development
 * @param {Object} options - Configuration options
 * @param {string} options.defaultFormat - Default color format (default: 'hex')
 * @param {boolean} options.includeAlpha - Include alpha channel support (default: true)
 * @param {number} options.precision - Decimal precision for calculations (default: 2)
 */
class ColorUtils {
    constructor(options = {}) {
      this.options = {
        defaultFormat: options.defaultFormat || 'hex',
        includeAlpha: options.includeAlpha !== false,
        precision: options.precision || 2,
        ...options
      };
    }
  
    /**
     * Convert hex color to RGB
     * @param {string} hex - Hex color string
     * @returns {Object} RGB object
     */
    hexToRgb(hex) {
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substr(0, 2), 16);
      const g = parseInt(cleanHex.substr(2, 2), 16);
      const b = parseInt(cleanHex.substr(4, 2), 16);
      
      return { r, g, b };
    }
  
    /**
     * Convert RGB to hex
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @returns {string} Hex color string
     */
    rgbToHex(r, g, b) {
      const toHex = (n) => {
        const hex = Math.round(n).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
  
    /**
     * Convert RGB to HSL
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @returns {Object} HSL object
     */
    rgbToHsl(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;
  
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
  
      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
  
      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      };
    }
  
    /**
     * Convert HSL to RGB
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} l - Lightness (0-100)
     * @returns {Object} RGB object
     */
    hslToRgb(h, s, l) {
      h /= 360;
      s /= 100;
      l /= 100;
  
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
  
      let r, g, b;
  
      if (s === 0) {
        r = g = b = l;
      } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
  
      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      };
    }
  
    /**
     * Generate random color
     * @param {Object} options - Generation options
     * @param {string} options.format - Output format (hex, rgb, hsl)
     * @param {number} options.minSaturation - Minimum saturation (0-100)
     * @param {number} options.maxSaturation - Maximum saturation (0-100)
     * @param {number} options.minLightness - Minimum lightness (0-100)
     * @param {number} options.maxLightness - Maximum lightness (0-100)
     * @returns {string|Object} Random color
     */
    randomColor(options = {}) {
      const {
        format = this.options.defaultFormat,
        minSaturation = 20,
        maxSaturation = 80,
        minLightness = 30,
        maxLightness = 70
      } = options;
  
      const h = Math.floor(Math.random() * 360);
      const s = Math.floor(Math.random() * (maxSaturation - minSaturation) + minSaturation);
      const l = Math.floor(Math.random() * (maxLightness - minLightness) + minLightness);
  
      const rgb = this.hslToRgb(h, s, l);
  
      switch (format) {
        case 'hex':
          return this.rgbToHex(rgb.r, rgb.g, rgb.b);
        case 'rgb':
          return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        case 'hsl':
          return `hsl(${h}, ${s}%, ${l}%)`;
        default:
          return rgb;
      }
    }
  
    /**
     * Generate color palette
     * @param {string} baseColor - Base color (hex, rgb, or hsl)
     * @param {number} count - Number of colors in palette
     * @param {string} type - Palette type (monochromatic, analogous, triadic, tetradic)
     * @returns {Array} Color palette
     */
    generatePalette(baseColor, count = 5, type = 'monochromatic') {
      const rgb = this.parseColor(baseColor);
      const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
      const palette = [];
  
      switch (type) {
        case 'monochromatic':
          for (let i = 0; i < count; i++) {
            const l = Math.max(10, Math.min(90, hsl.l + (i - Math.floor(count/2)) * 15));
            const newRgb = this.hslToRgb(hsl.h, hsl.s, l);
            palette.push(this.rgbToHex(newRgb.r, newRgb.g, newRgb.b));
          }
          break;
  
        case 'analogous':
          for (let i = 0; i < count; i++) {
            const h = (hsl.h + i * 30) % 360;
            const newRgb = this.hslToRgb(h, hsl.s, hsl.l);
            palette.push(this.rgbToHex(newRgb.r, newRgb.g, newRgb.b));
          }
          break;
  
        case 'triadic':
          for (let i = 0; i < count; i++) {
            const h = (hsl.h + i * 120) % 360;
            const newRgb = this.hslToRgb(h, hsl.s, hsl.l);
            palette.push(this.rgbToHex(newRgb.r, newRgb.g, newRgb.b));
          }
          break;
  
        case 'tetradic':
          for (let i = 0; i < count; i++) {
            const h = (hsl.h + i * 90) % 360;
            const newRgb = this.hslToRgb(h, hsl.s, hsl.l);
            palette.push(this.rgbToHex(newRgb.r, newRgb.g, newRgb.b));
          }
          break;
      }
  
      return palette;
    }
  
    /**
     * Calculate color contrast ratio
     * @param {string} color1 - First color
     * @param {string} color2 - Second color
     * @returns {number} Contrast ratio
     */
    getContrastRatio(color1, color2) {
      const rgb1 = this.parseColor(color1);
      const rgb2 = this.parseColor(color2);
  
      const luminance1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
      const luminance2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
      const lighter = Math.max(luminance1, luminance2);
      const darker = Math.min(luminance1, luminance2);
  
      return (lighter + 0.05) / (darker + 0.05);
    }
  
    /**
     * Calculate relative luminance
     * @param {number} r - Red value
     * @param {number} g - Green value
     * @param {number} b - Blue value
     * @returns {number} Luminance value
     */
    getLuminance(r, g, b) {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
  
    /**
     * Check if color is light or dark
     * @param {string} color - Color to check
     * @returns {string} 'light' or 'dark'
     */
    isLight(color) {
      const rgb = this.parseColor(color);
      const luminance = this.getLuminance(rgb.r, rgb.g, rgb.b);
      return luminance > 0.5 ? 'light' : 'dark';
    }
  
    /**
     * Parse color string to RGB
     * @param {string} color - Color string
     * @returns {Object} RGB object
     */
    parseColor(color) {
      if (color.startsWith('#')) {
        return this.hexToRgb(color);
      } else if (color.startsWith('rgb')) {
        const matches = color.match(/\d+/g);
        return {
          r: parseInt(matches[0]),
          g: parseInt(matches[1]),
          b: parseInt(matches[2])
        };
      } else if (color.startsWith('hsl')) {
        const matches = color.match(/\d+/g);
        const rgb = this.hslToRgb(
          parseInt(matches[0]),
          parseInt(matches[1]),
          parseInt(matches[2])
        );
        return rgb;
      }
      
      throw new Error('Unsupported color format');
    }
  
    /**
     * Blend two colors
     * @param {string} color1 - First color
     * @param {string} color2 - Second color
     * @param {number} ratio - Blend ratio (0-1)
     * @returns {string} Blended color
     */
    blendColors(color1, color2, ratio = 0.5) {
      const rgb1 = this.parseColor(color1);
      const rgb2 = this.parseColor(color2);
  
      const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
      const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
      const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
  
      return this.rgbToHex(r, g, b);
    }
  
    /**
     * Adjust color brightness
     * @param {string} color - Base color
     * @param {number} factor - Brightness factor (-1 to 1)
     * @returns {string} Adjusted color
     */
    adjustBrightness(color, factor) {
      const rgb = this.parseColor(color);
      
      const r = Math.max(0, Math.min(255, rgb.r + (factor * 255)));
      const g = Math.max(0, Math.min(255, rgb.g + (factor * 255)));
      const b = Math.max(0, Math.min(255, rgb.b + (factor * 255)));
  
      return this.rgbToHex(r, g, b);
    }
  
    /**
     * Get accessible text color for background
     * @param {string} backgroundColor - Background color
     * @returns {string} Accessible text color
     */
    getAccessibleTextColor(backgroundColor) {
      const isLightBg = this.isLight(backgroundColor) === 'light';
      return isLightBg ? '#000000' : '#ffffff';
    }
  }
  
  // Example usage:
  // const colorUtils = new ColorUtils({ defaultFormat: 'hex' });
  // 
  // // Convert colors
  // const rgb = colorUtils.hexToRgb('#ff0000');
  // const hex = colorUtils.rgbToHex(255, 0, 0);
  // const hsl = colorUtils.rgbToHsl(255, 0, 0);
  // 
  // // Generate colors
  // const randomColor = colorUtils.randomColor({ format: 'hex' });
  // const palette = colorUtils.generatePalette('#3b82f6', 5, 'monochromatic');
  // 
  // // Check contrast
  // const contrast = colorUtils.getContrastRatio('#ffffff', '#000000');
  // const isLight = colorUtils.isLight('#ffffff');
  // 
  // // Blend colors
  // const blended = colorUtils.blendColors('#ff0000', '#0000ff', 0.5);
  // const brighter = colorUtils.adjustBrightness('#3b82f6', 0.2);
  // 
  // // Get accessible text color
  // const textColor = colorUtils.getAccessibleTextColor('#3b82f6');
  
  module.exports = ColorUtils;