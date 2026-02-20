/**
 * Shared category normalization for sync and mapping tools.
 * Use this so feed-vs-mapping logic never drifts.
 */

/**
 * Normalize feed Category to match mapping keys (e.g. "Chassis &amp; Stocks" -> "Chassis & Stocks").
 * @param {string} cat - Raw Category from feed
 * @returns {string}
 */
function normalizeCategoryKey(cat) {
  if (!cat || typeof cat !== 'string') return (cat || '').trim();
  return cat
    .trim()
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

module.exports = { normalizeCategoryKey };
