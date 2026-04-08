<?php
/**
 * Template: State Restrictions
 */
get_header();
?>
<main>
  <h1 class="page-title">State Restrictions</h1>
  <div class="content-section">
    <p>Firearms, ammunition, and certain accessories are subject to federal, state, and local laws. We cannot ship to states or jurisdictions where such items are prohibited.</p>
    <h2>Compliance</h2>
    <p>We comply with all applicable federal and state regulations. During checkout, we will inform you of any restrictions for your area. Some states require additional documentation or have quantity limits.</p>
    <h2>Questions</h2>
    <p>If you're unsure about restrictions in your state, <a href="<?php echo esc_url(home_url('/contact')); ?>">contact us</a> before ordering.</p>
  </div>
</main>
<style>.content-section{max-width:800px;}.content-section h2{font-size:1.25rem;margin:1.5rem 0 .5rem;}.content-section p{color:#666;line-height:1.6;margin-bottom:1rem;}</style>
<?php get_footer(); ?>
