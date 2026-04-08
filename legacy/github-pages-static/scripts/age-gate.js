/**
 * Site-wide Age Gate - Industry standard (PSA, Ammo Depot, Right to Bear Arms, etc.)
 * Pops up when the site loads and requires everyone to click Yes or No if they are 18+.
 * Blocks all content until verification. "No" redirects away; "Yes" allows entry and remembers for 24 hours.
 */
(function () {
  'use strict';

  /* If age-gate.js is bundled or included twice, only the first instance should run */
  if (typeof window.__MGW_AGE_GATE_LOADED !== 'undefined' && window.__MGW_AGE_GATE_LOADED) {
    return;
  }
  window.__MGW_AGE_GATE_LOADED = true;

  var STORAGE_KEY = 'mgw_age_gate_verified';
  var EXPIRY_HOURS = 24;
  var DENY_URL = 'https://www.google.com';

  function isVerified() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      if (!data || !data.ts) return false;
      var expiryMs = EXPIRY_HOURS * 60 * 60 * 1000;
      return (Date.now() - data.ts) < expiryMs;
    } catch (e) {
      return false;
    }
  }

  function setVerified() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() }));
    } catch (e) {}
  }

  /**
   * Keep exactly one age-gate layer. Handles: duplicate IDs in invalid HTML,
   * theme footer + injected copy, or optimizer injecting a second script pass.
   */
  function removeDuplicateAgeGateModals() {
    var byId = document.querySelectorAll('#mgw-age-gate-modal');
    if (byId.length > 1) {
      for (var k = 1; k < byId.length; k++) {
        if (byId[k].parentNode) {
          byId[k].parentNode.removeChild(byId[k]);
        }
      }
    }
    var modals = document.querySelectorAll('.age-gate-modal');
    if (modals.length <= 1) return;
    var keep = document.getElementById('mgw-age-gate-modal') || modals[0];
    for (var i = 0; i < modals.length; i++) {
      if (modals[i] !== keep && modals[i].parentNode) {
        modals[i].parentNode.removeChild(modals[i]);
      }
    }
  }

  function createModal() {
    removeDuplicateAgeGateModals();
    var modal = document.getElementById('mgw-age-gate-modal');
    /* Another copy may exist without a duplicate id — do not add a second */
    if (!modal) {
      var any = document.querySelector('.age-gate-modal');
      if (any) {
        if (!any.id) any.id = 'mgw-age-gate-modal';
        return any;
      }
    } else {
      return modal;
    }

    modal = document.createElement('div');
    modal.id = 'mgw-age-gate-modal';
    modal.className = 'age-gate-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';

    modal.innerHTML =
      '<div class="age-gate-backdrop"></div>' +
      '<div class="age-gate-content" role="dialog" aria-labelledby="mgw-age-gate-title" aria-modal="true">' +
        '<div class="age-gate-header">' +
          '<div class="age-gate-icon" aria-hidden="true"></div>' +
          '<h1 id="mgw-age-gate-title">Age Verification Required</h1>' +
        '</div>' +
        '<p class="age-gate-intro">This website sells firearms, ammunition, and related products. You must be at least <strong>18 years of age</strong> to enter.</p>' +
        '<div class="age-gate-question">' +
          '<p>Are you 18 years of age or older?</p>' +
        '</div>' +
        '<div class="age-gate-buttons">' +
          '<button type="button" class="age-gate-btn age-gate-btn-confirm" id="mgw-age-gate-yes">Yes, I am 18 or older</button>' +
          '<button type="button" class="age-gate-btn age-gate-btn-deny" id="mgw-age-gate-no">No, I am under 18</button>' +
        '</div>' +
        '<div class="age-gate-legal">' +
          '<p>Federal law requires 18+ for rifles/shotguns and ammunition; 21+ for handguns and receivers. By entering, you confirm compliance with all applicable laws.</p>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    return modal;
  }

  function showGate() {
    removeDuplicateAgeGateModals();
    var modal = createModal();
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('age-gate-shown');
    /* Catch late duplicates (plugins, A/B tools) after paint */
    setTimeout(removeDuplicateAgeGateModals, 0);
    setTimeout(removeDuplicateAgeGateModals, 50);
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
    if (window.__mgwAgeGateInitDone) {
      return;
    }
    if (isVerified()) return;

    window.__mgwAgeGateInitDone = true;

    createModal();
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
