<?php
/**
 * Template: Services
 */
get_header();
?>
<main>
  <h1 class="page-title">Our Services</h1>
  <div class="services-grid">
    <div class="service-card">
      <h2><i class="fas fa-wrench"></i> Gunsmithing &amp; Basic Services</h2>
      <p>Cleaning (field strip &amp; deep clean), inspection and function checks, optics mounting and bore sight, and simple sight installation. We keep your firearms in top condition and are working toward full gunsmith certification to expand what we can do.</p>
      <a href="<?php echo esc_url(home_url('/gunsmithing')); ?>" class="service-cta">See pricing &amp; details</a>
    </div>
    <div class="service-card">
      <h2><i class="fas fa-file-alt"></i> FFL Transfers</h2>
      <p>We are a licensed FFL and offer professional transfer services for firearms purchased online or from out-of-state sellers. We handle the compliance paperwork so your firearms are transferred legally and safely.</p>
      <a href="<?php echo esc_url(home_url('/ffl-transfers')); ?>" class="service-cta">Transfer info &amp; fees</a>
    </div>
  </div>
  <div class="services-contact">
    <p>For scheduling or other questions, <a href="<?php echo esc_url(home_url('/contact')); ?>">contact us</a>.</p>
  </div>
</main>
<style>
.services-grid{display:grid;grid-template-columns:1fr 1fr;gap:2rem;max-width:900px;margin:0 auto 2rem;}
.service-card{background:#fafafa;border-left:4px solid var(--color-primary);padding:2rem;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.05);}
.service-card h2{font-size:1.35rem;margin-bottom:1rem;}
.service-card i{margin-right:.5rem;color:var(--color-primary);}
.service-card p{color:#666;line-height:1.6;margin-bottom:1.5rem;}
.service-cta{display:inline-block;background:var(--color-primary);color:#fff;padding:.6rem 1.2rem;border-radius:4px;text-decoration:none;font-weight:600;}
.service-cta:hover{background:#8b1a1a;color:#fff;}
.services-contact{text-align:center;padding-top:2rem;border-top:1px solid #e0e0e0;}
@media(max-width:768px){.services-grid{grid-template-columns:1fr;}}
</style>
<?php get_footer(); ?>
