<?php
/**
 * MGW Attribute Extractor — The "Brain"
 *
 * Reads product name/description and sets WooCommerce global attributes (pa_caliber, pa_capacity, etc.)
 * so Filter Everything filters populate automatically. Used by the auto-filter hook on product save.
 *
 * @package ModularGunworks
 */
defined('ABSPATH') || exit;

class MGW_Attribute_Extractor {

    private const CALIBER_PATTERNS = [
        '.22 LR', '.22 Magnum', '.22 TCM', '.38 Special', '.357 Magnum', '.40 S&W', '.45 ACP', '.45 Colt',
        '.223', '.224', '.243', '.270', '.308', '.30-06', '.300 Win Mag', '.300 BLK', '.300 Blackout',
        '9mm', '10mm', '5.56', '5.56 NATO', '6.5 Creedmoor', '6.5 Grendel', '6mm ARC',
        '7.62x39', '7.62x39mm', '7.62x54', '7.62 NATO', '12 Gauge', '20 Gauge',
        '410', '.45-70', '.222 Remington', '.223 Rem', '.308 Win',
    ];

    private const BULLET_MAP = [
        'FMJ' => ['FMJ', 'Full Metal Jacket'],
        'JHP' => ['JHP', 'Jacketed Hollow Point'],
        'HP' => ['Hollow Point', ' HP'],
        'Soft Point' => ['Soft Point', 'SP'],
        'BTHP' => ['BTHP', 'Boat Tail'],
        'Round Nose' => ['Round Nose', 'LRN', 'RN'],
        'Buckshot' => ['Buck', 'Buckshot'],
        'Slug' => ['Slug'],
    ];

    /**
     * Set filter attributes from product name. Called by the auto-filter hook.
     *
     * @param WC_Product $product
     */
    public function set_attributes_from_name($product) {
        if (!$product || !is_a($product, 'WC_Product')) {
            return;
        }
        $product_id = $product->get_id();
        if (!$product_id) {
            return; // New product not yet saved — will run again on woocommerce_new_product
        }

        $name = $product->get_name();
        $desc = $product->get_short_description();
        $text = $name . ' ' . $desc;

        $terms = get_the_terms($product_id, 'product_cat');
        $top_slug = $this->get_primary_top_slug($terms);
        $is_ammo = in_array($top_slug, ['ammunition'], true);
        $is_mag = in_array($top_slug, ['magazines'], true);

        // Brand: prefer meta (from CSV Manufacturer) over extraction
        $brand = $product->get_meta('_brand') ?: $product->get_meta('_manufacturer');
        if (!$brand) {
            $brand = $this->extract_brand($text);
        }
        if ($brand) {
            $this->set_product_attribute_term($product, 'pa_brand', $brand);
        }

        // Caliber: all products (ammo, mags, parts with caliber in name)
        $caliber = $this->extract_caliber($text);
        if ($caliber) {
            $this->set_product_attribute_term($product, 'pa_caliber', $caliber);
        }

        // Ammunition: bullet_type, grain_weight, round_count, steel_case, subsonic, _round_count, _price_per_round
        if ($is_ammo) {
            $bullet = $this->extract_bullet_type($text);
            $grain = $this->extract_grain_weight($text);
            $steel = $this->extract_steel_case($text);
            $subsonic = $this->extract_subsonic($text);
            $rounds = $this->extract_round_count($text);

            foreach (['bullet_type' => $bullet, 'grain_weight' => $grain, 'steel_case' => $steel, 'subsonic' => $subsonic] as $slug => $val) {
                if ($val) {
                    $this->set_product_attribute_term($product, 'pa_' . $slug, $val);
                }
            }
            if ($rounds > 0) {
                update_post_meta($product->get_id(), '_round_count', $rounds);
                $price = (float) $product->get_price();
                if ($price > 0) {
                    update_post_meta($product->get_id(), '_price_per_round', round($price / $rounds, 4));
                }
            }
        }

        // Magazines: capacity
        if ($is_mag) {
            $capacity = $this->extract_capacity($text);
            if ($capacity) {
                $this->set_product_attribute_term($product, 'pa_capacity', $capacity);
            }
        }

        // Non-ammo: still try bullet_type and grain_weight (e.g. "9mm 124gr FMJ" in gun parts)
        if (!$is_ammo) {
            $bullet = $this->extract_bullet_type($text);
            $grain = $this->extract_grain_weight($text);
            if ($bullet) {
                $this->set_product_attribute_term($product, 'pa_bullet_type', $bullet);
            }
            if ($grain) {
                $this->set_product_attribute_term($product, 'pa_grain_weight', $grain);
            }
        }
    }

