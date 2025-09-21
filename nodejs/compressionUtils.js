/**
 * Compression utilities for Node.js
 */

const zlib = require('zlib');
const fs = require('fs').promises;
const path = require('path');

/**
 * Compress string data
 * @param {string} data - Data to compress
 * @param {string} algorithm - Compression algorithm (gzip, deflate, brotli)
 * @returns {Promise<Buffer>} Compressed data
 */
const compressString = async (data, algorithm = 'gzip') => {
  const algorithms = {
    gzip: zlib.gzip,
    deflate: zlib.deflate,
    brotli: zlib.brotliCompress
  };

  const compress = algorithms[algorithm];
  if (!compress) {
    throw new Error(`Unsupported compression algorithm: ${algorithm}`);
  }

  return new Promise((resolve, reject) => {
    compress(data, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

/**
 * Decompress string data
 * @param {Buffer} compressedData - Compressed data
 * @param {string} algorithm - Decompression algorithm (gzip, deflate, brotli)
 * @returns {Promise<string>} Decompressed data
 */
const decompressString = async (compressedData, algorithm = 'gzip') => {
  const algorithms = {
    gzip: zlib.gunzip,
    deflate: zlib.inflate,
    brotli: zlib.brotliDecompress
  };

  const decompress = algorithms[algorithm];
  if (!decompress) {
    throw new Error(`Unsupported decompression algorithm: ${algorithm}`);
  }

  return new Promise((resolve, reject) => {
    decompress(compressedData, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result.toString());
      }
    });
  });
};

/**
 * Compress file
 * @param {string} inputPath - Input file path
 * @param {string} outputPath - Output file path
 * @param {string} algorithm - Compression algorithm
 * @returns {Promise<Object>} Compression result
 */
const compressFile = async (inputPath, outputPath, algorithm = 'gzip') => {
  try {
    const inputData = await fs.readFile(inputPath);
    const compressedData = await compressString(inputData, algorithm);
    await fs.writeFile(outputPath, compressedData);
    
    const inputStats = await fs.stat(inputPath);
    const outputStats = await fs.stat(outputPath);
    
    return {
      success: true,
      inputSize: inputStats.size,
      outputSize: outputStats.size,
      compressionRatio: Math.round((1 - outputStats.size / inputStats.size) * 100),
      algorithm
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Decompress file
 * @param {string} inputPath - Compressed file path
 * @param {string} outputPath - Output file path
 * @param {string} algorithm - Decompression algorithm
 * @returns {Promise<Object>} Decompression result
 */
const decompressFile = async (inputPath, outputPath, algorithm = 'gzip') => {
  try {
    const compressedData = await fs.readFile(inputPath);
    const decompressedData = await decompressString(compressedData, algorithm);
    await fs.writeFile(outputPath, decompressedData);
    
    const inputStats = await fs.stat(inputPath);
    const outputStats = await fs.stat(outputPath);
    
    return {
      success: true,
      inputSize: inputStats.size,
      outputSize: outputStats.size,
      expansionRatio: Math.round((outputStats.size / inputStats.size - 1) * 100),
      algorithm
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Stream compression
 * @param {string} inputPath - Input file path
 * @param {string} outputPath - Output file path
 * @param {string} algorithm - Compression algorithm
 * @returns {Promise<Object>} Compression result
 */
const compressStream = async (inputPath, outputPath, algorithm = 'gzip') => {
  return new Promise((resolve, reject) => {
    const algorithms = {
      gzip: zlib.createGzip,
      deflate: zlib.createDeflate,
      brotli: zlib.createBrotliCompress
    };

    const createCompress = algorithms[algorithm];
    if (!createCompress) {
      reject(new Error(`Unsupported compression algorithm: ${algorithm}`));
      return;
    }

    const inputStream = require('fs').createReadStream(inputPath);
    const outputStream = require('fs').createWriteStream(outputPath);
    const compressStream = createCompress();

    let inputSize = 0;
    let outputSize = 0;

    inputStream.on('data', (chunk) => {
      inputSize += chunk.length;
    });

    outputStream.on('data', (chunk) => {
      outputSize += chunk.length;
    });

    inputStream
      .pipe(compressStream)
      .pipe(outputStream)
      .on('finish', () => {
        resolve({
          success: true,
          inputSize,
          outputSize,
          compressionRatio: Math.round((1 - outputSize / inputSize) * 100),
          algorithm
        });
      })
      .on('error', (error) => {
        reject({
          success: false,
          error: error.message
        });
      });
  });
};

/**
 * Stream decompression
 * @param {string} inputPath - Compressed file path
 * @param {string} outputPath - Output file path
 * @param {string} algorithm - Decompression algorithm
 * @returns {Promise<Object>} Decompression result
 */
const decompressStream = async (inputPath, outputPath, algorithm = 'gzip') => {
  return new Promise((resolve, reject) => {
    const algorithms = {
      gzip: zlib.createGunzip,
      deflate: zlib.createInflate,
      brotli: zlib.createBrotliDecompress
    };

    const createDecompress = algorithms[algorithm];
    if (!createDecompress) {
      reject(new Error(`Unsupported decompression algorithm: ${algorithm}`));
      return;
    }

    const inputStream = require('fs').createReadStream(inputPath);
    const outputStream = require('fs').createWriteStream(outputPath);
    const decompressStream = createDecompress();

    let inputSize = 0;
    let outputSize = 0;

    inputStream.on('data', (chunk) => {
      inputSize += chunk.length;
    });

    outputStream.on('data', (chunk) => {
      outputSize += chunk.length;
    });

    inputStream
      .pipe(decompressStream)
      .pipe(outputStream)
      .on('finish', () => {
        resolve({
          success: true,
          inputSize,
          outputSize,
          expansionRatio: Math.round((outputSize / inputSize - 1) * 100),
          algorithm
        });
      })
      .on('error', (error) => {
        reject({
          success: false,
          error: error.message
        });
      });
  });
};

/**
 * Create archive (tar.gz)
 * @param {string} sourceDir - Source directory
 * @param {string} outputPath - Output archive path
 * @param {Array} excludePatterns - Patterns to exclude
 * @returns {Promise<Object>} Archive creation result
 */
const createArchive = async (sourceDir, outputPath, excludePatterns = []) => {
  try {
    const archiver = require('archiver');
    const output = require('fs').createWriteStream(outputPath);
    const archive = archiver('tar', {
      gzip: true,
      zlib: { level: 9 }
    });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        resolve({
          success: true,
          archiveSize: archive.pointer(),
          message: `Archive created: ${outputPath}`
        });
      });

      archive.on('error', (error) => {
        reject({
          success: false,
          error: error.message
        });
      });

      archive.pipe(output);

      // Add files to archive
      const addFiles = async (dir, prefix = '') => {
        const items = await fs.readdir(dir);
        
        for (const item of items) {
          const itemPath = path.join(dir, item);
          const relativePath = path.join(prefix, item);
          
          // Check if item should be excluded
          const shouldExclude = excludePatterns.some(pattern => {
            if (typeof pattern === 'string') {
              return relativePath.includes(pattern);
            }
            return pattern.test(relativePath);
          });
          
          if (shouldExclude) continue;
          
          const stats = await fs.stat(itemPath);
          
          if (stats.isDirectory()) {
            archive.directory(itemPath, relativePath);
          } else {
            archive.file(itemPath, { name: relativePath });
          }
        }
      };

      addFiles(sourceDir)
        .then(() => archive.finalize())
        .catch(reject);
    });
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Extract archive
 * @param {string} archivePath - Archive file path
 * @param {string} extractDir - Extraction directory
 * @returns {Promise<Object>} Extraction result
 */
const extractArchive = async (archivePath, extractDir) => {
  try {
    const tar = require('tar');
    
    await fs.mkdir(extractDir, { recursive: true });
    await tar.extract({
      file: archivePath,
      cwd: extractDir
    });

    const stats = await fs.stat(archivePath);
    
    return {
      success: true,
      archiveSize: stats.size,
      extractDir,
      message: `Archive extracted to: ${extractDir}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get compression statistics
 * @param {string} originalData - Original data
 * @param {Buffer} compressedData - Compressed data
 * @returns {Object} Compression statistics
 */
const getCompressionStats = (originalData, compressedData) => {
  const originalSize = Buffer.isBuffer(originalData) 
    ? originalData.length 
    : Buffer.byteLength(originalData, 'utf8');
  
  const compressedSize = compressedData.length;
  const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
  const spaceSaved = originalSize - compressedSize;
  
  return {
    originalSize,
    compressedSize,
    compressionRatio,
    spaceSaved,
    efficiency: compressionRatio > 0 ? 'Good' : compressionRatio > -10 ? 'Fair' : 'Poor'
  };
};

/**
 * Compression middleware for Express
 * @param {Object} options - Compression options
 * @returns {Function} Express middleware
 */
const compressionMiddleware = (options = {}) => {
  const compression = require('compression');
  
  const defaultOptions = {
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  };

  return compression({ ...defaultOptions, ...options });
};

/**
 * Compress multiple files
 * @param {Array} filePaths - Array of file paths
 * @param {string} outputDir - Output directory
 * @param {string} algorithm - Compression algorithm
 * @returns {Promise<Array>} Compression results
 */
const compressMultipleFiles = async (filePaths, outputDir, algorithm = 'gzip') => {
  const results = [];
  
  await fs.mkdir(outputDir, { recursive: true });
  
  for (const filePath of filePaths) {
    const fileName = path.basename(filePath);
    const outputPath = path.join(outputDir, `${fileName}.${algorithm}`);
    
    const result = await compressFile(filePath, outputPath, algorithm);
    results.push({
      input: filePath,
      output: outputPath,
      ...result
    });
  }
  
  return results;
};

/**
 * Batch decompression
 * @param {Array} compressedPaths - Array of compressed file paths
 * @param {string} outputDir - Output directory
 * @param {string} algorithm - Decompression algorithm
 * @returns {Promise<Array>} Decompression results
 */
const decompressMultipleFiles = async (compressedPaths, outputDir, algorithm = 'gzip') => {
  const results = [];
  
  await fs.mkdir(outputDir, { recursive: true });
  
  for (const compressedPath of compressedPaths) {
    const fileName = path.basename(compressedPath, `.${algorithm}`);
    const outputPath = path.join(outputDir, fileName);
    
    const result = await decompressFile(compressedPath, outputPath, algorithm);
    results.push({
      input: compressedPath,
      output: outputPath,
      ...result
    });
  }
  
  return results;
};

module.exports = {
  compressString,
  decompressString,
  compressFile,
  decompressFile,
  compressStream,
  decompressStream,
  createArchive,
  extractArchive,
  getCompressionStats,
  compressionMiddleware,
  compressMultipleFiles,
  decompressMultipleFiles
};
