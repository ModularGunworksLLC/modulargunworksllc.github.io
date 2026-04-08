<?php
/**
 * Template: Firearm Transfer Guide
 */
get_header();
?>
<main>
  <h1 class="page-title">Firearm Transfer Guide</h1>
  <div class="content-section">
    <p>When you purchase a firearm from an out-of-state dealer or online, it must be transferred through a licensed FFL (Federal Firearms Licensee) in your state.</p>
    <h2>How It Works</h2>
    <ol>
      <li>Order your firearm online and have it shipped to Modular Gunworks LLC (or another FFL of your choice).</li>
      <li>We receive the firearm and contact you when it arrives.</li>
      <li>You come to our Huntsville location with a valid ID to complete the transfer and background check.</li>
      <li>Once approved, you take possession of your firearm.</li>
    </ol>
    <h2>Requirements</h2>
    <p>You must be 21+ for handguns, 18+ for rifles/shotguns (or 21+ per state law). You must pass a federal background check (NICS) and meet all eligibility requirements.</p>
    <p><a href="<?php echo esc_url(home_url('/ffl-transfers')); ?>">View our FFL transfer fees and details</a></p>
  </div>
</main>
<style>.content-section{max-width:800px;}.content-section h2{font-size:1.25rem;margin:1.5rem 0 .5rem;}.content-section p,.content-section ol{color:#666;line-height:1.6;margin-bottom:1rem;}.content-section ol{padding-left:1.5rem;}</style>
<?php get_footer(); ?>
