<?php
/**
 * Template: FFL Transfers
 */
get_header();
?>
<main>
  <div class="page-hero">
    <div class="icon"><i class="fas fa-file-alt"></i></div>
    <h1>FFL Transfers</h1>
    <p>Modular Gunworks LLC is a licensed Federal Firearms Licensee (FFL) in Huntsville, Alabama. We offer professional FFL transfer services for firearms purchased online or from out-of-state sellers.</p>
    <span class="badge"><i class="fas fa-check-circle"></i> Now available</span>
  </div>

  <div class="section pricing-box">
    <h2><i class="fas fa-tag"></i> Transfer fees</h2>
    <p class="price-line">$20 — first firearm</p>
    <p class="price-line">$10 — each additional firearm (when multiple guns are transferred at the same time)</p>
    <p class="price-note">The $10 rate applies only when you are having more than one firearm transferred in the same transaction.</p>
  </div>

  <div class="section">
    <h2>How it works</h2>
    <ul>
      <li>Have your firearm shipped to Modular Gunworks LLC (use our address as the FFL ship-to when ordering).</li>
      <li>We will contact you when your firearm arrives.</li>
      <li>Come to our Huntsville location with a valid ID to complete the transfer and required background check.</li>
      <li>Pay the transfer fee at pickup.</li>
    </ul>
  </div>

  <div class="section">
    <h2>What you need</h2>
    <p>Valid government-issued photo ID. You must be legally eligible to possess firearms. Alabama residents: we can complete the transfer at our location. Out-of-state buyers: firearms must ship to an FFL in your state of residence.</p>
  </div>

  <p><a href="<?php echo esc_url(home_url('/contact')); ?>" class="cta-link">Contact us for scheduling</a></p>
</main>
<style>
.page-hero{background:linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%);border-radius:16px;padding:2rem;margin-bottom:2rem;text-align:center;}
.page-hero .icon{font-size:2.5rem;color:var(--color-accent);}.page-hero h1{margin-bottom:.5rem;}
.badge{display:inline-flex;align-items:center;gap:.5rem;background:#2e7d32;color:#fff;padding:.5rem 1rem;border-radius:8px;font-weight:600;font-size:.85rem;}
.pricing-box{background:#f8f9fa;border:2px solid var(--color-primary);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;}
.price-line{font-size:1.1rem;font-weight:700;margin:.5rem 0;}
.section{margin-bottom:1.5rem;}.section h2{font-size:1.2rem;margin-bottom:.5rem;}
.section ul{padding-left:1.5rem;}.section li{margin:.5rem 0;}
.cta-link{display:inline-block;background:var(--color-primary);color:#fff;padding:.75rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:600;}
.cta-link:hover{background:#8b1a1a;color:#fff;}
</style>
<?php get_footer(); ?>
