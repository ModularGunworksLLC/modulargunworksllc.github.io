/**
 * Age Gate Modal
 * Blocks underage access to firearms retail site
 * Compliant with federal firearms regulations
 */

class AgeGate {
  constructor() {
    this.storageKey = 'mg_age_verified';
    this.expirationDays = 30;
    this.init();
  }

  init() {
    console.log('AgeGate initializing...');
    // Force clear old verification for testing
    localStorage.removeItem(this.storageKey);
    console.log('Storage key cleared for testing');
    
    // Check if already verified in this session
    if (this.isVerified()) {
      console.log('User already verified, hiding modal');
      // User already confirmed, hide modal
      this.hideModal();
      return;
    }

    console.log('User not verified, creating modal');
    // Show age gate modal
    this.createModal();
    this.attachEventListeners();
  }

  isVerified() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return false;

    // Parse stored data
    try {
      const data = JSON.parse(stored);
      const expirationTime = new Date(data.expires).getTime();
      const now = new Date().getTime();

      // Check if expired
      if (now > expirationTime) {
        localStorage.removeItem(this.storageKey);
        return false;
      }

      return data.verified === true;
    } catch (e) {
      localStorage.removeItem(this.storageKey);
      return false;
    }
  }

  createModal() {
    // Create modal HTML
    const modalHTML = `
      <div id="age-gate-backdrop" class="age-gate-backdrop">
        <div id="age-gate-modal" class="age-gate-modal">
          <!-- Close button (hidden for age gate - user must choose) -->
          
          <!-- Logo -->
          <div class="age-gate-logo">
            <img src="../images/modular-gunworks-llc.png" alt="Modular Gunworks LLC" />
          </div>

          <!-- Heading -->
          <h1 class="age-gate-title">Age Verification Required</h1>

          <!-- Message -->
          <p class="age-gate-message">
            You must be <strong>18 years or older</strong> to browse this website.
          </p>

          <p class="age-gate-subtext">
            This site sells firearms and firearms accessories. Federal law prohibits the sale of certain firearms and ammunition to persons under the age of 18 and 21.
          </p>

          <!-- Certification Text -->
          <p class="age-gate-certification">
            By clicking "I Confirm," you certify that you are at least 18 years old and understand that you may be 21 or older to purchase certain items.
          </p>

          <!-- Buttons -->
          <div class="age-gate-buttons">
            <button id="age-gate-yes" class="age-gate-btn age-gate-btn-confirm" aria-label="I am 18 or older">
              I Confirm
            </button>
            <button id="age-gate-no" class="age-gate-btn age-gate-btn-decline" aria-label="I am under 18">
              I Decline
            </button>
          </div>

          <!-- Legal disclaimer -->
          <p class="age-gate-disclaimer">
            <small>Providing false information is a federal crime</small>
          </p>
        </div>
      </div>
    `;

    // Insert modal into DOM
    document.body.insertAdjacentHTML('afterbegin', modalHTML);
  }

  attachEventListeners() {
    const yesBtn = document.getElementById('age-gate-yes');
    const noBtn = document.getElementById('age-gate-no');

    if (yesBtn) {
      yesBtn.addEventListener('click', () => this.handleConfirm());
    }

    if (noBtn) {
      noBtn.addEventListener('click', () => this.handleDecline());
    }

    // Prevent closing modal by clicking backdrop
    const backdrop = document.getElementById('age-gate-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          // Do nothing - force user to make choice
          e.preventDefault();
        }
      });
    }

    // Prevent escape key from closing
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isModalVisible()) {
        e.preventDefault();
      }
    });
  }

  handleConfirm() {
    // Store verification
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + this.expirationDays);

    const verificationData = {
      verified: true,
      confirmedAt: new Date().toISOString(),
      expires: expirationDate.toISOString()
    };

    localStorage.setItem(this.storageKey, JSON.stringify(verificationData));

    // Hide modal
    this.hideModal();

    // Optional: Log for compliance tracking
    console.log('Age verification confirmed');
  }

  handleDecline() {
    // Show decline message
    const modal = document.getElementById('age-gate-modal');
    if (modal) {
      modal.innerHTML = `
        <div class="age-gate-decline-message">
          <h2>Access Denied</h2>
          <p>You must be 18 years or older to access this site.</p>
          <p>If you believe you received this message in error, please contact us.</p>
          <button id="age-gate-decline-close" class="age-gate-btn age-gate-btn-confirm">
            Close Window
          </button>
        </div>
      `;

      const closeBtn = document.getElementById('age-gate-decline-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          // Redirect or close (browsers may not allow close)
          window.location.href = 'about:blank';
        });
      }
    }
  }

  hideModal() {
    const backdrop = document.getElementById('age-gate-backdrop');
    if (backdrop) {
      backdrop.style.display = 'none';
      backdrop.setAttribute('aria-hidden', 'true');
    }
  }

  isModalVisible() {
    const backdrop = document.getElementById('age-gate-backdrop');
    return backdrop && backdrop.style.display !== 'none';
  }
}

// Initialize age gate when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AgeGate();
  });
} else {
  new AgeGate();
}
