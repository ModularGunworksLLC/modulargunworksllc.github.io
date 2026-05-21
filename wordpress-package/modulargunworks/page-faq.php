<?php
/**
 * Template: FAQ
 */
get_header();
?>
<main class="faq-page">
  <h1 class="page-title">Frequently Asked Questions</h1>
  <p class="page-intro">Find answers to common questions about our services, products, and policies.</p>

  <div class="faq-category">
    <h2 class="faq-category-title">Services</h2>
    <div class="faq-item">
      <button class="faq-question"><span>Are gunsmithing and FFL transfers available?</span><i class="fas fa-chevron-down"></i></button>
      <div class="faq-answer"><p>Yes. We are a licensed FFL and offer gunsmithing, FFL transfers, and related services. See our <a href="<?php echo esc_url(home_url('/services')); ?>">Services</a>, <a href="<?php echo esc_url(home_url('/ffl-transfers')); ?>">FFL Transfers</a>, and <a href="<?php echo esc_url(home_url('/gunsmithing')); ?>">Gunsmithing</a> pages for details, or <a href="<?php echo esc_url(home_url('/contact')); ?>">contact us</a>.</p></div>
    </div>
  </div>

  <div class="faq-category">
    <h2 class="faq-category-title">Shipping & Returns</h2>
    <div class="faq-item">
      <button class="faq-question"><span>Do you ship nationwide?</span><i class="fas fa-chevron-down"></i></button>
      <div class="faq-answer"><p>Yes, we ship to most states. Firearms, ammunition, and certain items are subject to state and local restrictions. We comply with all applicable laws.</p></div>
    </div>
    <div class="faq-item">
      <button class="faq-question"><span>What is your return policy?</span><i class="fas fa-chevron-down"></i></button>
      <div class="faq-answer"><p>Firearms and ammunition sales are final once a lawful transfer occurs or the ammunition ships, per our <a href="<?php echo esc_url(home_url('/returns')); ?>">Returns</a> page. Some accessories may qualify for return within thirty days with authorization.</p></div>
    </div>
    <div class="faq-item">
      <button class="faq-question"><span>What are your shipping costs?</span><i class="fas fa-chevron-down"></i></button>
      <div class="faq-answer"><p>Shipping costs depend on your order, destination, and carrier rates. Totals are shown in your cart and at checkout before you pay.</p></div>
    </div>
    <div class="faq-item">
      <button class="faq-question"><span>Can prices or availability change after I order?</span><i class="fas fa-chevron-down"></i></button>
      <div class="faq-answer"><p>Pricing and inventory sync from large distributor feeds; errors can occur. We reserve the right to cancel orders caused by mispricing or technical glitches—see our <a href="<?php echo esc_url(home_url('/terms')); ?>">Terms</a>.</p></div>
    </div>
  </div>

  <div class="faq-category">
    <h2 class="faq-category-title">Orders & Payment</h2>
    <div class="faq-item">
      <button class="faq-question"><span>What payment methods do you accept?</span><i class="fas fa-chevron-down"></i></button>
      <div class="faq-answer"><p>We accept major credit cards and other payment options shown at checkout. All transactions are secure.</p></div>
    </div>
  </div>
</main>
<style>
.faq-page .page-intro{margin-bottom:2rem;color:#666;}
.faq-category{margin-bottom:2rem;}.faq-category-title{font-size:1.25rem;margin-bottom:1rem;}
.faq-item{background:#fff;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:.75rem;overflow:hidden;}
.faq-question{width:100%;padding:1rem 1.25rem;background:#f9f9f9;border:none;cursor:pointer;font-weight:600;text-align:left;display:flex;justify-content:space-between;align-items:center;}
.faq-question:hover{background:#f0f0f0;}
.faq-question i{transition:transform .3s;}
.faq-item.active .faq-question i{transform:rotate(180deg);}
.faq-answer{display:none;padding:1rem 1.25rem;color:#666;line-height:1.6;border-top:1px solid #e0e0e0;}
.faq-item.active .faq-answer{display:block;}
</style>
<script>
document.querySelectorAll('.faq-question').forEach(function(btn){
  btn.addEventListener('click',function(){ this.closest('.faq-item').classList.toggle('active'); });
});
</script>
<?php get_footer(); ?>