    /**
     * Get primary top-level category slug from product terms.
     */
    private function get_primary_top_slug($terms) {
        if (!$terms || is_wp_error($terms)) {
            return '';
        }
        $top_slugs = ['ammunition', 'magazines', 'firearms', 'gun-parts', 'gear', 'optics', 'reloading', 'outdoors'];
        foreach ($terms as $t) {
            if ($t->parent === 0 && in_array($t->slug, $top_slugs, true)) {
                return $t->slug;
            }
            $ancestor = get_ancestors($t->term_id, 'product_cat');
            foreach (array_reverse($ancestor) as $aid) {
                $a = get_term($aid, 'product_cat');
                if ($a && !is_wp_error($a) && $a->parent === 0 && in_array($a->slug, $top_slugs, true)) {
                    return $a->slug;
                }
            }
        }
        return '';
    }

    private function extract_caliber($text) {
        if (!$text) {
            return '';
        }
        $u = strtoupper($text);
        foreach (self::CALIBER_PATTERNS as $p) {
            if (stripos($u, $p) !== false) {
                return $p;
            }
        }
        if (preg_match('/\d+\.\d+x\d+(?:mm)?/i', $text, $m)) {
            return $m[0];
        }
        return '';
    }

    private function extract_bullet_type($text) {
        if (!$text) {
            return '';
        }
        $u = strtoupper($text);
        foreach (self::BULLET_MAP as $type => $patterns) {
            foreach ($patterns as $p) {
                if (stripos($u, $p) !== false) {
                    return $type;
                }
            }
        }
        return '';
    }

    private function extract_grain_weight($text) {
        if (!preg_match('/(\d+)\s*(?:gr|grain)/i', (string) $text, $m)) {
            return '';
        }
        return $m[1] . 'gr';
    }

    private function extract_capacity($text) {
        if (!preg_match('/(\d+)\s*(?:rd|rds|round|rounds|capacity|\/)/i', (string) $text, $m)) {
            return '';
        }
        return $m[1] . ' rd';
    }

    private function extract_round_count($text) {
        if (!$text) {
            return 0;
        }
        if (preg_match('/(\d+)\s*(?:rd|rds|round|rounds)\s*(?:\/|$)/i', $text, $m)) {
            return (int) $m[1];
        }
        if (preg_match('/(\d+)\s*RD\b/i', $text, $m)) {
            return (int) $m[1];
        }
        if (preg_match('/(\d+)\s*\/\s*(?:ct|rd|box)/i', $text, $m)) {
            return (int) $m[1];
        }
        if (preg_match('/\b(\d+)\s*\/\s*ct\b/i', $text, $m)) {
            return (int) $m[1];
        }
        if (preg_match('/\((\d+)\s*round/i', $text, $m)) {
            return (int) $m[1];
        }
        return 0;
    }

    private function extract_steel_case($text) {
        if (!$text) {
            return '';
        }
        if (preg_match('/steel\s*(?:case|cased)?/i', $text)) {
            return 'Yes';
        }
        return '';
    }

    private function extract_subsonic($text) {
        if (!$text) {
            return '';
        }
        if (preg_match('/subsonic/i', $text)) {
            return 'Yes';
        }
        return '';
    }

    /**
     * Extract brand from text (fallback when no Manufacturer meta).
     * Looks for "Brand Name -" or "Brand Name |" or known brands in name.
     */
    private function extract_brand($text) {
        if (!$text) {
            return '';
        }
        // Common pattern: "Federal 9mm 115gr FMJ" or "Sig Sauer P320..."
        $known = ['Federal', 'Remington', 'Winchester', 'Hornady', 'Sig Sauer', 'Sig', 'Glock', 'Smith & Wesson', 'S&W', 'Ruger', 'B5 Systems', 'Magpul', 'Vortex', 'Leupold', 'Bushnell', 'CCI', 'Fiocchi', 'Sellier & Bellot', 'PMC', 'Blazer', 'Speer', 'Nosler', 'Barnes', 'Sierra', 'Norma', 'Lapua'];
        foreach ($known as $b) {
            if (stripos($text, $b) !== false) {
                return $b;
            }
        }
        return '';
    }

    /**
     * Ensure taxonomy exists and set term for product.
     */
    private function set_product_attribute_term($product, $attr_name, $value) {
        if (!$value || !$product || !is_a($product, 'WC_Product')) {
            return;
        }
        $slug = sanitize_title($value);
        if (!$slug) {
            return;
        }
        if (!taxonomy_exists($attr_name)) {
            $nice = ucwords(str_replace(['pa_', '_'], ['', ' '], $attr_name));
            if (function_exists('wc_create_attribute')) {
                wc_create_attribute(['name' => $nice, 'slug' => str_replace('pa_', '', $attr_name), 'has_archives' => false]);
            }
            register_taxonomy($attr_name, 'product', [
                'labels' => ['name' => $nice],
                'hierarchical' => false,
                'show_ui' => false,
                'query_var' => true,
                'rewrite' => false,
            ]);
        }
        $term = get_term_by('slug', $slug, $attr_name);
        if (!$term) {
            wp_insert_term($value, $attr_name, ['slug' => $slug]);
            $term = get_term_by('slug', $slug, $attr_name);
        }
        if ($term && !is_wp_error($term)) {
            wp_set_object_terms($product->get_id(), [(int) $term->term_id], $attr_name);
        }
    }
}
