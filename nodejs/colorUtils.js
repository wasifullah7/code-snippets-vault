/**
 * Color utilities for Node.js
 */

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color code
 * @returns {Object} RGB object
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Convert RGB to hex color
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} Hex color code
 */
const rgbToHex = (r, g, b) => {
  const toHex = (n) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Convert RGB to HSL
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {Object} HSL object
 */
const rgbToHsl = (r, g, b) => {
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
};

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {Object} RGB object
 */
const hslToRgb = (h, s, l) => {
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
};

/**
 * Convert RGB to CMYK
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {Object} CMYK object
 */
const rgbToCmyk = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const k = 1 - Math.max(r, g, b);
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);

  return {
    c: Math.round(c * 100) || 0,
    m: Math.round(m * 100) || 0,
    y: Math.round(y * 100) || 0,
    k: Math.round(k * 100)
  };
};

/**
 * Convert CMYK to RGB
 * @param {number} c - Cyan (0-100)
 * @param {number} m - Magenta (0-100)
 * @param {number} y - Yellow (0-100)
 * @param {number} k - Black (0-100)
 * @returns {Object} RGB object
 */
const cmykToRgb = (c, m, y, k) => {
  c /= 100;
  m /= 100;
  y /= 100;
  k /= 100;

  const r = (1 - c) * (1 - k);
  const g = (1 - m) * (1 - k);
  const b = (1 - y) * (1 - k);

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

/**
 * Lighten a color by percentage
 * @param {string} hex - Hex color code
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {string} Lightened hex color
 */
const lightenColor = (hex, percent) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 + percent / 100;
  const newRgb = {
    r: Math.min(255, Math.round(rgb.r * factor)),
    g: Math.min(255, Math.round(rgb.g * factor)),
    b: Math.min(255, Math.round(rgb.b * factor))
  };

  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};

/**
 * Darken a color by percentage
 * @param {string} hex - Hex color code
 * @param {number} percent - Percentage to darken (0-100)
 * @returns {string} Darkened hex color
 */
const darkenColor = (hex, percent) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 - percent / 100;
  const newRgb = {
    r: Math.max(0, Math.round(rgb.r * factor)),
    g: Math.max(0, Math.round(rgb.g * factor)),
    b: Math.max(0, Math.round(rgb.b * factor))
  };

  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};

/**
 * Saturate a color by percentage
 * @param {string} hex - Hex color code
 * @param {number} percent - Percentage to saturate (0-100)
 * @returns {string} Saturated hex color
 */
const saturateColor = (hex, percent) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const newS = Math.min(100, Math.max(0, hsl.s + percent));
  const newRgb = hslToRgb(hsl.h, newS, hsl.l);

  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};

/**
 * Desaturate a color by percentage
 * @param {string} hex - Hex color code
 * @param {number} percent - Percentage to desaturate (0-100)
 * @returns {string} Desaturated hex color
 */
const desaturateColor = (hex, percent) => {
  return saturateColor(hex, -percent);
};

/**
 * Get contrast color (black or white) for a background color
 * @param {string} hex - Background hex color
 * @returns {string} Contrast color (#000000 or #ffffff)
 */
const getContrastColor = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';

  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

/**
 * Generate random color
 * @returns {string} Random hex color
 */
const generateRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Generate random color with constraints
 * @param {Object} options - Generation options
 * @param {number} options.minSaturation - Minimum saturation (0-100)
 * @param {number} options.maxSaturation - Maximum saturation (0-100)
 * @param {number} options.minLightness - Minimum lightness (0-100)
 * @param {number} options.maxLightness - Maximum lightness (0-100)
 * @returns {string} Random hex color
 */
const generateRandomColorWithConstraints = (options = {}) => {
  const {
    minSaturation = 20,
    maxSaturation = 80,
    minLightness = 30,
    maxLightness = 70
  } = options;

  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * (maxSaturation - minSaturation) + minSaturation);
  const l = Math.floor(Math.random() * (maxLightness - minLightness) + minLightness);

  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
};

/**
 * Check if color is light
 * @param {string} hex - Hex color code
 * @returns {boolean} True if color is light
 */
const isLightColor = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128;
};

/**
 * Check if color is dark
 * @param {string} hex - Hex color code
 * @returns {boolean} True if color is dark
 */
const isDarkColor = (hex) => {
  return !isLightColor(hex);
};

/**
 * Blend two colors
 * @param {string} color1 - First hex color
 * @param {string} color2 - Second hex color
 * @param {number} ratio - Blend ratio (0-1)
 * @returns {string} Blended hex color
 */
const blendColors = (color1, color2, ratio) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return color1;

  const newRgb = {
    r: Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio),
    g: Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio),
    b: Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio)
  };

  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};

/**
 * Generate color palette
 * @param {string} baseColor - Base hex color
 * @param {number} count - Number of colors in palette
 * @param {string} type - Palette type ('monochromatic', 'analogous', 'triadic', 'complementary')
 * @returns {Array} Array of hex colors
 */
const generateColorPalette = (baseColor, count = 5, type = 'monochromatic') => {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return [];

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const palette = [];

  switch (type) {
    case 'monochromatic':
      for (let i = 0; i < count; i++) {
        const l = Math.max(10, Math.min(90, hsl.l + (i - Math.floor(count/2)) * 15));
        const newRgb = hslToRgb(hsl.h, hsl.s, l);
        palette.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
      }
      break;

    case 'analogous':
      for (let i = 0; i < count; i++) {
        const h = (hsl.h + i * 30) % 360;
        const newRgb = hslToRgb(h, hsl.s, hsl.l);
        palette.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
      }
      break;

    case 'triadic':
      for (let i = 0; i < count; i++) {
        const h = (hsl.h + i * 120) % 360;
        const newRgb = hslToRgb(h, hsl.s, hsl.l);
        palette.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
      }
      break;

    case 'complementary':
      for (let i = 0; i < count; i++) {
        const h = (hsl.h + i * 180) % 360;
        const newRgb = hslToRgb(h, hsl.s, hsl.l);
        palette.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
      }
      break;
  }

  return palette;
};

/**
 * Calculate color distance (Euclidean distance in RGB space)
 * @param {string} color1 - First hex color
 * @param {string} color2 - Second hex color
 * @returns {number} Distance value
 */
const getColorDistance = (color1, color2) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return Infinity;

  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
};

/**
 * Find closest color from a palette
 * @param {string} targetColor - Target hex color
 * @param {Array} palette - Array of hex colors
 * @returns {string} Closest color from palette
 */
const findClosestColor = (targetColor, palette) => {
  if (!palette || palette.length === 0) return targetColor;

  let closestColor = palette[0];
  let minDistance = getColorDistance(targetColor, closestColor);

  for (const color of palette) {
    const distance = getColorDistance(targetColor, color);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }

  return closestColor;
};

module.exports = {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToCmyk,
  cmykToRgb,
  lightenColor,
  darkenColor,
  saturateColor,
  desaturateColor,
  getContrastColor,
  generateRandomColor,
  generateRandomColorWithConstraints,
  isLightColor,
  isDarkColor,
  blendColors,
  generateColorPalette,
  getColorDistance,
  findClosestColor
};
