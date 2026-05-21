/**
 * Site-wide welcome gate — cookie-based browsing acknowledgment only.
 * Purchase-age certification is enforced at checkout (PHP validation + order meta).
 */
(function () {
  'use strict';

  if (typeof window.__MGW_AGE_GATE_LOADED !== 'undefined' && window.__MGW_AGE_GATE_LOADED) {
    return;
  }
  window.__MGW_AGE_GATE_LOADED = true;

  var COOKIE_NAME = 'mgw_site_welcome_verified';
  var cfg = typeof mgwAgeGateConfig !== 'undefined' ? mgwAgeGateConfig : {};
  var EXPIRY_HOURS = (cfg.expiryHours || 24);
  var DENY_URL = cfg.denyUrl || 'https://www.google.com';

  function getExpiryHours() {
    return EXPIRY_HOURS;
  }

  function setCookie(name, value, maxAgeSeconds) {
    var secure = window.location && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = name + '=' + encodeURIComponent(value) +
      '; path=/; SameSite=Lax; Max-Age=' + String(maxAgeSeconds) + secure;
  }

  function getCookie(name) {
    var parts = ('; ' + document.cookie).split('; ' + name + '=');
    if (parts.length === 2) {
      return decodeURIComponent(parts.pop().split(';').shift());
    }
    return '';
  }

  function isVerified() {
    return getCookie(COOKIE_NAME) === '1';
  }

  function setVerified() {
    var sec = Math.max(3600, Math.floor((getExpiryHours() || 24) * 3600));
    setCookie(COOKIE_NAME, '1', sec);
  }

  function showGate() {
    var modal = document.getElementById('mgw-age-gate-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('age-gate-shown');
  }

  function hideGate() {
    var modal = document.getElementById('mgw-age-gate-modal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('age-gate-shown');
  }

  function onYes() {
    setVerified();
    hideGate();
  }

  function onNo() {
    window.location.href = DENY_URL;
  }

  function init() {
    if (isVerified()) return;

    showGate();

    var yesBtn = document.getElementById('mgw-age-gate-yes');
    var noBtn = document.getElementById('mgw-age-gate-no');

    if (yesBtn) yesBtn.addEventListener('click', onYes);
    if (noBtn) noBtn.addEventListener('click', onNo);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
