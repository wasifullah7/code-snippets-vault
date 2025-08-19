/**
 * Advanced database utilities for Node.js applications
 * Comprehensive database connection, query, and management utilities
 */

const { EventEmitter } = require('events');

/**
 * Database connection pool manager
 * Manages multiple database connections with pooling and health checks
 */
class DatabasePoolManager {
  constructor(config = {}) {
    this.config = {
      maxConnections: 10,
      minConnections: 2,
      acquireTimeout: 60000,
      timeout: 30000,
      idleTimeout: 30000,
      ...config
    };
    
    this.pool = null;
    this.connections = new Map();
    this.healthCheckInterval = null;
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Initialize database pool
   * @param {Object} dbConfig - Database configuration
   * @returns {Promise<void>}
   */
  async initialize(dbConfig) {
    try {
      // This is a placeholder - implement with your database driver
      // Example for MySQL2:
      // const mysql = require('mysql2/promise');
      // this.pool = mysql.createPool({
      //   ...dbConfig,
      //   ...this.config
      // });

      this.startHealthCheck();
      this.eventEmitter.emit('pool:initialized');
    } catch (error) {
      this.eventEmitter.emit('pool:error', error);
      throw error;
    }
  }

  /**
   * Get connection from pool
   * @returns {Promise<Object>} Database connection
   */
  async getConnection() {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    try {
      const connection = await this.pool.getConnection();
      this.connections.set(connection.id, {
        connection,
        acquiredAt: Date.now(),
        lastUsed: Date.now()
      });

      this.eventEmitter.emit('connection:acquired', connection.id);
      return connection;
    } catch (error) {
      this.eventEmitter.emit('connection:error', error);
      throw error;
    }
  }

  /**
   * Release connection back to pool
   * @param {Object} connection - Database connection
   */
  async releaseConnection(connection) {
    if (!connection) return;

    try {
      const connectionInfo = this.connections.get(connection.id);
      if (connectionInfo) {
        connectionInfo.lastUsed = Date.now();
        await connection.release();
        this.connections.delete(connection.id);
        this.eventEmitter.emit('connection:released', connection.id);
      }
    } catch (error) {
      this.eventEmitter.emit('connection:release-error', error);
    }
  }

  /**
   * Execute query with connection management
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async executeQuery(query, params = []) {
    const connection = await this.getConnection();
    
    try {
      const result = await connection.query(query, params);
      this.eventEmitter.emit('query:executed', { query, params, result });
      return result;
    } catch (error) {
      this.eventEmitter.emit('query:error', { query, params, error });
      throw error;
    } finally {
      await this.releaseConnection(connection);
    }
  }

  /**
   * Execute transaction
   * @param {Function} callback - Transaction callback
   * @returns {Promise<Object>} Transaction result
   */
  async executeTransaction(callback) {
    const connection = await this.getConnection();
    
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      
      this.eventEmitter.emit('transaction:committed', result);
      return result;
    } catch (error) {
      await connection.rollback();
      this.eventEmitter.emit('transaction:rolled-back', error);
      throw error;
    } finally {
      await this.releaseConnection(connection);
    }
  }

  /**
   * Start health check monitoring
   */
  startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkPoolHealth();
      } catch (error) {
        this.eventEmitter.emit('health:check-failed', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check pool health
   */
  async checkPoolHealth() {
    if (!this.pool) return;

    try {
      const connection = await this.getConnection();
      await connection.ping();
      await this.releaseConnection(connection);
      this.eventEmitter.emit('health:check-passed');
    } catch (error) {
      this.eventEmitter.emit('health:check-failed', error);
    }
  }

  /**
   * Get pool statistics
   * @returns {Object} Pool statistics
   */
  getPoolStats() {
    return {
      totalConnections: this.connections.size,
      maxConnections: this.config.maxConnections,
      minConnections: this.config.minConnections,
      idleConnections: Array.from(this.connections.values()).filter(
        conn => Date.now() - conn.lastUsed > this.config.idleTimeout
      ).length
    };
  }

  /**
   * Close pool and cleanup
   */
  async close() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.pool) {
      await this.pool.end();
    }

    this.eventEmitter.emit('pool:closed');
  }
}

/**
 * Query builder for dynamic SQL generation
 */
class QueryBuilder {
  constructor() {
    this.query = '';
    this.params = [];
    this.conditions = [];
    this.orderBy = [];
    this.limit = null;
    this.offset = null;
  }

  /**
   * Select fields
   * @param {string|Array} fields - Fields to select
   * @returns {QueryBuilder} Query builder instance
   */
  select(fields = '*') {
    const fieldList = Array.isArray(fields) ? fields.join(', ') : fields;
    this.query = `SELECT ${fieldList}`;
    return this;
  }

