/**
 * Network utilities for Node.js
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Make HTTP request
 * @param {string} url - URL to request
 * @param {Object} options - Request options
 * @returns {Promise} Response promise
 */
const makeRequest = (url, options = {}) => {
  const {
    method = 'GET',
    headers = {},
    body = null,
    timeout = 10000,
    followRedirects = true
  } = options;
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'User-Agent': 'Node.js Network Utils',
        'Content-Type': 'application/json',
        ...headers
      },
      timeout
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          };
          
          // Try to parse JSON
          if (res.headers['content-type']?.includes('application/json')) {
            try {
              response.data = JSON.parse(data);
            } catch {
              // Keep as string if parsing fails
            }
          }
          
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    
    req.end();
  });
};

/**
 * Check if URL is reachable
 * @param {string} url - URL to check
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} True if URL is reachable
 */
const isUrlReachable = async (url, timeout = 5000) => {
  try {
    const response = await makeRequest(url, {
      method: 'HEAD',
      timeout
    });
    return response.statusCode >= 200 && response.statusCode < 400;
  } catch {
    return false;
  }
};

/**
 * Get IP address
 * @returns {Promise<string>} IP address
 */
const getIPAddress = async () => {
  try {
    const response = await makeRequest('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch {
    return 'Unknown';
  }
};

/**
 * Get geolocation from IP
 * @param {string} ip - IP address
 * @returns {Promise<Object>} Geolocation data
 */
const getGeolocationFromIP = async (ip) => {
  try {
    const response = await makeRequest(`https://ipapi.co/${ip}/json/`);
    return response.data;
  } catch {
    return null;
  }
};

/**
 * Test network speed
 * @param {string} testUrl - URL for speed test
 * @returns {Promise<Object>} Speed test results
 */
const testNetworkSpeed = async (testUrl = 'https://httpbin.org/bytes/1024') => {
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(testUrl);
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    const size = response.headers['content-length'] || 1024;
    const speed = (size * 8) / (duration / 1000); // bits per second
    
    return {
      duration,
      size,
      speed,
      speedMbps: speed / (1024 * 1024)
    };
  } catch (error) {
    throw new Error('Speed test failed');
  }
};

/**
 * Download file from URL
 * @param {string} url - File URL
 * @param {string} outputPath - Output file path
 * @param {Object} options - Download options
 * @returns {Promise} Download promise
 */
const downloadFile = (url, outputPath, options = {}) => {
  const {
    onProgress = null,
    timeout = 30000
  } = options;
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout
    };
    
    const req = client.request(requestOptions, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Handle redirects
        return downloadFile(res.headers.location, outputPath, options)
          .then(resolve)
          .catch(reject);
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed: ${res.statusCode}`));
        return;
      }
      
      const fs = require('fs');
      const writeStream = fs.createWriteStream(outputPath);
      let downloadedBytes = 0;
      const totalBytes = parseInt(res.headers['content-length'] || '0');
      
      res.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        writeStream.write(chunk);
        
        if (onProgress && totalBytes > 0) {
          const progress = (downloadedBytes / totalBytes) * 100;
          onProgress(progress);
        }
      });
      
      res.on('end', () => {
        writeStream.end();
        resolve();
      });
      
      res.on('error', (error) => {
        writeStream.destroy();
        reject(error);
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Download timeout'));
    });
    
    req.end();
  });
};

/**
 * Upload file to URL
 * @param {string} url - Upload endpoint
 * @param {string} filePath - File path to upload
 * @param {Object} options - Upload options
 * @returns {Promise} Upload promise
 */
const uploadFile = (url, filePath, options = {}) => {
  const {
    onProgress = null,
    headers = {},
    timeout = 30000
  } = options;
  
  return new Promise((resolve, reject) => {
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(filePath)) {
      reject(new Error('File not found'));
      return;
    }
    
    const fileStats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const boundary = '----formdata-' + Math.random().toString(36);
    const fileStream = fs.createReadStream(filePath);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'User-Agent': 'Node.js Network Utils',
        ...headers
      },
      timeout
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          };
          
          if (res.headers['content-type']?.includes('application/json')) {
            try {
              response.data = JSON.parse(data);
            } catch {
              // Keep as string if parsing fails
            }
          }
          
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Upload timeout'));
    });
    
    // Write multipart form data
    req.write(`--${boundary}\r\n`);
    req.write(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`);
    req.write(`Content-Type: application/octet-stream\r\n\r\n`);
    
    let uploadedBytes = 0;
    
    fileStream.on('data', (chunk) => {
      uploadedBytes += chunk.length;
      req.write(chunk);
      
      if (onProgress) {
        const progress = (uploadedBytes / fileStats.size) * 100;
        onProgress(progress);
      }
    });
    
    fileStream.on('end', () => {
      req.write(`\r\n--${boundary}--\r\n`);
      req.end();
    });
    
    fileStream.on('error', (error) => {
      req.destroy();
      reject(error);
    });
  });
};

