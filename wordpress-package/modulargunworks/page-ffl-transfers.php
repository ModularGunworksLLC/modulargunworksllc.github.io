<?php
/**
 * Template: FFL Transfers
 */
get_header();
$ffl_pdf = function_exists( 'modulargunworks_get_ffl_pdf_url' ) ? modulargunworks_get_ffl_pdf_url() : '';
?>
<main>
  <div class="page-hero">
    <div class="icon"><i class="fas fa-file-alt"></i></div>
    <h1><?php esc_html_e( 'FFL Transfers', 'modulargunworks' ); ?></h1>
    <p><?php esc_html_e( 'Modular Gunworks LLC is a licensed Federal Firearms Licensee (FFL) in Huntsville, Alabama—your receiving dealer for compliant online orders and out-of-state shipments.', 'modulargunworks' ); ?></p>
    <span class="badge"><i class="fas fa-check-circle"></i> <?php esc_html_e( 'Now accepting transfers', 'modulargunworks' ); ?></span>
  </div>

  <?php if ( function_exists( 'modulargunworks_get_address_display' ) ) : ?>
  <div class="section ffl-nap-box">
    <h2><i class="fas fa-map-pin"></i> <?php esc_html_e( 'Ship firearms here', 'modulargunworks' ); ?></h2>
    <p class="ffl-nap-lines"><?php echo esc_html( modulargunworks_get_address_display() ); ?></p>
    <p class="ffl-nap-meta"><?php esc_html_e( 'Phone:', 'modulargunworks' ); ?> <a href="tel:+12563843852">(256) 384-3852</a> · <?php esc_html_e( 'Hours: M-F 9–6, Sat 10–4 CT', 'modulargunworks' ); ?></p>
    <p class="ffl-nap-help"><?php esc_html_e( 'Confirm the legal business name on your retailer’s FFL selector matches our license. Upload our license file below for their records.', 'modulargunworks' ); ?></p>
  </div>
  <?php endif; ?>

  <?php if ( $ffl_pdf !== '' ) : ?>
  <p>
    <a class="cta-link" href="<?php echo esc_url( $ffl_pdf ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Download our FFL license (PDF)', 'modulargunworks' ); ?></a>
  </p>
  <?php elseif ( current_user_can( 'manage_options' ) ) : ?>
  <p class="ffl-pdf-placeholder"><?php esc_html_e( 'Admin: Appearance → Customize → Modular Gunworks — Local SEO → FFL license PDF URL to show a public download button.', 'modulargunworks' ); ?></p>
  <?php endif; ?>

  <div class="section pricing-box">
    <h2><i class="fas fa-tag"></i> <?php esc_html_e( 'Transfer fees', 'modulargunworks' ); ?></h2>
    <p class="price-line">$20 — <?php esc_html_e( 'first firearm', 'modulargunworks' ); ?></p>
    <p class="price-line">$10 — <?php esc_html_e( 'each additional firearm (same transaction)', 'modulargunworks' ); ?></p>
    <p class="price-note"><?php esc_html_e( 'The $10 rate applies only when multiple firearms are transferred together.', 'modulargunworks' ); ?></p>
  </div>

  <div class="section">
    <h2><?php esc_html_e( 'How it works', 'modulargunworks' ); ?></h2>
    <ul>
      <li><?php esc_html_e( 'Use our FFL information when you checkout with your online seller so the package routes to Modular Gunworks LLC.', 'modulargunworks' ); ?></li>
      <li><?php esc_html_e( 'We inspect the shipment, log it, and notify you when it is ready for pickup.', 'modulargunworks' ); ?></li>
      <li><?php esc_html_e( 'Bring valid government-issued ID; complete the Form 4473 and background check required by law.', 'modulargunworks' ); ?></li>
      <li><?php esc_html_e( 'Pay the transfer fee at pickup before we release the firearm.', 'modulargunworks' ); ?></li>
    </ul>
  </div>

  <div class="section">
    <h2><?php esc_html_e( 'Common questions', 'modulargunworks' ); ?></h2>
    <div class="ffl-faq">
      <div class="ffl-faq-item">
        <h3><?php esc_html_e( 'How do I list Modular Gunworks as my receiving FFL?', 'modulargunworks' ); ?></h3>
        <p><?php esc_html_e( 'During online checkout choose “FFL transfer,” search for Modular Gunworks LLC, and upload our license if the seller requests it. When in doubt, email us the order confirmation so we can watch for the tracking number.', 'modulargunworks' ); ?></p>
      </div>
      <div class="ffl-faq-item">
        <h3><?php esc_html_e( 'How long do transfers take in Huntsville?', 'modulargunworks' ); ?></h3>
        <p><?php esc_html_e( 'Carrier transit times vary. After we log your firearm we contact you the same business day whenever possible to schedule pickup and complete NICS requirements.', 'modulargunworks' ); ?></p>
      </div>
      <div class="ffl-faq-item">
        <h3><?php esc_html_e( 'What if my background check is delayed or denied?', 'modulargunworks' ); ?></h3>
        <p><?php esc_html_e( 'We follow every federal and Alabama procedure. If a transfer cannot be completed, storage and return-shipping rules in our Terms & Returns may apply—especially for shipments we forwarded to another FFL on your behalf.', 'modulargunworks' ); ?></p>
      </div>
      <div class="ffl-faq-item">
        <h3><?php esc_html_e( 'Can I transfer multiple firearms at once?', 'modulargunworks' ); ?></h3>
        <p><?php esc_html_e( 'Yes. Additional guns within the same coordinated transaction qualify for the discounted add-on fee posted above.', 'modulargunworks' ); ?></p>
      </div>
    </div>
  </div>

  <div class="section">
    <h2><?php esc_html_e( 'What you need', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'Valid government-issued photo ID and legal eligibility to possess firearms. Alabama residents may complete transfers at our location. Out-of-state buyers must coordinate shipment to an FFL in their state of residence—we cannot transfer across state lines except as federal law allows.', 'modulargunworks' ); ?></p>
  </div>

  <p><button type="button" class="cta-link js-open-service-modal"><?php esc_html_e( 'Request FFL transfer', 'modulargunworks' ); ?></button></p>

  <div class="service-modal-backdrop" id="service-request-modal" aria-hidden="true">
    <div class="service-modal" role="dialog" aria-modal="true" aria-labelledby="service-request-title">
      <button type="button" class="service-modal-close js-close-service-modal" aria-label="<?php esc_attr_e( 'Close request form', 'modulargunworks' ); ?>">×</button>
      <h2 id="service-request-title"><?php esc_html_e( 'Request Service', 'modulargunworks' ); ?></h2>
      <p class="service-modal-help"><?php esc_html_e( 'Tell us what you ordered and we will confirm next steps.', 'modulargunworks' ); ?></p>
      <div class="service-modal-form">
        <?php if ( shortcode_exists( 'contact-form-7' ) ) : ?>
          <?php echo do_shortcode( '[contact-form-7 title="Service Request"]' ); ?>
        <?php elseif ( shortcode_exists( 'wpforms' ) ) : ?>
          <?php echo do_shortcode( '[wpforms id="2"]' ); ?>
        <?php elseif ( shortcode_exists( 'fluentform' ) ) : ?>
          <?php echo do_shortcode( '[fluentform id="2"]' ); ?>
        <?php else : ?>
          <p class="request-service-note"><?php esc_html_e( 'Install a forms plugin and map the Service Request shortcode.', 'modulargunworks' ); ?></p>
        <?php endif; ?>
      </div>
      <div class="service-modal-success" hidden>
        <p><strong><?php esc_html_e( 'Thank you for your message. It has been sent.', 'modulargunworks' ); ?></strong></p>
        <button type="button" class="cta-link js-close-service-modal"><?php esc_html_e( 'Close', 'modulargunworks' ); ?></button>
      </div>
    </div>
  </div>
