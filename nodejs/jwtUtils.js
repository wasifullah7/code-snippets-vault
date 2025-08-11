/**
 * JWT (JSON Web Token) utilities for authentication and authorization
 * @param {string} secret - JWT secret key
 * @param {Object} options - JWT configuration options
 * @param {string} options.algorithm - JWT algorithm (default: 'HS256')
 * @param {number} options.expiresIn - Token expiration time (default: '1h')
 * @param {string} options.issuer - Token issuer (default: 'app')
 * @param {string} options.audience - Token audience (default: 'users')
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTUtils {
  constructor(secret, options = {}) {
    this.secret = secret;
    this.options = {
      algorithm: options.algorithm || 'HS256',
      expiresIn: options.expiresIn || '1h',
      issuer: options.issuer || 'app',
      audience: options.audience || 'users',
      ...options
    };
  }

  /**
   * Generate JWT token
   * @param {Object} payload - Token payload
   * @param {Object} customOptions - Custom options for this token
   * @returns {string} JWT token
   */
  generateToken(payload, customOptions = {}) {
    try {
      const tokenOptions = {
        ...this.options,
        ...customOptions,
        iat: Math.floor(Date.now() / 1000),
        jti: this.generateTokenId()
      };

      return jwt.sign(payload, this.secret, tokenOptions);
    } catch (error) {
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @param {Object} options - Verification options
   * @returns {Object} Decoded token payload
   */
  verifyToken(token, options = {}) {
    try {
      const verifyOptions = {
        issuer: this.options.issuer,
        audience: this.options.audience,
        algorithms: [this.options.algorithm],
        ...options
      };

      return jwt.verify(token, this.secret, verifyOptions);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else if (error.name === 'NotBeforeError') {
        throw new Error('Token not active yet');
      }
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Decode JWT token without verification
   * @param {string} token - JWT token to decode
   * @returns {Object} Decoded token payload
   */
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      throw new Error(`Token decoding failed: ${error.message}`);
    }
  }

  /**
   * Refresh JWT token
   * @param {string} token - Current JWT token
   * @param {Object} newPayload - New payload to include
   * @returns {string} New JWT token
   */
  refreshToken(token, newPayload = {}) {
    try {
      const decoded = this.verifyToken(token);
      const refreshedPayload = {
        ...decoded,
        ...newPayload,
        iat: Math.floor(Date.now() / 1000),
        jti: this.generateTokenId()
      };

      return this.generateToken(refreshedPayload);
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Generate access and refresh token pair
   * @param {Object} payload - Token payload
   * @param {Object} options - Token options
   * @returns {Object} { accessToken, refreshToken }
   */
  generateTokenPair(payload, options = {}) {
    const accessTokenOptions = {
      expiresIn: options.accessExpiresIn || '15m',
      ...options.access
    };

    const refreshTokenOptions = {
      expiresIn: options.refreshExpiresIn || '7d',
      ...options.refresh
    };

    const accessToken = this.generateToken(payload, accessTokenOptions);
    const refreshToken = this.generateToken(
      { ...payload, type: 'refresh' },
      refreshTokenOptions
    );

    return { accessToken, refreshToken };
  }

  /**
   * Extract token from authorization header
   * @param {string} authHeader - Authorization header
   * @returns {string} JWT token
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header format');
    }
    return authHeader.substring(7);
  }

  /**
   * Generate unique token ID
   * @returns {string} Unique token ID
   */
  generateTokenId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} True if expired
   */
  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded.payload.exp) return false;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration time
   * @param {string} token - JWT token
   * @returns {Date} Expiration date
   */
  getTokenExpiration(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded.payload.exp) return null;
      
      return new Date(decoded.payload.exp * 1000);
    } catch (error) {
      return null;
    }
  }
}

// Example usage:
// const jwtUtils = new JWTUtils('your-secret-key', {
//   algorithm: 'HS256',
//   expiresIn: '1h',
//   issuer: 'myapp',
//   audience: 'users'
// });
// 
// // Generate token
// const token = jwtUtils.generateToken({ userId: 123, role: 'user' });
// 
// // Verify token
// const payload = jwtUtils.verifyToken(token);
// 
// // Generate token pair
// const { accessToken, refreshToken } = jwtUtils.generateTokenPair(
//   { userId: 123, role: 'user' },
//   {
//     accessExpiresIn: '15m',
//     refreshExpiresIn: '7d'
//   }
// );
// 
// // Extract from header
// const token = jwtUtils.extractTokenFromHeader('Bearer eyJhbGciOiJIUzI1NiIs...');

module.expormodule.exports = JWTUtils;