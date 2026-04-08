<?php
/**
 * Template: Order Status - redirects to My Account for logged-in users
 */
if (is_user_logged_in() && function_exists('wc_get_page_permalink')) {
  wp_safe_redirect(wc_get_page_permalink('myaccount'));
  exit;
}
get_header();
?>
<main>
  <h1 class="page-title">Order Status</h1>
  <div class="info-box">
    <p>Track your orders and view order history in your account.</p>
    <p><a href="<?php echo esc_url(function_exists('wc_get_page_permalink') ? wc_get_page_permalink('myaccount') : home_url('/my-account')); ?>" class="service-cta">Log in to My Account</a></p>
    <p style="margin-top:1rem;color:#666;">Don't have an account? You can create one during checkout. For guest order lookup, please <a href="<?php echo esc_url(home_url('/contact')); ?>">contact us</a> with your order number and email.</p>
  </div>
</main>
<style>.info-box{max-width:600px;margin:0 auto;background:#f9f9f9;padding:2rem;border-radius:8px;border:1px solid #e0e0e0;}.service-cta{display:inline-block;background:var(--color-primary);color:#fff;padding:.6rem 1.2rem;border-radius:4px;text-decoration:none;font-weight:600;}.service-cta:hover{background:#8b1a1a;color:#fff;}</style>
<?php get_footer(); ?>
