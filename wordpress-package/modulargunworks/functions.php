<?php
/**
 * Modular Gunworks Theme Functions
 */

function modulargunworks_enqueue_assets() {
    $theme_uri = get_template_directory_uri();
    
    // Design system & layout
    wp_enqueue_style('mgw-design-system', $theme_uri . '/assets/css/design-system.css', [], '1.0');
    wp_enqueue_style('mgw-components', $theme_uri . '/assets/css/components.css', ['mgw-design-system'], '1.0');
    wp_enqueue_style('mgw-layout', $theme_uri . '/assets/css/layout.css', ['mgw-components'], '1.0');
    wp_enqueue_style('mgw-age-gate', $theme_uri . '/assets/css/age-gate.css', [], '1.0');
    wp_enqueue_style('mgw-product-tiles', $theme_uri . '/assets/css/product-tiles.css', [], '1.0');
    if (is_front_page()) {
        wp_enqueue_style('mgw-front-page', $theme_uri . '/assets/css/front-page.css', ['mgw-layout'], '1.0');
    }
    
    // Font Awesome
    wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', [], '6.4.0');
    
    // Scripts
    wp_enqueue_script('mgw-cart', $theme_uri . '/assets/js/cart.js', [], '1.0', true);
    wp_enqueue_script('mgw-age-gate', $theme_uri . '/assets/js/age-gate.js', [], '1.0', true);
}
add_action('wp_enqueue_scripts', 'modulargunworks_enqueue_assets');

function modulargunworks_theme_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption']);
    register_nav_menus(['primary' => 'Primary Menu']);
}
add_action('after_setup_theme', 'modulargunworks_theme_setup');
