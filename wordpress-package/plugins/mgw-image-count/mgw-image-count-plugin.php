<?php
/**
 * Plugin Name: MGW Product Image Count
 * Description: Adds a Tools → Product Image Count page (lightweight - no large CSV load).
 * Version: 1.2
 * Author: Modular Gunworks
 */

if (!defined('ABSPATH')) exit;

add_action('admin_menu', function() {
    add_submenu_page(
        'tools.php',
        __('Product Image Count', 'modulargunworks'),
        __('Product Image Count', 'modulargunworks'),
        'manage_options',
        'mgw-image-count',
        'mgw_render_image_count_page'
    );
}, 99);

function mgw_render_image_count_page() {
    if (!current_user_can('manage_options')) return;

    global $wpdb;
    $prefix = $wpdb->prefix;

    $total = (int) $wpdb->get_var("
        SELECT COUNT(*) FROM {$prefix}posts
        WHERE post_type = 'product' AND post_status = 'publish'
    ");

    $with_either = (int) $wpdb->get_var("
        SELECT COUNT(DISTINCT p.ID) FROM {$prefix}posts p
        LEFT JOIN {$prefix}postmeta pm1 ON p.ID = pm1.post_id AND pm1.meta_key = '_thumbnail_id' AND pm1.meta_value != '' AND pm1.meta_value != '0'
        LEFT JOIN {$prefix}postmeta pm2 ON p.ID = pm2.post_id AND pm2.meta_key = '_chattanooga_image_url' AND pm2.meta_value != ''
        WHERE p.post_type = 'product' AND p.post_status = 'publish'
        AND (pm1.meta_id IS NOT NULL OR pm2.meta_id IS NOT NULL)
    ");

    $missing = $total - $with_either;

    echo '<div class="wrap"><h1>Product Image Report</h1>';
    echo '<table class="widefat striped"><tbody>';
    echo '<tr><td><strong>Total published products</strong></td><td>' . esc_html($total) . '</td></tr>';
    echo '<tr><td><strong>Products with images</strong></td><td>' . esc_html($with_either) . '</td></tr>';
    echo '<tr><td style="color:#b32d2e;"><strong>Products MISSING images</strong></td><td><strong>' . esc_html($missing) . '</strong></td></tr>';
    echo '</tbody></table>';

    echo '<hr><h2>View Chattanooga data for any product (by SKU)</h2>';
    echo '<form method="get" style="margin:1em 0;">';
    echo '<input type="hidden" name="page" value="mgw-image-count">';
    echo '<label>Enter SKU: </label><input type="text" name="mgw_sku" value="' . esc_attr(sanitize_text_field($_GET['mgw_sku'] ?? '')) . '" placeholder="e.g. LP420165"> ';
    echo '<button type="submit" class="button">Look up</button>';
    echo '</form>';

    $lookup_sku = isset($_GET['mgw_sku']) ? sanitize_text_field($_GET['mgw_sku']) : '';
    if ($lookup_sku && function_exists('wc_get_product_id_by_sku')) {
        $pid = wc_get_product_id_by_sku($lookup_sku);
        if ($pid) {
            $prod = wc_get_product($pid);
            echo '<div style="background:#f9f9f9;padding:1em;border:1px solid #ddd;margin:1em 0;max-width:800px;">';
            echo '<h3>' . esc_html($prod->get_name()) . ' (ID: ' . esc_html($pid) . ')</h3>';
            $meta_keys = ['_chattanooga_image_url', '_manufacturer', '_thumbnail_id'];
            echo '<table class="widefat striped"><tbody>';
            foreach ($meta_keys as $key) {
                $val = $prod->get_meta($key);
                if ($val === '' || $val === null) $val = '<em>not set</em>';
                elseif ($key === '_chattanooga_image_url' && $val) $val = '<a href="' . esc_url($val) . '" target="_blank">' . esc_html($val) . '</a>';
                echo '<tr><td><code>' . esc_html($key) . '</code></td><td>' . $val . '</td></tr>';
            }
            echo '</tbody></table>';
            $csv_path = '/tmp/chattanooga_data.csv';
            if (is_readable($csv_path)) {
                $h = fopen($csv_path, 'r');
                $headers = fgetcsv($h);
                $sku_col = in_array('SKU', $headers) ? 'SKU' : 'Item Number';
                $found = null;
                while (($row = fgetcsv($h)) !== false) {
                    if (count($row) !== count($headers)) continue;
                    $row = array_combine($headers, $row);
                    if (trim($row[$sku_col] ?? '') === $lookup_sku) { $found = $row; break; }
                }
                fclose($h);
                echo '<h4>Raw CSV row:</h4>';
                if ($found) {
                    echo '<table class="widefat striped"><tbody>';
                    foreach ($found as $col => $val) {
                        if ($col === 'Image Location' && $val) $val = '<a href="' . esc_url($val) . '" target="_blank">' . esc_html($val) . '</a>';
                        else $val = esc_html($val);
                        echo '<tr><td>' . esc_html($col) . '</td><td>' . $val . '</td></tr>';
                    }
                    echo '</tbody></table>';
                } else echo '<p><em>SKU not in CSV.</em></p>';
            } else echo '<p><em>CSV not found. Run get_chattanooga_csv.sh first.</em></p>';
            echo '</div>';
        } else echo '<p><em>No product with SKU "' . esc_html($lookup_sku) . '".</em></p>';
    }

    echo '<hr><h2>Raw data for ALL products missing images</h2>';
    echo '<p>The Chattanooga feed is too large to load in the browser. Run this command via SSH to generate the full report:</p>';
    echo '<pre style="background:#f5f5f5;padding:1em;border:1px solid #ddd;">php /home/bitnami/generate-missing-images-report.php</pre>';
    echo '<p>This creates <code>/home/bitnami/missing-images-raw-data.csv</code> with Product ID, SKU, Name, Image Location (from feed), Manufacturer, Category, Price for every product missing an image.</p>';
    echo '<p>Then download the file via SFTP/SCP or use it for your backfill.</p>';

    if ($missing > 0 && function_exists('wc_get_product')) {
        echo '<hr><h2>Sample of products missing images</h2>';
        $sample_ids = $wpdb->get_col("
            SELECT p.ID FROM {$prefix}posts p
            LEFT JOIN {$prefix}postmeta pm1 ON p.ID = pm1.post_id AND pm1.meta_key = '_thumbnail_id' AND pm1.meta_value != '' AND pm1.meta_value != '0'
            LEFT JOIN {$prefix}postmeta pm2 ON p.ID = pm2.post_id AND pm2.meta_key = '_chattanooga_image_url' AND pm2.meta_value != ''
            WHERE p.post_type = 'product' AND p.post_status = 'publish'
            AND pm1.meta_id IS NULL AND pm2.meta_id IS NULL
            ORDER BY p.ID DESC LIMIT 20
        ");
        echo '<table class="widefat striped"><thead><tr><th>ID</th><th>SKU</th><th>Product</th><th></th></tr></thead><tbody>';
        foreach ($sample_ids as $id) {
            $p = wc_get_product($id);
            if (!$p) continue;
            $edit = admin_url('post.php?post=' . $id . '&action=edit');
            $view = admin_url('tools.php?page=mgw-image-count&mgw_sku=' . urlencode($p->get_sku()));
            echo '<tr><td>' . esc_html($id) . '</td><td>' . esc_html($p->get_sku()) . '</td><td>' . esc_html(wp_trim_words($p->get_name(), 6)) . '</td><td><a href="' . esc_url($edit) . '">Edit</a> | <a href="' . esc_url($view) . '">View data</a></td></tr>';
        }
        echo '</tbody></table>';
    }
    echo '</div>';
}
