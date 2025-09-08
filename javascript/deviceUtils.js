/**
 * Device utilities
 */
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const isTablet = () => {
  return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
};

const isDesktop = () => {
  return !isMobile() && !isTablet();
};

const getDeviceType = () => {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
};

const isTouch = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const getScreenSize = () => {
  return {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight
  };
};

const getViewportSize = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
};

const isOnline = () => {
  return navigator.onLine;
};

const getBrowser = () => {
  const browsers = {
    Chrome: /Chrome/,
    Firefox: /Firefox/,
    Safari: /Safari/,
    Edge: /Edge/,
    Opera: /Opera/
  };

  for (const [name, regex] of Object.entries(browsers)) {
    if (regex.test(navigator.userAgent)) {
      return name;
    }
  }
  return 'Unknown';
};

const getOS = () => {
  const os = {
    Windows: /Windows/,
    MacOS: /Mac OS/,
    Linux: /Linux/,
    Android: /Android/,
    iOS: /iPhone|iPad|iPod/
  };

  for (const [name, regex] of Object.entries(os)) {
    if (regex.test(navigator.userAgent)) {
      return name;
    }
  }
  return 'Unknown';
};

module.exports = {
  isMobile, isTablet, isDesktop, getDeviceType, isTouch,
  getScreenSize, getViewportSize, isOnline, getBrowser, getOS
};