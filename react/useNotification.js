import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom React hook for notification management
 * Provides comprehensive notification system with different types, positioning, and auto-dismiss
 * @param {Object} options - Hook options
 * @returns {Object} Notification state and utilities
 */
function useNotification(options = {}) {
  const {
    maxNotifications = 5,
    defaultDuration = 5000,
    defaultPosition = 'top-right',
    defaultType = 'info',
    enableSound = false,
    soundUrl = null,
    onNotificationAdd = null,
    onNotificationRemove = null
  } = options;

  const [notifications, setNotifications] = useState([]);
  const [isEnabled, setIsEnabled] = useState('Notification' in window);
  const audioRef = useRef(null);

  // Initialize audio for sound notifications
  useEffect(() => {
    if (enableSound && soundUrl && 'Audio' in window) {
      audioRef.current = new Audio(soundUrl);
    }
  }, [enableSound, soundUrl]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      setIsEnabled(false);
      return false;
    }

    if (Notification.permission === 'granted') {
      setIsEnabled(true);
      return true;
    }

    if (Notification.permission === 'denied') {
      setIsEnabled(false);
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setIsEnabled(permission === 'granted');
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      setIsEnabled(false);
      return false;
    }
  }, []);

  // Add notification
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: defaultType,
      position: defaultPosition,
      duration: defaultDuration,
      dismissible: true,
      ...notification
    };

    setNotifications(prev => {
      const updated = [...prev, newNotification];
      
      // Limit number of notifications
      if (updated.length > maxNotifications) {
        return updated.slice(-maxNotifications);
      }
      
      return updated;
    });

    // Play sound if enabled
    if (enableSound && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Ignore audio play errors
      });
    }

    // Auto-dismiss notification
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    // Show browser notification if enabled
    if (isEnabled && newNotification.showBrowserNotification !== false) {
      showBrowserNotification(newNotification);
    }

    if (onNotificationAdd) {
      onNotificationAdd(newNotification);
    }

    return id;
  }, [defaultType, defaultPosition, defaultDuration, maxNotifications, enableSound, isEnabled, onNotificationAdd]);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && onNotificationRemove) {
        onNotificationRemove(notification);
      }
      return prev.filter(n => n.id !== id);
    });
  }, [onNotificationRemove]);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Clear notifications by type
  const clearNotificationsByType = useCallback((type) => {
    setNotifications(prev => prev.filter(n => n.type !== type));
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((notification) => {
    if (!isEnabled || !('Notification' in window)) return;

    try {
      const browserNotification = new Notification(notification.title || 'Notification', {
        body: notification.message,
        icon: notification.icon,
        badge: notification.badge,
        tag: notification.tag,
        requireInteraction: notification.requireInteraction || false,
        silent: !enableSound
      });

      // Handle notification click
      browserNotification.onclick = () => {
        if (notification.onClick) {
          notification.onClick(notification);
        }
        browserNotification.close();
      };

      // Auto-close browser notification
      if (notification.duration > 0) {
        setTimeout(() => {
          browserNotification.close();
        }, notification.duration);
      }
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }, [isEnabled, enableSound]);

  // Convenience methods for different notification types
  const success = useCallback((message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      ...options
    });
  }, [addNotification]);

  const error = useCallback((message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      duration: 0, // Don't auto-dismiss errors by default
      ...options
    });
  }, [addNotification]);

  const warning = useCallback((message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      ...options
    });
  }, [addNotification]);

  const info = useCallback((message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      ...options
    });
  }, [addNotification]);

  // Get notifications by position
  const getNotificationsByPosition = useCallback((position) => {
    return notifications.filter(n => n.position === position);
  }, [notifications]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  return {
    // State
    notifications,
    isEnabled,
    
    // Actions
    addNotification,
    removeNotification,
    clearNotifications,
    clearNotificationsByType,
    requestPermission,
    
    // Convenience methods
    success,
    error,
    warning,
    info,
    
    // Utilities
    getNotificationsByPosition,
    getNotificationsByType
  };
}

