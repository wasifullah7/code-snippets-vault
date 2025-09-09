/**
 * Lightweight health check utility for Node.js services
 */

const os = require('os');

/**
 * Build a simple health object
 * @param {Object} deps optional dependency checks {db: async () => boolean, cache: async () => boolean}
 */
async function getHealth(deps = {}) {
  const results = {};
  for (const [name, check] of Object.entries(deps)) {
    try {
      // eslint-disable-next-line no-await-in-loop
      results[name] = Boolean(await check());
    } catch (e) {
      results[name] = false;
    }
  }

  return {
    status: Object.values(results).every(Boolean) ? 'ok' : 'degraded',
    uptime: process.uptime(),
    pid: process.pid,
    memory: process.memoryUsage(),
    load: os.loadavg(),
    deps: results,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Express middleware for /healthz
 */
function healthMiddleware(deps = {}) {
  return async (req, res) => {
    const data = await getHealth(deps);
    const code = data.status === 'ok' ? 200 : 503;
    res.status(code).json(data);
  };
}

module.exports = { getHealth, healthMiddleware };