  /**
   * From table
   * @param {string} table - Table name
   * @returns {QueryBuilder} Query builder instance
   */
  from(table) {
    this.query += ` FROM ${table}`;
    return this;
  }

  /**
   * Add where condition
   * @param {string} field - Field name
   * @param {string} operator - Comparison operator
   * @param {*} value - Value to compare
   * @returns {QueryBuilder} Query builder instance
   */
  where(field, operator, value) {
    this.conditions.push({ field, operator, value });
    return this;
  }

  /**
   * Add AND condition
   * @param {string} field - Field name
   * @param {string} operator - Comparison operator
   * @param {*} value - Value to compare
   * @returns {QueryBuilder} Query builder instance
   */
  andWhere(field, operator, value) {
    return this.where(field, operator, value);
  }

  /**
   * Add OR condition
   * @param {string} field - Field name
   * @param {string} operator - Comparison operator
   * @param {*} value - Value to compare
   * @returns {QueryBuilder} Query builder instance
   */
  orWhere(field, operator, value) {
    this.conditions.push({ field, operator, value, type: 'OR' });
    return this;
  }

  /**
   * Add order by clause
   * @param {string} field - Field name
   * @param {string} direction - Sort direction (ASC/DESC)
   * @returns {QueryBuilder} Query builder instance
   */
  orderBy(field, direction = 'ASC') {
    this.orderBy.push({ field, direction });
    return this;
  }

  /**
   * Add limit clause
   * @param {number} limit - Number of records to limit
   * @returns {QueryBuilder} Query builder instance
   */
  limit(limit) {
    this.limit = limit;
    return this;
  }

  /**
   * Add offset clause
   * @param {number} offset - Number of records to offset
   * @returns {QueryBuilder} Query builder instance
   */
  offset(offset) {
    this.offset = offset;
    return this;
  }

  /**
   * Build the final query
   * @returns {Object} Query and parameters
   */
  build() {
    let finalQuery = this.query;
    let paramIndex = 0;

    // Add WHERE conditions
    if (this.conditions.length > 0) {
      const whereClauses = this.conditions.map((condition, index) => {
        const paramName = `param${paramIndex++}`;
        this.params.push(condition.value);
        
        const prefix = index === 0 ? 'WHERE' : condition.type || 'AND';
        return `${prefix} ${condition.field} ${condition.operator} ?`;
      });
      
      finalQuery += ' ' + whereClauses.join(' ');
    }

    // Add ORDER BY
    if (this.orderBy.length > 0) {
      const orderClauses = this.orderBy.map(order => 
        `${order.field} ${order.direction}`
      );
      finalQuery += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    // Add LIMIT
    if (this.limit !== null) {
      finalQuery += ` LIMIT ${this.limit}`;
    }

    // Add OFFSET
    if (this.offset !== null) {
      finalQuery += ` OFFSET ${this.offset}`;
    }

    return {
      query: finalQuery,
      params: this.params
    };
  }
}

/**
 * Database migration manager
 */
class MigrationManager {
  constructor(dbPool) {
    this.dbPool = dbPool;
    this.migrations = new Map();
  }

  /**
   * Register migration
   * @param {string} name - Migration name
   * @param {Function} up - Up migration function
   * @param {Function} down - Down migration function
   */
  registerMigration(name, up, down) {
    this.migrations.set(name, { up, down });
  }

  /**
   * Create migrations table
   */
  async createMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await this.dbPool.executeQuery(query);
  }

  /**
   * Get executed migrations
   * @returns {Promise<Array>} List of executed migrations
   */
  async getExecutedMigrations() {
    const result = await this.dbPool.executeQuery(
      'SELECT name FROM migrations ORDER BY executed_at'
    );
    return result[0].map(row => row.name);
  }

  /**
   * Run migrations
   * @param {string} target - Target migration (optional)
   */
  async migrate(target = null) {
    await this.createMigrationsTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const pendingMigrations = Array.from(this.migrations.keys())
      .filter(name => !executedMigrations.includes(name))
      .sort();

    if (target) {
      const targetIndex = pendingMigrations.indexOf(target);
      if (targetIndex === -1) {
        throw new Error(`Target migration ${target} not found`);
      }
      pendingMigrations.splice(targetIndex + 1);
    }

    for (const migrationName of pendingMigrations) {
      const migration = this.migrations.get(migrationName);
      
      await this.dbPool.executeTransaction(async (connection) => {
        await migration.up(connection);
        await connection.query(
          'INSERT INTO migrations (name) VALUES (?)',
          [migrationName]
        );
      });
      
      console.log(`Migration ${migrationName} executed successfully`);
    }
  }

