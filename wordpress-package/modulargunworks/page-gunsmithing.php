<?php
/**
 * Template: Gunsmithing
 */
get_header();
?>
<main>
  <div class="page-hero">
    <div class="icon"><i class="fas fa-wrench"></i></div>
    <h1>Basic Firearm Services</h1>
    <p>We offer basic firearm services at competitive prices—cleaning, inspection, optics mounting, and simple sight installation. We're working toward full gunsmith certification to expand our services.</p>
    <p class="note">All work is performed at our Huntsville location. Call or email to schedule.</p>
    <span class="badge"><i class="fas fa-check-circle"></i> Available now</span>
  </div>

  <div class="section">
    <h2>Service pricing</h2>
    <table class="price-table">
      <thead><tr><th>Service</th><th>Description</th><th>Price</th></tr></thead>
      <tbody>
        <tr>
          <td>Field strip &amp; clean</td>
          <td>Basic disassembly, carbon removal, and lubrication for routine maintenance after range use.</td>
          <td class="price">$30</td>
        </tr>
        <tr>
          <td>Deep clean</td>
          <td>Full detail strip and ultrasonic cleaning of all components to remove heavy buildup and long-term fouling.</td>
          <td class="price">$80</td>
        </tr>
        <tr>
          <td>Basic inspection / function check</td>
          <td>Mechanical safety and reliability assessment, including trigger, safety, and cycle testing.</td>
          <td class="price">$25</td>
        </tr>
        <tr>
          <td>Optics mounting &amp; bore sight</td>
          <td>Secure installation of optics using proper torque specs, followed by a mechanical bore sight to get you on paper.</td>
          <td class="price">$50</td>
        </tr>
        <tr>
          <td>Simple sight installation</td>
          <td>Professional installation of drop-in aftermarket iron sights using specialized tools to protect your firearm's finish.</td>
          <td class="price">$40</td>
        </tr>
      </tbody>
    </table>
  </div>

  <p><button type="button" class="cta-link js-open-service-modal">Request service</button></p>

  <div class="service-modal-backdrop" id="service-request-modal" aria-hidden="true">
    <div class="service-modal" role="dialog" aria-modal="true" aria-labelledby="service-request-title">
      <button type="button" class="service-modal-close js-close-service-modal" aria-label="Close request form">×</button>
      <h2 id="service-request-title">Request Service</h2>
      <p class="service-modal-help">Fill out this quick form and we will follow up to confirm scheduling.</p>
      <div class="service-modal-form">
        <?php if (shortcode_exists('contact-form-7')) : ?>
          <?php echo do_shortcode('[contact-form-7 title="Service Request"]'); ?>
        <?php elseif (shortcode_exists('wpforms')) : ?>
          <?php echo do_shortcode('[wpforms id="2"]'); ?>
        <?php elseif (shortcode_exists('fluentform')) : ?>
          <?php echo do_shortcode('[fluentform id="2"]'); ?>
        <?php else : ?>
          <p class="request-service-note">Install a free form plugin and add a Service Request form shortcode here.</p>
        <?php endif; ?>
      </div>
      <div class="service-modal-success" hidden>
        <p><strong>Thank you for your message. It has been sent.</strong></p>
        <button type="button" class="cta-link js-close-service-modal">Close and return to site</button>
      </div>
    </div>
  </div>
</main>
<style>
.page-hero{background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);border-radius:16px;padding:2rem;margin-bottom:2rem;text-align:center;}
.page-hero .note{font-size:.9rem;color:#666;margin-top:1rem;}
.badge{display:inline-flex;align-items:center;gap:.5rem;background:#2e7d32;color:#fff;padding:.5rem 1rem;border-radius:8px;font-weight:600;}
.price-table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:1.5rem;}
.price-table th,.price-table td{padding:.75rem 1rem;text-align:left;border-bottom:1px solid #e0e0e0;}
.price-table th{background:#f5f5f5;font-weight:600;}
.price-table .price{font-weight:700;color:var(--color-primary);}
.cta-link{display:inline-block;background:var(--color-primary);color:#fff;padding:.75rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:600;border:0;cursor:pointer;}
.cta-link:hover{background:#8b1a1a;color:#fff;}
.request-service-note{background:#f9f9f9;padding:1rem;border:1px solid #ddd;border-radius:8px;color:#444;}
.service-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);display:none;align-items:center;justify-content:center;padding:1rem;z-index:9999;}
.service-modal-backdrop.is-open{display:flex;}
.service-modal{background:#fff;border-radius:12px;max-width:640px;width:100%;max-height:90vh;overflow:auto;padding:1.25rem 1.25rem 1.5rem;position:relative;}
.service-modal-close{position:absolute;right:.75rem;top:.5rem;background:transparent;border:0;font-size:1.8rem;line-height:1;cursor:pointer;color:#555;}
.service-modal-help{color:#555;margin-top:.25rem;}
.service-modal-success{border:1px solid #d9ead3;background:#f5fff2;padding:1rem;border-radius:8px;margin-top:1rem;}
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
