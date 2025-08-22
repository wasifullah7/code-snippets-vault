import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom React hook for WebSocket functionality
 * Provides real-time WebSocket connection management with automatic reconnection
 * @param {string} url - WebSocket URL
 * @param {Object} options - Hook options
 * @returns {Object} WebSocket state and utilities
 */
function useWebSocket(url, options = {}) {
  const {
    onOpen = null,
    onClose = null,
    onMessage = null,
    onError = null,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
    maxReconnectDelay = 30000,
    shouldReconnect = true,
    protocols = []
  } = options;

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(shouldReconnect);

  // Update shouldReconnect ref when prop changes
  useEffect(() => {
    shouldReconnectRef.current = shouldReconnect;
  }, [shouldReconnect]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!url) return;

    try {
      setConnectionStatus('connecting');
      setError(null);

      const ws = new WebSocket(url, protocols);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        setReconnectAttemptsRef(0);
        if (onOpen) onOpen(ws);
      };

      ws.onmessage = (event) => {
        const message = {
          data: event.data,
          timestamp: Date.now(),
          type: event.type
        };
        setLastMessage(message);
        if (onMessage) onMessage(message);
      };

      ws.onclose = (event) => {
        setConnectionStatus('disconnected');
        if (onClose) onClose(event);

        // Attempt reconnection if enabled and not a clean close
        if (shouldReconnectRef.current && !event.wasClean && reconnectAttemptsRef.current < reconnectAttempts) {
          scheduleReconnect();
        }
      };

      ws.onerror = (event) => {
        setError(event);
        setConnectionStatus('error');
        if (onError) onError(event);
      };
    } catch (err) {
      setError(err);
      setConnectionStatus('error');
      if (onError) onError(err);
    }
  }, [url, protocols, onOpen, onClose, onMessage, onError, reconnectAttempts]);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(
      reconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
      maxReconnectDelay
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      setReconnectCount(reconnectAttemptsRef.current);
      connect();
    }, delay);
  }, [reconnectDelay, maxReconnectDelay, connect]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
    setReconnectCount(0);
    setReconnectAttemptsRef(0);
  }, []);

  // Send message
  const sendMessage = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      wsRef.current.send(message);
      return true;
    }
    return false;
  }, []);

  // Send binary data
  const sendBinary = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
      return true;
    }
    return false;
  }, []);

  // Initialize connection
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    connectionStatus,
    lastMessage,
    error,
    reconnectCount,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    sendBinary,
    
    // Computed values
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    isDisconnected: connectionStatus === 'disconnected',
    hasError: connectionStatus === 'error'
  };
}

/**
 * Hook for WebSocket with message history
 * @param {string} url - WebSocket URL
 * @param {Object} options - Hook options
 * @returns {Object} WebSocket with message history
 */
function useWebSocketWithHistory(url, options = {}) {
  const {
    maxHistorySize = 100,
    ...websocketOptions
  } = options;

  const [messageHistory, setMessageHistory] = useState([]);
  const websocket = useWebSocket(url, {
    ...websocketOptions,
    onMessage: (message) => {
      setMessageHistory(prev => {
        const newHistory = [...prev, message];
        if (newHistory.length > maxHistorySize) {
          return newHistory.slice(-maxHistorySize);
        }
        return newHistory;
      });
      
      if (websocketOptions.onMessage) {
        websocketOptions.onMessage(message);
      }
    }
  });

  // Clear message history
  const clearHistory = useCallback(() => {
    setMessageHistory([]);
  }, []);

  return {
    ...websocket,
    messageHistory,
    clearHistory
  };
}

/**
 * Hook for WebSocket with automatic JSON parsing
 * @param {string} url - WebSocket URL
 * @param {Object} options - Hook options
 * @returns {Object} WebSocket with JSON parsing
 */