  /**
   * Rollback migrations
   * @param {number} steps - Number of migrations to rollback
   */
  async rollback(steps = 1) {
    const executedMigrations = await this.getExecutedMigrations();
    const migrationsToRollback = executedMigrations
      .slice(-steps)
      .reverse();

    for (const migrationName of migrationsToRollback) {
      const migration = this.migrations.get(migrationName);
      
      if (!migration || !migration.down) {
        throw new Error(`Down migration not found for ${migrationName}`);
      }

      await this.dbPool.executeTransaction(async (connection) => {
        await migration.down(connection);
        await connection.query(
          'DELETE FROM migrations WHERE name = ?',
          [migrationName]
        );
      });
      
      console.log(`Migration ${migrationName} rolled back successfully`);
    }
  }
}

/**
 * Database backup utility
 */
class DatabaseBackup {
  constructor(dbConfig) {
    this.dbConfig = dbConfig;
  }

  /**
   * Create database backup
   * @param {string} outputPath - Output file path
   * @returns {Promise<string>} Backup file path
   */
  async createBackup(outputPath) {
    // This is a placeholder - implement with your database backup tool
    // Example for MySQL:
    // const { exec } = require('child_process');
    // const util = require('util');
    // const execAsync = util.promisify(exec);
    
    // const command = `mysqldump -h ${this.dbConfig.host} -u ${this.dbConfig.user} -p${this.dbConfig.password} ${this.dbConfig.database} > ${outputPath}`;
    // await execAsync(command);
    
    console.log(`Backup created at: ${outputPath}`);
    return outputPath;
  }

  /**
   * Restore database from backup
   * @param {string} backupPath - Backup file path
   */
  async restoreBackup(backupPath) {
    // This is a placeholder - implement with your database restore tool
    // Example for MySQL:
    // const { exec } = require('child_process');
    // const util = require('util');
    // const execAsync = util.promisify(exec);
    
    // const command = `mysql -h ${this.dbConfig.host} -u ${this.dbConfig.user} -p${this.dbConfig.password} ${this.dbConfig.database} < ${backupPath}`;
    // await execAsync(command);
    
    console.log(`Database restored from: ${backupPath}`);
  }
}

/**
 * Database performance monitor
 */
class DatabaseMonitor {
  constructor(dbPool) {
    this.dbPool = dbPool;
    this.metrics = {
      queries: [],
      slowQueries: [],
      errors: []
    };
    this.startTime = Date.now();
  }

  /**
   * Log query execution
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @param {number} duration - Execution duration
   * @param {Error} error - Error if any
   */
  logQuery(query, params, duration, error = null) {
    const queryLog = {
      query,
      params,
      duration,
      timestamp: new Date(),
      error: error?.message
    };

    this.metrics.queries.push(queryLog);

    // Track slow queries (over 1000ms)
    if (duration > 1000) {
      this.metrics.slowQueries.push(queryLog);
    }

    // Track errors
    if (error) {
      this.metrics.errors.push(queryLog);
    }

    // Keep only last 1000 queries
    if (this.metrics.queries.length > 1000) {
      this.metrics.queries.shift();
    }
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getStats() {
    const totalQueries = this.metrics.queries.length;
    const totalErrors = this.metrics.errors.length;
    const totalSlowQueries = this.metrics.slowQueries.length;

    const avgDuration = totalQueries > 0 
      ? this.metrics.queries.reduce((sum, q) => sum + q.duration, 0) / totalQueries
      : 0;

    const maxDuration = totalQueries > 0
      ? Math.max(...this.metrics.queries.map(q => q.duration))
      : 0;

    return {
      totalQueries,
      totalErrors,
      totalSlowQueries,
      avgDuration: Math.round(avgDuration),
      maxDuration,
      uptime: Date.now() - this.startTime,
      errorRate: totalQueries > 0 ? (totalErrors / totalQueries) * 100 : 0
    };
  }

  /**
   * Get slow queries report
   * @param {number} limit - Number of queries to return
   * @returns {Array} Slow queries
   */
  getSlowQueries(limit = 10) {
    return this.metrics.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get error report
   * @param {number} limit - Number of errors to return
   * @returns {Array} Error queries
   */
  getErrors(limit = 10) {
    return this.metrics.errors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear metrics
   */
  clearMetrics() {
    this.metrics.queries = [];
    this.metrics.slowQueries = [];
    this.metrics.errors = [];
    this.startTime = Date.now();
  }
}

module.exports = {
  DatabasePoolManager,
  QueryBuilder,
  MigrationManager,
  DatabaseBackup,
  DatabaseMonitor
};