/**
 * Create HTTP server
 * @param {Object} options - Server options
 * @returns {Object} Server instance
 */
const createServer = (options = {}) => {
  const {
    port = 3000,
    hostname = 'localhost',
    routes = {},
    middleware = []
  } = options;
  
  const server = http.createServer((req, res) => {
    // Apply middleware
    middleware.forEach(middlewareFn => {
      middlewareFn(req, res);
    });
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const method = req.method.toUpperCase();
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    const routeKey = `${method}:${path}`;
    const route = routes[routeKey] || routes[`${method}:*`];
    
    if (route) {
      let body = '';
      
      req.on('data', (chunk) => {
        body += chunk;
      });
      
      req.on('end', () => {
        try {
          const requestData = {
            method,
            url: req.url,
            headers: req.headers,
            body: body ? JSON.parse(body) : null,
            query: Object.fromEntries(url.searchParams)
          };
          
          const response = route(requestData);
          
          res.writeHead(response.statusCode || 200, {
            'Content-Type': 'application/json'
          });
          
          res.end(JSON.stringify(response.data || {}));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });
  
  return {
    start: () => {
      return new Promise((resolve) => {
        server.listen(port, hostname, () => {
          console.log(`Server running at http://${hostname}:${port}/`);
          resolve();
        });
      });
    },
    stop: () => {
      return new Promise((resolve) => {
        server.close(() => {
          console.log('Server stopped');
          resolve();
        });
      });
    }
  };
};

/**
 * Retry network request
 * @param {Function} requestFn - Request function
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Delay between retries
 * @returns {Promise} Request promise
 */
const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Batch network requests
 * @param {Array} requests - Array of request functions
 * @param {number} concurrency - Maximum concurrent requests
 * @returns {Promise<Array>} Results array
 */
const batchRequests = async (requests, concurrency = 5) => {
  const results = [];
  const executing = [];
  
  for (const request of requests) {
    const promise = request().then(result => {
      results.push(result);
      return result;
    });
    
    executing.push(promise);
    
    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }
  
  await Promise.all(executing);
  return results;
};

/**
 * Get network interfaces
 * @returns {Array} Network interfaces
 */
const getNetworkInterfaces = () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const result = [];
  
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(interface => {
      if (!interface.internal) {
        result.push({
          name,
          address: interface.address,
          family: interface.family,
          mac: interface.mac
        });
      }
    });
  });
  
  return result;
};

/**
 * Check if port is available
 * @param {number} port - Port to check
 * @param {string} hostname - Hostname to check
 * @returns {Promise<boolean>} True if port is available
 */
const isPortAvailable = (port, hostname = 'localhost') => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, hostname, () => {
      server.close(() => {
        resolve(true);
      });
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
};

/**
 * Get local IP address
 * @returns {string} Local IP address
 */
const getLocalIPAddress = () => {
  const interfaces = getNetworkInterfaces();
  const interface = interfaces.find(i => i.family === 'IPv4');
  return interface ? interface.address : '127.0.0.1';
};

module.exports = {
  makeRequest,
  isUrlReachable,
  getIPAddress,
  getGeolocationFromIP,
  testNetworkSpeed,
  downloadFile,
  uploadFile,
  createServer,
  retryRequest,
  batchRequests,
  getNetworkInterfaces,
  isPortAvailable,
  getLocalIPAddress
};
