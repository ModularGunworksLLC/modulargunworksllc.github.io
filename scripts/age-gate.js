/**
 * Age Gate - No site-wide gate; browsing is open for everyone.
 * Age verification for ammunition is required at checkout only (see cart page).
 * This file is kept for compatibility; the gate is not shown.
 */

(function () {
  'use strict';

  function init() {
    // No site-wide age gate — browsing stays open. Ammo age verification is at checkout only.
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
