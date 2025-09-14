/**
 * Browser notification utilities
 */

/**
 * Request notification permission
 * @returns {Promise<string>} Permission status
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Show notification
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 * @returns {Notification|null} Notification object
 */
export const showNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  const defaultOptions = {
    body: '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'default',
    requireInteraction: false,
    silent: false,
    ...options
  };

  try {
    const notification = new Notification(title, defaultOptions);
    
    // Auto close after 5 seconds if not requiring interaction
    if (!defaultOptions.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    return notification;
  } catch (error) {
    console.error('Failed to show notification:', error);
    return null;
  }
};

/**
 * Show success notification
 * @param {string} message - Success message
 * @param {Object} options - Additional options
 * @returns {Notification|null}
 */
export const showSuccessNotification = (message, options = {}) => {
  return showNotification('Success', {
    body: message,
    icon: '/icons/success.png',
    ...options
  });
};

/**
 * Show error notification
 * @param {string} message - Error message
 * @param {Object} options - Additional options
 * @returns {Notification|null}
 */
export const showErrorNotification = (message, options = {}) => {
  return showNotification('Error', {
    body: message,
    icon: '/icons/error.png',
    requireInteraction: true,
    ...options
  });
};

/**
 * Show info notification
 * @param {string} message - Info message
 * @param {Object} options - Additional options
 * @returns {Notification|null}
 */
export const showInfoNotification = (message, options = {}) => {
  return showNotification('Info', {
    body: message,
    icon: '/icons/info.png',
    ...options
  });
};

/**
 * Show warning notification
 * @param {string} message - Warning message
 * @param {Object} options - Additional options
 * @returns {Notification|null}
 */
export const showWarningNotification = (message, options = {}) => {
  return showNotification('Warning', {
    body: message,
    icon: '/icons/warning.png',
    ...options
  });
};

/**
 * Custom notification with actions
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Array} actions - Action buttons
 * @param {Object} options - Additional options
 * @returns {Notification|null}
 */
export const showActionNotification = (title, message, actions = [], options = {}) => {
  const notificationOptions = {
    body: message,
    actions: actions.map(action => ({
      action: action.id,
      title: action.title,
      icon: action.icon
    })),
    requireInteraction: true,
    ...options
  };

  const notification = showNotification(title, notificationOptions);
  
  if (notification) {
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
    };

    notification.addEventListener('click', (event) => {
      if (event.action) {
        const action = actions.find(a => a.id === event.action);
        if (action && action.callback) {
          action.callback();
        }
      }
    });
  }

  return notification;
};

/**
 * Schedule notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {number} delay - Delay in milliseconds
 * @param {Object} options - Notification options
 * @returns {number} Timeout ID
 */
export const scheduleNotification = (title, message, delay, options = {}) => {
  return setTimeout(() => {
    showNotification(title, { body: message, ...options });
  }, delay);
};

/**
 * Clear all scheduled notifications
 * @param {Array} timeoutIds - Array of timeout IDs
 */
export const clearScheduledNotifications = (timeoutIds) => {
  timeoutIds.forEach(id => clearTimeout(id));
};

/**
 * Notification manager class
 */
export class NotificationManager {
  constructor() {
    this.permission = Notification.permission;
    this.notifications = new Map();
  }

  async initialize() {
    this.permission = await requestNotificationPermission();
    return this.permission;
  }

  show(title, options = {}) {
    const notification = showNotification(title, options);
    if (notification) {
      this.notifications.set(notification.tag || Date.now(), notification);
    }
    return notification;
  }

  showSuccess(message, options = {}) {
    return this.show('Success', { body: message, icon: '/icons/success.png', ...options });
  }

  showError(message, options = {}) {
    return this.show('Error', { body: message, icon: '/icons/error.png', requireInteraction: true, ...options });
  }

  showInfo(message, options = {}) {
    return this.show('Info', { body: message, icon: '/icons/info.png', ...options });
  }

  showWarning(message, options = {}) {
    return this.show('Warning', { body: message, icon: '/icons/warning.png', ...options });
  }

  close(tag) {
    const notification = this.notifications.get(tag);
    if (notification) {
      notification.close();
      this.notifications.delete(tag);
    }
  }

  closeAll() {
    this.notifications.forEach(notification => notification.close());
    this.notifications.clear();
  }

  isSupported() {
    return 'Notification' in window;
  }

  getPermission() {
    return this.permission;
  }
}

// Create global instance
export const notificationManager = new NotificationManager();