function useWebSocketJSON(url, options = {}) {
  const {
    onMessage: originalOnMessage,
    ...websocketOptions
  } = options;

  const [lastJSONMessage, setLastJSONMessage] = useState(null);
  const [parseError, setParseError] = useState(null);

  const websocket = useWebSocket(url, {
    ...websocketOptions,
    onMessage: (message) => {
      try {
        const parsedData = JSON.parse(message.data);
        const jsonMessage = {
          ...message,
          data: parsedData
        };
        setLastJSONMessage(jsonMessage);
        setParseError(null);
        
        if (originalOnMessage) {
          originalOnMessage(jsonMessage);
        }
      } catch (err) {
        setParseError(err);
        // Still call original handler with raw message
        if (originalOnMessage) {
          originalOnMessage(message);
        }
      }
    }
  });

  return {
    ...websocket,
    lastJSONMessage,
    parseError
  };
}

/**
 * Hook for WebSocket with heartbeat/ping functionality
 * @param {string} url - WebSocket URL
 * @param {Object} options - Hook options
 * @returns {Object} WebSocket with heartbeat
 */
function useWebSocketHeartbeat(url, options = {}) {
  const {
    heartbeatInterval = 30000, // 30 seconds
    heartbeatMessage = 'ping',
    onHeartbeat = null,
    ...websocketOptions
  } = options;

  const heartbeatIntervalRef = useRef(null);
  const lastHeartbeatRef = useRef(null);

  const websocket = useWebSocket(url, {
    ...websocketOptions,
    onOpen: (ws) => {
      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        if (websocket.isConnected) {
          websocket.sendMessage(heartbeatMessage);
          lastHeartbeatRef.current = Date.now();
          if (onHeartbeat) onHeartbeat();
        }
      }, heartbeatInterval);

      if (websocketOptions.onOpen) {
        websocketOptions.onOpen(ws);
      }
    },
    onClose: (event) => {
      // Stop heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      if (websocketOptions.onClose) {
        websocketOptions.onClose(event);
      }
    }
  });

  // Get time since last heartbeat
  const getTimeSinceLastHeartbeat = useCallback(() => {
    if (!lastHeartbeatRef.current) return null;
    return Date.now() - lastHeartbeatRef.current;
  }, []);

  // Cleanup heartbeat on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  return {
    ...websocket,
    timeSinceLastHeartbeat: getTimeSinceLastHeartbeat()
  };
}

/**
 * Hook for WebSocket with message queuing
 * @param {string} url - WebSocket URL
 * @param {Object} options - Hook options
 * @returns {Object} WebSocket with message queuing
 */
function useWebSocketQueue(url, options = {}) {
  const {
    maxQueueSize = 100,
    flushInterval = 1000, // 1 second
    ...websocketOptions
  } = options;

  const [messageQueue, setMessageQueue] = useState([]);
  const flushIntervalRef = useRef(null);

  const websocket = useWebSocket(url, {
    ...websocketOptions,
    onOpen: (ws) => {
      // Start flush interval
      flushIntervalRef.current = setInterval(() => {
        flushQueue();
      }, flushInterval);

      if (websocketOptions.onOpen) {
        websocketOptions.onOpen(ws);
      }
    },
    onClose: (event) => {
      // Stop flush interval
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }

      if (websocketOptions.onClose) {
        websocketOptions.onClose(event);
      }
    }
  });

  // Add message to queue
  const queueMessage = useCallback((data) => {
    setMessageQueue(prev => {
      const newQueue = [...prev, { data, timestamp: Date.now() }];
      if (newQueue.length > maxQueueSize) {
        return newQueue.slice(-maxQueueSize);
      }
      return newQueue;
    });
  }, [maxQueueSize]);

  // Flush message queue
  const flushQueue = useCallback(() => {
    if (!websocket.isConnected || messageQueue.length === 0) return;

    setMessageQueue(prev => {
      const messagesToSend = [...prev];
      messagesToSend.forEach(({ data }) => {
        websocket.sendMessage(data);
      });
      return [];
    });
  }, [websocket.isConnected, messageQueue.length, websocket.sendMessage]);

  // Send message (immediate or queued)
  const sendMessage = useCallback((data, immediate = false) => {
    if (immediate && websocket.isConnected) {
      return websocket.sendMessage(data);
    } else {
      queueMessage(data);
      return true;
    }
  }, [websocket.isConnected, websocket.sendMessage, queueMessage]);

  // Clear message queue
  const clearQueue = useCallback(() => {
    setMessageQueue([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
      }
    };
  }, []);

  return {
    ...websocket,
    messageQueue,
    queueMessage,
    flushQueue,
    sendMessage,
    clearQueue
  };
}