/**
 * Hook for notification with custom styling
 * @param {Object} options - Hook options
 * @returns {Object} Notification with styling utilities
 */
function useNotificationWithStyles(options = {}) {
  const {
    customStyles = {},
    theme = 'default',
    ...notificationOptions
  } = options;

  const notification = useNotification(notificationOptions);

  // Get notification styles based on type and theme
  const getNotificationStyles = useCallback((type, position) => {
    const baseStyles = {
      padding: '1rem',
      borderRadius: '0.5rem',
      margin: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid transparent',
      maxWidth: '400px',
      wordWrap: 'break-word',
      zIndex: 1000,
      ...customStyles
    };

    const typeStyles = {
      success: {
        backgroundColor: '#d4edda',
        borderColor: '#c3e6cb',
        color: '#155724'
      },
      error: {
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
        color: '#721c24'
      },
      warning: {
        backgroundColor: '#fff3cd',
        borderColor: '#ffeaa7',
        color: '#856404'
      },
      info: {
        backgroundColor: '#d1ecf1',
        borderColor: '#bee5eb',
        color: '#0c5460'
      }
    };

    const positionStyles = {
      'top-left': {
        top: '1rem',
        left: '1rem'
      },
      'top-right': {
        top: '1rem',
        right: '1rem'
      },
      'bottom-left': {
        bottom: '1rem',
        left: '1rem'
      },
      'bottom-right': {
        bottom: '1rem',
        right: '1rem'
      },
      'top-center': {
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)'
      },
      'bottom-center': {
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)'
      }
    };

    return {
      ...baseStyles,
      ...typeStyles[type],
      ...positionStyles[position]
    };
  }, [customStyles]);

  return {
    ...notification,
    getNotificationStyles
  };
}

/**
 * Hook for notification with progress tracking
 * @param {Object} options - Hook options
 * @returns {Object} Notification with progress utilities
 */
function useNotificationWithProgress(options = {}) {
  const notification = useNotification(options);

  // Add progress notification
  const addProgressNotification = useCallback((message, options = {}) => {
    const id = notification.addNotification({
      type: 'progress',
      message,
      progress: 0,
      ...options
    });

    return {
      id,
      updateProgress: (progress) => {
        notification.setNotifications(prev => 
          prev.map(n => 
            n.id === id ? { ...n, progress } : n
          )
        );
      },
      complete: (message = 'Completed') => {
        notification.setNotifications(prev => 
          prev.map(n => 
            n.id === id ? { ...n, type: 'success', message, progress: 100 } : n
          )
        );
        setTimeout(() => notification.removeNotification(id), 2000);
      },
      fail: (message = 'Failed') => {
        notification.setNotifications(prev => 
          prev.map(n => 
            n.id === id ? { ...n, type: 'error', message } : n
          )
        );
      }
    };
  }, [notification]);

  return {
    ...notification,
    addProgressNotification
  };
}

/**
 * Hook for notification with actions
 * @param {Object} options - Hook options
 * @returns {Object} Notification with action utilities
 */
function useNotificationWithActions(options = {}) {
  const notification = useNotification(options);

  // Add notification with actions
  const addActionNotification = useCallback((message, actions = [], options = {}) => {
    return notification.addNotification({
      type: 'action',
      message,
      actions: actions.map(action => ({
        label: action.label,
        onClick: () => {
          if (action.onClick) {
            action.onClick();
          }
          if (action.dismiss !== false) {
            notification.removeNotification(id);
          }
        },
        style: action.style || 'default',
        dismiss: action.dismiss !== false
      })),
      duration: 0, // Don't auto-dismiss action notifications
      ...options
    });
  }, [notification]);

  // Add confirmation notification
  const addConfirmNotification = useCallback((message, onConfirm, onCancel, options = {}) => {
    const actions = [
      {
        label: 'Cancel',
        onClick: onCancel,
        style: 'secondary'
      },
      {
        label: 'Confirm',
        onClick: onConfirm,
        style: 'primary'
      }
    ];

    return addActionNotification(message, actions, options);
  }, [addActionNotification]);

  return {
    ...notification,
    addActionNotification,
    addConfirmNotification
  };
}

