<?php
/**
 * Force Re-Save Products — Triggers Auto-Filter hook to populate attributes
 *
 * Run via: wp eval-file /path/to/wordpress-package/mgw-force-resave-products.php --path=/opt/bitnami/wordpress
 *
 * WordPress is loaded by WP-CLI; script runs in that context.
 * Set limit: change $batch below (0 = all).
 */
if (!defined('ABSPATH')) {
    exit('Run via: wp eval-file mgw-force-resave-products.php --path=/opt/bitnami/wordpress');
}

$batch = 0; // 0 = all products; set to 500 for a test run

$args = [
    'post_type'      => 'product',
    'post_status'    => 'publish',
    'posts_per_page' => $batch > 0 ? $batch : -1,
    'fields'         => 'ids',
];
$ids = get_posts($args);
$total = count($ids);

echo "Re-saving $total products to trigger Auto-Filter hook...\n";

$saved = 0;
foreach ($ids as $id) {
    $product = wc_get_product($id);
    if ($product) {
        $product->save();
        $saved++;
        if ($saved % 100 === 0) {
            echo "  Saved $saved / $total...\n";
        }
    }
}

echo "Done. $saved products re-saved. Filters should now populate.\n";
