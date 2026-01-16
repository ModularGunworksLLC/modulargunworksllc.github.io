/**
 * Age Gate - Verify user age before access
 * Compliant with firearm/adult product regulations
 */

class AgeGate {
  constructor(options = {}) {
    this.minAge = options.minAge || 18;
    this.storageKey = 'modular-gunworks-age-verified';
    this.storageExpiry = options.storageExpiry || 86400000; // 24 hours in ms
    
    this.init();
  }

  init() {
    // TEMPORARY: Skip age gate for testing/debugging - REMOVE AFTER AUDIT
    this.hideAgeGate();
    return;
    
    // Check if user already verified
    if (this.isVerified()) {
      this.hideAgeGate();
      return;
    }

    // Create and show age gate
    this.createAgeGate();
  }

  isVerified() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return false;

    const { timestamp } = JSON.parse(stored);
    const now = Date.now();

    // Check if verification has expired
    if (now - timestamp > this.storageExpiry) {
      localStorage.removeItem(this.storageKey);
      return false;
    }

    return true;
  }

  createAgeGate() {
    // Block body scrolling
    document.body.classList.add('age-gate-shown');

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'age-gate-modal';
    modal.id = 'age-gate-modal';

    modal.innerHTML = `
      <div class="age-gate-content">
        <h1>Age Verification Required</h1>
        <p>You must be at least ${this.minAge} years old to access this site.</p>
        
        <div class="age-gate-question">
          <p>Are you ${this.minAge} years or older?</p>
        </div>

        <div class="age-gate-buttons">
          <button type="button" class="age-gate-btn age-gate-btn-confirm" id="confirm-btn">Yes, I am ${this.minAge}+</button>
          <button type="button" class="age-gate-btn age-gate-btn-deny" id="deny-btn">No, I am under ${this.minAge}</button>
        </div>

        <div class="age-gate-legal">
          <p>By clicking "Yes," you confirm that you are at least ${this.minAge} years old.</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachEventListeners();
  }

  populateSelects(currentYear) {
    // This method is no longer needed with Yes/No buttons
  }

  attachEventListeners() {
    const confirmBtn = document.getElementById('confirm-btn');
    const denyBtn = document.getElementById('deny-btn');

    confirmBtn.addEventListener('click', () => {
      this.verify();
    });

    denyBtn.addEventListener('click', () => {
      window.location.href = 'https://www.google.com';
    });
  }

  handleSubmit() {
    // This method is no longer needed with Yes/No buttons
  }

  verify() {
    localStorage.setItem(this.storageKey, JSON.stringify({
      verified: true,
      timestamp: Date.now()
    }));

    this.hideAgeGate();
  }

  hideAgeGate() {
    const modal = document.getElementById('age-gate-modal');
    if (modal) {
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        modal.remove();
        document.body.classList.remove('age-gate-shown');
      }, 300);
    } else {
      document.body.classList.remove('age-gate-shown');
    }
  }
}

// Initialize age gate when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AgeGate({ minAge: 18 });
  });
} else {
  new AgeGate({ minAge: 18 });
}
