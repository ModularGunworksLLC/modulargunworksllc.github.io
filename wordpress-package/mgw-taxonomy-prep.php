<?php
/**
 * Taxonomy Prep — Ensure pa_caliber, pa_capacity, pa_brand exist
 *
 * Run via: wp eval-file /path/to/wordpress-package/mgw-taxonomy-prep.php --path=/opt/bitnami/wordpress
 */
if (!defined('ABSPATH')) {
    exit('Run via: wp eval-file mgw-taxonomy-prep.php --path=/opt/bitnami/wordpress');
}

if (!function_exists('wc_create_attribute')) {
    echo "WooCommerce not active.\n";
    exit(1);
}

$attrs = [
    ['name' => 'Caliber', 'slug' => 'caliber'],
    ['name' => 'Capacity', 'slug' => 'capacity'],
    ['name' => 'Brand', 'slug' => 'brand'],
    ['name' => 'Bullet Type', 'slug' => 'bullet_type'],
    ['name' => 'Grain Weight', 'slug' => 'grain_weight'],
    ['name' => 'Steel Case', 'slug' => 'steel_case'],
    ['name' => 'Subsonic', 'slug' => 'subsonic'],
];

foreach ($attrs as $a) {
    $tax = 'pa_' . $a['slug'];
    if (taxonomy_exists($tax)) {
        echo "✓ $tax exists\n";
    } else {
        $id = wc_create_attribute(['name' => $a['name'], 'slug' => $a['slug'], 'has_archives' => false]);
        if (is_wp_error($id)) {
            echo "✗ $tax: " . $id->get_error_message() . "\n";
        } else {
            echo "✓ $tax created (ID: $id)\n";
        }
    }
}

echo "\nTaxonomy prep complete. Attribute Extractor can now set terms.\n";
