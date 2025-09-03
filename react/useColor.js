import { useState, useCallback } from 'react';

/**
 * React hook for color operations
 * @param {string} initialColor - Initial color (hex format)
 * @returns {Object} Color state and functions
 */
const useColor = (initialColor = '#3b82f6') => {
  const [color, setColor] = useState(initialColor);

  // Convert hex to RGB
  const hexToRgb = useCallback((hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }, []);

  // Convert RGB to hex
  const rgbToHex = useCallback((r, g, b) => {
    const toHex = (n) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }, []);

  // Convert RGB to HSL
  const rgbToHsl = useCallback((r, g, b) => {
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
  }, []);

  // Convert HSL to RGB
  const hslToRgb = useCallback((h, s, l) => {
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
  }, []);

  // Lighten color
  const lighten = useCallback((percent = 20) => {
    const rgb = hexToRgb(color);
    if (!rgb) return;

    const factor = 1 + percent / 100;
    const newRgb = {
      r: Math.min(255, Math.round(rgb.r * factor)),
      g: Math.min(255, Math.round(rgb.g * factor)),
      b: Math.min(255, Math.round(rgb.b * factor))
    };

    setColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }, [color, hexToRgb, rgbToHex]);

  // Darken color
  const darken = useCallback((percent = 20) => {
    const rgb = hexToRgb(color);
    if (!rgb) return;

    const factor = 1 - percent / 100;
    const newRgb = {
      r: Math.max(0, Math.round(rgb.r * factor)),
      g: Math.max(0, Math.round(rgb.g * factor)),
      b: Math.max(0, Math.round(rgb.b * factor))
    };

    setColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }, [color, hexToRgb, rgbToHex]);

  // Generate random color
  const randomize = useCallback(() => {
    const letters = '0123456789ABCDEF';
    let newColor = '#';
    for (let i = 0; i < 6; i++) {
      newColor += letters[Math.floor(Math.random() * 16)];
    }
    setColor(newColor);
  }, []);

  // Get contrast color
  const getContrast = useCallback(() => {
    const rgb = hexToRgb(color);
    if (!rgb) return '#000000';

    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }, [color, hexToRgb]);

  // Check if color is light
  const isLight = useCallback(() => {
    const rgb = hexToRgb(color);
    if (!rgb) return false;

    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128;
  }, [color, hexToRgb]);

  // Check if color is dark
  const isDark = useCallback(() => {
    return !isLight();
  }, [isLight]);

  // Blend with another color
  const blend = useCallback((otherColor, ratio = 0.5) => {
    const rgb1 = hexToRgb(color);
    const rgb2 = hexToRgb(otherColor);
    
    if (!rgb1 || !rgb2) return;

    const newRgb = {
      r: Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio),
      g: Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio),
      b: Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio)
    };

    setColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }, [color, hexToRgb, rgbToHex]);

  // Get current color in different formats
  const getFormats = useCallback(() => {
    const rgb = hexToRgb(color);
    if (!rgb) return {};

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    return {
      hex: color,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      rgbObject: rgb,
      hslObject: hsl
    };
  }, [color, hexToRgb, rgbToHsl]);

  // Set color from different formats
  const setFromFormat = useCallback((colorInput, format = 'hex') => {
    let newColor = colorInput;
    
    if (format === 'rgb') {
      const matches = colorInput.match(/\d+/g);
      if (matches && matches.length === 3) {
        newColor = rgbToHex(parseInt(matches[0]), parseInt(matches[1]), parseInt(matches[2]));
      }
    } else if (format === 'hsl') {
      const matches = colorInput.match(/\d+/g);
      if (matches && matches.length === 3) {
        const rgb = hslToRgb(parseInt(matches[0]), parseInt(matches[1]), parseInt(matches[2]));
        newColor = rgbToHex(rgb.r, rgb.g, rgb.b);
      }
    }
    
    setColor(newColor);
  }, [rgbToHex, hslToRgb]);

  return {
    color,
    setColor,
    hexToRgb,
    rgbToHex,
    rgbToHsl,
    hslToRgb,
    lighten,
    darken,
    randomize,
    getContrast,
    isLight,
    isDark,
    blend,
    getFormats,
    setFromFormat
  };
};

export default useColor;
