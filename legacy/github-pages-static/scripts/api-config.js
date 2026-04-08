/**
 * API base URL for backend requests.
 * - localhost: use same origin (for local testing).
 * - Otherwise: Northflank (Node server).
 */
window.API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? '' : 'https://http--modular-gunworks--4mr9hkqdw4ml.code.run';
