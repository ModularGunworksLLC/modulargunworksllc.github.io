<?php
/**
 * Template: Contact Us
 */
get_header();
?>
<main>
  <h1 class="page-title">Contact Us</h1>
  <div class="contact-wrapper">
    <div class="contact-info">
      <h2>Get in Touch</h2>
      <p>We're here to help. Reach out by phone, email, or visit us in Huntsville.</p>
      <div class="info-item">
        <span class="info-icon"><i class="fas fa-phone"></i></span>
        <div class="info-content">
          <h3>Phone</h3>
          <p><a href="tel:+12563843852">(256) 384-3852</a></p>
        </div>
      </div>
      <div class="info-item">
        <span class="info-icon"><i class="fas fa-envelope"></i></span>
        <div class="info-content">
          <h3>Email</h3>
          <p><a href="mailto:info@modulargunworks.com">Info@modulargunworks.com</a></p>
        </div>
      </div>
      <div class="info-item">
        <span class="info-icon"><i class="fas fa-map-marker-alt"></i></span>
        <div class="info-content">
          <h3>Location</h3>
          <p>Huntsville, AL</p>
          <p><strong>Hours:</strong> M-F 9AM-6PM, Sat 10AM-4PM CT</p>
        </div>
      </div>
    </div>
    <div class="contact-form-section">
      <h2>Send a Message</h2>
      <?php if (shortcode_exists('contact-form-7')) : ?>
        <?php echo do_shortcode('[contact-form-7 title="Contact"]'); ?>
      <?php else : ?>
      <form class="contact-form" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" method="post">
        <input type="hidden" name="action" value="modulargunworks_contact">
        <?php wp_nonce_field('modulargunworks_contact', 'contact_nonce'); ?>
        <div class="form-group">
          <label for="contact-name">Name *</label>
          <input type="text" id="contact-name" name="contact_name" required>
        </div>
        <div class="form-group">
          <label for="contact-email">Email *</label>
          <input type="email" id="contact-email" name="contact_email" required>
        </div>
        <div class="form-group">
          <label for="contact-message">Message *</label>
          <textarea id="contact-message" name="contact_message" rows="5" required></textarea>
        </div>
        <button type="submit" class="form-btn">Send Message</button>
      </form>
      <p style="margin-top:1rem;font-size:0.9rem;color:#666;">Or email us directly at <a href="mailto:info@modulargunworks.com">Info@modulargunworks.com</a></p>
      <?php endif; ?>
    </div>
  </div>
  <?php if (isset($_GET['contact_sent']) && $_GET['contact_sent'] === '1') : ?>
  <p class="contact-success" style="max-width:600px;margin:1rem auto;padding:1rem;background:#d4edda;border:1px solid #c3e6cb;border-radius:8px;color:#155724;">Thank you! Your message has been sent. We will get back to you soon.</p>
  <?php endif; ?>
</main>
<style>
.contact-wrapper{display:grid;grid-template-columns:1fr 1fr;gap:3rem;max-width:1000px;margin:0 auto;}
.contact-info h2,.contact-form-section h2{font-size:1.5rem;margin-bottom:1rem;color:var(--color-bg-dark);}
.info-item{display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.5rem;}
.info-icon{font-size:1.25rem;color:var(--color-primary);width:28px;}
.info-content a{color:var(--color-primary);}
.contact-form{background:#f9f9f9;padding:1.5rem;border-radius:8px;border:1px solid #e0e0e0;}
.form-group{margin-bottom:1rem;}
.form-group label{display:block;margin-bottom:0.4rem;font-weight:600;}
.form-group input,.form-group textarea{width:100%;padding:0.6rem;border:1px solid #ddd;border-radius:4px;}
.form-btn{background:var(--color-primary);color:#fff;padding:0.75rem 1.5rem;border:none;border-radius:4px;cursor:pointer;font-weight:600;width:100%;}
.form-btn:hover{background:#8b1a1a;}
@media(max-width:768px){.contact-wrapper{grid-template-columns:1fr;}}
</style>
<?php get_footer(); ?>