/**
 * Hook for WebSocket with connection status monitoring
 * @param {string} url - WebSocket URL
 * @param {Object} options - Hook options
 * @returns {Object} WebSocket with connection monitoring
 */
function useWebSocketMonitor(url, options = {}) {
  const {
    monitorInterval = 5000, // 5 seconds
    onConnectionLost = null,
    onConnectionRestored = null,
    ...websocketOptions
  } = options;

  const [connectionStats, setConnectionStats] = useState({
    totalConnections: 0,
    totalDisconnections: 0,
    totalMessages: 0,
    totalErrors: 0,
    uptime: 0,
    lastConnectionTime: null,
    lastDisconnectionTime: null
  });

  const monitorIntervalRef = useRef(null);
  const connectionStartTimeRef = useRef(null);
  const wasConnectedRef = useRef(false);

  const websocket = useWebSocket(url, {
    ...websocketOptions,
    onOpen: (ws) => {
      connectionStartTimeRef.current = Date.now();
      wasConnectedRef.current = true;
      
      setConnectionStats(prev => ({
        ...prev,
        totalConnections: prev.totalConnections + 1,
        lastConnectionTime: Date.now()
      }));

      if (onConnectionRestored) {
        onConnectionRestored();
      }

      if (websocketOptions.onOpen) {
        websocketOptions.onOpen(ws);
      }
    },
    onClose: (event) => {
      if (wasConnectedRef.current) {
        wasConnectedRef.current = false;
        
        setConnectionStats(prev => ({
          ...prev,
          totalDisconnections: prev.totalDisconnections + 1,
          lastDisconnectionTime: Date.now()
        }));

        if (onConnectionLost) {
          onConnectionLost();
        }
      }

      if (websocketOptions.onClose) {
        websocketOptions.onClose(event);
      }
    },
    onMessage: (message) => {
      setConnectionStats(prev => ({
        ...prev,
        totalMessages: prev.totalMessages + 1
      }));

      if (websocketOptions.onMessage) {
        websocketOptions.onMessage(message);
      }
    },
    onError: (error) => {
      setConnectionStats(prev => ({
        ...prev,
        totalErrors: prev.totalErrors + 1
      }));

      if (websocketOptions.onError) {
        websocketOptions.onError(error);
      }
    }
  });

  // Update uptime
  useEffect(() => {
    monitorIntervalRef.current = setInterval(() => {
      if (websocket.isConnected && connectionStartTimeRef.current) {
        setConnectionStats(prev => ({
          ...prev,
          uptime: Date.now() - connectionStartTimeRef.current
        }));
      }
    }, monitorInterval);

    return () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
      }
    };
  }, [websocket.isConnected, monitorInterval]);

  // Reset stats
  const resetStats = useCallback(() => {
    setConnectionStats({
      totalConnections: 0,
      totalDisconnections: 0,
      totalMessages: 0,
      totalErrors: 0,
      uptime: 0,
      lastConnectionTime: null,
      lastDisconnectionTime: null
    });
  }, []);

  return {
    ...websocket,
    connectionStats,
    resetStats
  };
}

export {
  useWebSocket,
  useWebSocketWithHistory,
  useWebSocketJSON,
  useWebSocketHeartbeat,
  useWebSocketQueue,
  useWebSocketMonitor
};

export default useWebSocket;