/**
 * Hook for notification with queue management
 * @param {Object} options - Hook options
 * @returns {Object} Notification with queue utilities
 */
function useNotificationQueue(options = {}) {
  const {
    maxQueueSize = 10,
    processInterval = 100,
    ...notificationOptions
  } = options;

  const [queue, setQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const notification = useNotification(notificationOptions);

  // Process queue
  const processQueue = useCallback(() => {
    if (queue.length === 0 || isProcessing) return;

    setIsProcessing(true);
    const nextNotification = queue[0];
    
    notification.addNotification(nextNotification);
    setQueue(prev => prev.slice(1));
    
    setTimeout(() => {
      setIsProcessing(false);
      processQueue();
    }, processInterval);
  }, [queue, isProcessing, notification, processInterval]);

  // Add to queue
  const addToQueue = useCallback((notificationData) => {
    setQueue(prev => {
      const newQueue = [...prev, notificationData];
      if (newQueue.length > maxQueueSize) {
        return newQueue.slice(-maxQueueSize);
      }
      return newQueue;
    });
  }, [maxQueueSize]);

  // Process queue when it changes
  useEffect(() => {
    processQueue();
  }, [processQueue]);

  // Clear queue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // Get queue status
  const getQueueStatus = useCallback(() => {
    return {
      size: queue.length,
      isProcessing,
      maxSize: maxQueueSize
    };
  }, [queue.length, isProcessing, maxQueueSize]);

  return {
    ...notification,
    addToQueue,
    clearQueue,
    getQueueStatus,
    queue
  };
}

/**
 * Hook for notification with history
 * @param {Object} options - Hook options
 * @returns {Object} Notification with history utilities
 */
function useNotificationHistory(options = {}) {
  const {
    maxHistorySize = 100,
    persistHistory = false,
    storageKey = 'notification-history',
    ...notificationOptions
  } = options;

  const [history, setHistory] = useState([]);
  const notification = useNotification({
    ...notificationOptions,
    onNotificationAdd: (notificationData) => {
      addToHistory(notificationData);
      if (notificationOptions.onNotificationAdd) {
        notificationOptions.onNotificationAdd(notificationData);
      }
    }
  });

  // Load history from storage
  useEffect(() => {
    if (persistHistory && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          setHistory(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load notification history:', error);
      }
    }
  }, [persistHistory, storageKey]);

  // Add to history
  const addToHistory = useCallback((notificationData) => {
    setHistory(prev => {
      const newHistory = [...prev, { ...notificationData, timestamp: Date.now() }];
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(-maxHistorySize);
      }
      return newHistory;
    });
  }, [maxHistorySize]);

  // Save history to storage
  useEffect(() => {
    if (persistHistory && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(history));
      } catch (error) {
        console.error('Failed to save notification history:', error);
      }
    }
  }, [history, persistHistory, storageKey]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    if (persistHistory && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [persistHistory, storageKey]);

  // Get history by type
  const getHistoryByType = useCallback((type) => {
    return history.filter(n => n.type === type);
  }, [history]);

  // Get history by date range
  const getHistoryByDateRange = useCallback((startDate, endDate) => {
    return history.filter(n => {
      const timestamp = n.timestamp || 0;
      return timestamp >= startDate.getTime() && timestamp <= endDate.getTime();
    });
  }, [history]);

  return {
    ...notification,
    history,
    clearHistory,
    getHistoryByType,
    getHistoryByDateRange
  };
}

export {
  useNotification,
  useNotificationWithStyles,
  useNotificationWithProgress,
  useNotificationWithActions,
  useNotificationQueue,
  useNotificationHistory
};

export default useNotification;
