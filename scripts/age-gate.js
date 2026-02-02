/**
 * Age Gate - Industry-standard age verification for firearm/ammunition retailers
 * Aligns with ATF Gun Control Act: 21+ for handguns and handgun ammo; 18+ for long guns/rifle ammo.
 * This site uses 21+ as the minimum to access (conservative, used by PSA, Ammo Depot, and similar retailers).
 */

(function () {
  'use strict';

  const MIN_AGE = 21;
  const STORAGE_KEY = 'modular-gunworks-age-verified';
  const STORAGE_EXPIRY_MS = 86400000; // 24 hours

  function getStored() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function isVerified() {
    const stored = getStored();
    if (!stored || typeof stored.timestamp !== 'number') return false;
    if (Date.now() - stored.timestamp > STORAGE_EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return true;
  }

  function setVerified() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      verified: true,
      timestamp: Date.now()
    }));
  }

  function hideGate() {
    const modal = document.getElementById('age-gate-modal');
    if (modal) {
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.25s ease-out';
      setTimeout(function () {
        modal.remove();
        document.body.classList.remove('age-gate-shown');
      }, 250);
    } else {
      document.body.classList.remove('age-gate-shown');
    }
  }

  function showGate() {
    document.body.classList.add('age-gate-shown');

    const modal = document.createElement('div');
    modal.className = 'age-gate-modal';
    modal.id = 'age-gate-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'age-gate-title');

    modal.innerHTML =
      '<div class="age-gate-backdrop" aria-hidden="true"></div>' +
      '<div class="age-gate-content">' +
        '<div class="age-gate-header">' +
          '<span class="age-gate-icon" aria-hidden="true"></span>' +
          '<h1 id="age-gate-title">Age Verification Required</h1>' +
        '</div>' +
        '<p class="age-gate-intro">You must be <strong>21 years of age or older</strong> to enter this website. Federal law prohibits the sale of firearms and ammunition to persons under the applicable minimum age in your jurisdiction.</p>' +
        '<div class="age-gate-question">' +
          '<p>Are you 21 years of age or older?</p>' +
        '</div>' +
        '<div class="age-gate-buttons">' +
          '<button type="button" class="age-gate-btn age-gate-btn-confirm" id="age-gate-confirm">Yes, I am 21 or older</button>' +
          '<button type="button" class="age-gate-btn age-gate-btn-deny" id="age-gate-deny">No, I am not</button>' +
        '</div>' +
        '<div class="age-gate-legal">' +
          '<p>By clicking &quot;Yes,&quot; you confirm that you are of legal age to purchase firearms and/or ammunition in your state and agree to comply with all applicable federal, state, and local laws. This site uses a 24-hour verification cookie.</p>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    document.getElementById('age-gate-confirm').addEventListener('click', function () {
      setVerified();
      hideGate();
    });

    document.getElementById('age-gate-deny').addEventListener('click', function () {
      window.location.href = 'https://www.google.com';
    });

    // Prevent closing by clicking backdrop or Escape (industry standard: must choose)
    modal.querySelector('.age-gate-backdrop').addEventListener('click', function (e) {
      e.stopPropagation();
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) e.preventDefault();
    });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        document.removeEventListener('keydown', onKey);
      }
    });
  }

  function init() {
    if (isVerified()) {
      hideGate();
      return;
    }
    showGate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
