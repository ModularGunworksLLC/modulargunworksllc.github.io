<?php
/**
 * Template: Help
 */
get_header();
?>
<main>
  <h1 class="page-title">Help</h1>
  <p class="page-intro">Find answers, track your order, or get in touch. Choose a topic below.</p>
  <div class="help-grid">
    <div class="help-card">
      <a href="<?php echo esc_url(home_url('/faq')); ?>"><i class="fas fa-question-circle"></i> FAQ</a>
      <p>Common questions about orders, shipping, returns, and more.</p>
    </div>
    <div class="help-card">
      <a href="<?php echo esc_url(home_url('/contact')); ?>"><i class="fas fa-envelope"></i> Contact Us</a>
      <p>Phone, email, or message. We're here to help.</p>
    </div>
    <div class="help-card">
      <a href="<?php echo esc_url(home_url('/my-account')); ?>"><i class="fas fa-truck"></i> Order Status</a>
      <p>Log in to view your orders and track shipments.</p>
    </div>
    <div class="help-card">
      <a href="<?php echo esc_url(home_url('/returns')); ?>"><i class="fas fa-undo"></i> Returns</a>
      <p>Our return policy and how to start a return.</p>
    </div>
  </div>
</main>
<style>
.page-intro{color:#666;line-height:1.6;margin-bottom:2rem;}
.help-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.25rem;}
.help-card{background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:1.25rem;transition:box-shadow .2s;}
.help-card:hover{box-shadow:0 4px 12px rgba(0,0,0,.08);}
.help-card a{display:flex;align-items:center;gap:.75rem;color:var(--color-bg-dark);text-decoration:none;font-weight:600;}
.help-card a:hover{color:var(--color-primary);}
.help-card i{font-size:1.5rem;color:var(--color-primary);width:2rem;text-align:center;}
.help-card p{margin:.5rem 0 0 2.25rem;font-size:.9rem;color:#666;line-height:1.4;}
</style>
<?php get_footer(); ?>
