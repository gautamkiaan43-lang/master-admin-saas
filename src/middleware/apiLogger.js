/**
 * API Logger Middleware — Super Admin Backend
 *
 * Logs all outbound HTTP calls made to external services (e.g., Payroll backend).
 * Use logApiCall() before/after making axios requests.
 *
 * Usage:
 *   const { logApiCall } = require('../middleware/apiLogger');
 *   const result = await logApiCall('POST', url, axiosCallFn);
 */

/**
 * Log and execute an outbound API call.
 *
 * @param {string} method - HTTP method (GET, POST, PUT, etc.)
 * @param {string} url - Full URL being called
 * @param {Function} apiFn - Async function that makes the actual HTTP call, returns response
 * @returns {Promise<any>} - The response from apiFn
 */
const logApiCall = async (method, url, apiFn) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  try {
    const response = await apiFn();
    const duration = Date.now() - start;
    const status = response?.status || response?.data?.success ? 'OK' : 'UNKNOWN';

    console.log(
      `[API_CALL] ${timestamp} ${method.toUpperCase()} ${url} → ${response?.status || '???'} (${duration}ms)`
    );

    return response;
  } catch (error) {
    const duration = Date.now() - start;
    const status = error?.response?.status || 'ERR';

    console.error(
      `[API_CALL_FAIL] ${timestamp} ${method.toUpperCase()} ${url} → ${status} (${duration}ms) — ${error.message}`
    );

    // Rethrow so caller can handle
    throw error;
  }
};

/**
 * Express middleware that logs every incoming request.
 * Already partially done in app.js, but this version includes more detail.
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[REQUEST] ${timestamp} ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};

module.exports = { logApiCall, requestLogger };
