/**
 * Cart Age Gate - Checkout verification for ammunition/firearms (like old site)
 * Blocks "Proceed to Checkout" until user confirms age and acknowledgments.
 * Uses event delegation and listens for WooCommerce fragment refresh to stay active after AJAX updates.
 */
(function ($) {
  'use strict';

  var SESSION_KEY = 'mgw_age_verified_at_checkout';
  var CHECKOUT_SELECTORS = 'a.checkout-button, .wc-proceed-to-checkout a, .cart_totals a[href*="checkout"], a[href*="checkout"].button, .woocommerce-cart a.button[href*="checkout"]';

  function allChecked() {
    if (typeof mgwCartAgeGate === 'undefined') return false;
    var hasFirearms = mgwCartAgeGate.hasFirearms;
    var ageOk = !!$('#mgw-age-confirm').prop('checked');
    var stateOk = !!$('#mgw-state-ack').prop('checked');
    var fflOk = !hasFirearms || !!$('#mgw-ffl-ack').prop('checked');
    var rulesOk = !hasFirearms || !!$('#mgw-rules-ack').prop('checked');
    return ageOk && stateOk && fflOk && rulesOk;
  }

  function captureBlocker(e) {
    if (typeof mgwCartAgeGate === 'undefined') return;
    if (!mgwCartAgeGate.needsVerification || sessionStorage.getItem(SESSION_KEY)) return;
    var el = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
    while (el && el !== document.body) {
      var isCheckout = (el.tagName === 'A' && (el.classList.contains('checkout-button') || (el.getAttribute('href') && el.getAttribute('href').indexOf('checkout') !== -1)))
        || (el.classList && el.classList.contains('wc-proceed-to-checkout'));
      if (isCheckout) {
        if (!allChecked()) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          var $hint = $('#mgw-age-hint');
          if ($hint.length) $hint.text(mgwCartAgeGate.hasFirearms ? 'Please check all 4 boxes.' : 'Please check both boxes.');
        }
        return;
      }
      el = el.parentElement;
    }
  }

  function init() {
    if (typeof mgwCartAgeGate === 'undefined') return;

    var needsVerification = mgwCartAgeGate.needsVerification;
    var hasFirearms = mgwCartAgeGate.hasFirearms;

    if (!needsVerification) return;

    var $proceedBtn = $(CHECKOUT_SELECTORS);
    if (!$proceedBtn.length) return;

    // Check session - if already verified this session, leave button enabled
    if (sessionStorage.getItem(SESSION_KEY)) {
      return;
    }

    function enableCheckout() {
      $proceedBtn.css({ pointerEvents: '', opacity: '1' }).removeClass('mgw-checkout-disabled');
      sessionStorage.setItem(SESSION_KEY, Date.now().toString());
    }

    function disableCheckout() {
      $proceedBtn.css({ pointerEvents: 'none', opacity: '0.5' }).addClass('mgw-checkout-disabled');
    }

    function checkAll() {
      if (allChecked()) {
        enableCheckout();
        $('#mgw-age-hint').text('');
      }
    }

    function blockClick(e) {
      if (!allChecked() && !sessionStorage.getItem(SESSION_KEY)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var $hint = $('#mgw-age-hint');
        if ($hint.length) $hint.text(hasFirearms ? 'Please check all 4 boxes.' : 'Please check both boxes.');
        return false;
      }
    }

    disableCheckout();

    // Event delegation for checkboxes (works after AJAX replacement)
    $(document).off('change.mgwAgeGate', '.mgw-age-checkbox');
    $(document).on('change.mgwAgeGate', '.mgw-age-checkbox', checkAll);

    // Click blocker - jQuery delegation
    $(document).off('click.mgwAgeGate', CHECKOUT_SELECTORS);
    $(document).on('click.mgwAgeGate', CHECKOUT_SELECTORS, blockClick);

    // Capture-phase blocker: runs first so no other handler can navigate (added once only)
    if (!document._mgwCaptureBlockerAdded) {
      document._mgwCaptureBlockerAdded = true;
      document.addEventListener('click', captureBlocker, true);
    }
  }

  function run() {
    if (document.readyState === 'loading') {
      $(document).ready(init);
    } else {
      init();
    }
  }

  run();

  // Re-initialize when WooCommerce refreshes cart fragments
  $(document.body).on('updated_wc_div updated_cart_totals', init);
})(jQuery);