</main>
<style>
.page-hero{background:linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%);border-radius:16px;padding:2rem;margin-bottom:2rem;text-align:center;}
.page-hero .icon{font-size:2.5rem;color:var(--color-accent);}.page-hero h1{margin-bottom:.5rem;}
.badge{display:inline-flex;align-items:center;gap:.5rem;background:#2e7d32;color:#fff;padding:.5rem 1rem;border-radius:8px;font-weight:600;font-size:.85rem;}
.pricing-box{background:#f8f9fa;border:2px solid var(--color-primary);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;}
.price-line{font-size:1.1rem;font-weight:700;margin:.5rem 0;}
.section{margin-bottom:1.5rem;}.section h2{font-size:1.2rem;margin-bottom:.5rem;}
.section ul{padding-left:1.5rem;}.section li{margin:.5rem 0;}
.cta-link{display:inline-block;background:var(--color-primary);color:#fff;padding:.75rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:600;border:0;cursor:pointer;min-height:44px;}
.cta-link:hover{background:#8b1a1a;color:#fff;}
.ffl-nap-box{background:#fff;border:1px solid #ddd;border-radius:12px;padding:1.25rem 1.5rem;}
.ffl-nap-lines{white-space:pre-line;font-weight:600;margin:.5rem 0;}
.ffl-nap-meta,.ffl-nap-help{color:#555;line-height:1.5;}
.ffl-pdf-placeholder{font-size:.9rem;color:#666;background:#f9f9f9;border:1px dashed #ccc;padding:1rem;border-radius:8px;}
.ffl-faq{display:grid;gap:1rem;}
.ffl-faq-item{background:#fafafa;border-left:4px solid var(--color-primary);padding:1rem 1.25rem;border-radius:8px;}
.ffl-faq-item h3{font-size:1.05rem;margin:0 0 .5rem;}
.ffl-faq-item p{margin:0;color:#555;line-height:1.55;}
.request-service-note{background:#f9f9f9;padding:1rem;border:1px solid #ddd;border-radius:8px;color:#444;}
.service-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);display:none;align-items:center;justify-content:center;padding:1rem;z-index:9999;}
.service-modal-backdrop.is-open{display:flex;}
.service-modal{background:#fff;border-radius:12px;max-width:640px;width:100%;max-height:90vh;overflow:auto;padding:1.25rem 1.25rem 1.5rem;position:relative;}
.service-modal-close{position:absolute;right:.75rem;top:.5rem;background:transparent;border:0;font-size:1.8rem;line-height:1;cursor:pointer;color:#555;min-width:44px;min-height:44px;}
.service-modal-help{color:#555;margin-top:.25rem;}
.service-modal-success{border:1px solid #d9ead3;background:#f5fff2;padding:1rem;border-radius:8px;margin-top:1rem;}
.service-modal-form input,.service-modal-form textarea{font-size:16px;}
</style>
<script>
(function () {
  const modal = document.getElementById('service-request-modal')
  if (!modal) return
  const openBtn = document.querySelector('.js-open-service-modal')
  const closeBtns = modal.querySelectorAll('.js-close-service-modal')
  const formWrap = modal.querySelector('.service-modal-form')
  const success = modal.querySelector('.service-modal-success')

  function openModal() {
    modal.classList.add('is-open')
    modal.setAttribute('aria-hidden', 'false')
    document.body.style.overflow = 'hidden'
  }
  function closeModal() {
    modal.classList.remove('is-open')
    modal.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = ''
  }
  if (openBtn) openBtn.addEventListener('click', openModal)
  closeBtns.forEach((b) => b.addEventListener('click', closeModal))
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal()
  })

  document.addEventListener('wpcf7mailsent', () => {
    if (formWrap) formWrap.hidden = true
    if (success) success.hidden = false
  })
  document.addEventListener('wpcf7submit', (e) => {
    if (!e.detail || !e.detail.status || e.detail.status === 'mail_sent') return
    if (formWrap) formWrap.hidden = false
    if (success) success.hidden = true
  })
})()
</script>
<?php get_footer(); ?>
