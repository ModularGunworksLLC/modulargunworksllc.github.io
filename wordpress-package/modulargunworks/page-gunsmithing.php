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
      <thead><tr><th>Service</th><th>Price</th></tr></thead>
      <tbody>
        <tr><td>Field strip &amp; clean</td><td class="price">$30</td></tr>
        <tr><td>Deep clean</td><td class="price">$80</td></tr>
        <tr><td>Basic inspection / function check</td><td class="price">$25</td></tr>
        <tr><td>Optics mounting &amp; bore sight</td><td class="price">$50</td></tr>
        <tr><td>Simple sight installation</td><td class="price">$40</td></tr>
      </tbody>
    </table>
  </div>

  <p><a href="<?php echo esc_url(home_url('/contact')); ?>" class="cta-link">Schedule an appointment</a></p>

  <div class="section request-service-section">
    <h2>Request Service</h2>
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
</main>
<style>
.page-hero{background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);border-radius:16px;padding:2rem;margin-bottom:2rem;text-align:center;}
.page-hero .note{font-size:.9rem;color:#666;margin-top:1rem;}
.badge{display:inline-flex;align-items:center;gap:.5rem;background:#2e7d32;color:#fff;padding:.5rem 1rem;border-radius:8px;font-weight:600;}
.price-table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:1.5rem;}
.price-table th,.price-table td{padding:.75rem 1rem;text-align:left;border-bottom:1px solid #e0e0e0;}
.price-table th{background:#f5f5f5;font-weight:600;}
.price-table .price{font-weight:700;color:var(--color-primary);}
.cta-link{display:inline-block;background:var(--color-primary);color:#fff;padding:.75rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:600;}
.cta-link:hover{background:#8b1a1a;color:#fff;}
.request-service-note{background:#f9f9f9;padding:1rem;border:1px solid #ddd;border-radius:8px;color:#444;}
</style>
<?php get_footer(); ?>
