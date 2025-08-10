/**
 * MongoDB connection utility with advanced configuration
 * @param {string} uri - MongoDB connection string
 * @param {Object} options - Connection options
 * @param {number} options.maxPoolSize - Maximum pool size (default: 10)
 * @param {number} options.serverSelectionTimeoutMS - Server selection timeout (default: 5000)
 * @param {number} options.socketTimeoutMS - Socket timeout (default: 45000)
 * @param {boolean} options.bufferMaxEntries - Buffer max entries (default: 0)
 * @param {boolean} options.autoReconnect - Auto reconnect (default: true)
 * @param {number} options.reconnectTries - Reconnect attempts (default: Number.MAX_VALUE)
 * @param {number} options.reconnectInterval - Reconnect interval in ms (default: 1000)
 * @returns {Promise<Object>} MongoDB connection object
 */
const mongoose = require('mongoose');

async function connectMongo(uri, options = {}) {
  const {
    maxPoolSize = 10,
    serverSelectionTimeoutMS = 5000,
    socketTimeoutMS = 45000,
    bufferMaxEntries = 0,
    autoReconnect = true,
    reconnectTries = Number.MAX_VALUE,
    reconnectInterval = 1000
  } = options;

  // Connection configuration
  const connectionOptions = {
    maxPoolSize,
    serverSelectionTimeoutMS,
    socketTimeoutMS,
    bufferMaxEntries,
    autoReconnect,
    reconnectTries,
    reconnectInterval,
    useNewUrlParser: true,
    useUnifiedTopology: true
  };

  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(uri, connectionOptions);
    
    console.log(` MongoDB Connected: ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.name}`);
    console.log(` Connection State: ${conn.connection.readyState}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(' MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(' MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log(' MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log(' MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    return conn;
    
  } catch (error) {
    console.error(' MongoDB connection failed:', error.message);
    console.error(' Connection details:', {
      uri: uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Hide credentials
      options: connectionOptions
    });
    
    // Retry logic for connection failures
    if (options.retryOnFailure !== false) {
      console.log(' Retrying connection in 5 seconds...');
      setTimeout(() => {
        connectMongo(uri, options);
      }, 5000);
    }
    
    throw error;
  }
}

// Example usage:
// const connectToDatabase = async () => {
//   try {
//     await connectMongo('mongodb://localhost:27017/myapp', {
//       maxPoolSize: 20,
//       serverSelectionTimeoutMS: 10000
//     });
//   } catch (error) {
//     console.error('Failed to connect to database:', error);
//     process.exit(1);
//   }
// };
// 
// connectToDatabase();

module.exports = connectMongo;