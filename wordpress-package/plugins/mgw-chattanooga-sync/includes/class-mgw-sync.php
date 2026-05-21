<?php
/**
 * Chattanooga API → WooCommerce sync
 */
defined('ABSPATH') || exit;

class MGW_Chattanooga_Sync {

    const API_BASE = 'https://api.chattanoogashooting.com/rest/v5';
    const OPTION_SID = 'mgw_chattanooga_api_sid';
    const OPTION_TOKEN = 'mgw_chattanooga_api_token';
    /** @see MGW_CHATTANOOGA_OPTION_SCHEDULED_SYNC in main plugin file */
    const OPTION_SCHEDULED_SYNC = 'mgw_chattanooga_scheduled_sync_enabled';
    const OPTION_LAST_SYNC = 'mgw_chattanooga_last_sync';
    const OPTION_LAST_STATUS = 'mgw_chattanooga_last_status';
    const ENV_FILE_PATHS = ['/home/bitnami/modulargunworksllc.github.io/.env', __DIR__ . '/../../../modulargunworksllc.github.io/.env'];

    /** @var self */
    private static $instance;

    /**
     * Load API_SID and API_TOKEN from .env file if it exists
     */
    private function load_from_env() {
        foreach (self::ENV_FILE_PATHS as $path) {
            if (!is_readable($path)) continue;
            $content = file_get_contents($path);
            $sid = $token = '';
            foreach (preg_split('/\r\n|\r|\n/', $content) as $line) {
                $line = trim($line);
                if ($line === '' || strpos($line, '#') === 0) continue;
                if (preg_match('/^API_SID=(.+)$/', $line, $m)) $sid = trim($m[1], " \t\n\r\0\x0B\"'");
                if (preg_match('/^API_TOKEN=(.+)$/', $line, $m)) $token = trim($m[1], " \t\n\r\0\x0B\"'");
            }
            if ($sid && $token) {
                update_option(self::OPTION_SID, $sid);
                update_option(self::OPTION_TOKEN, $token);
                return true;
            }
        }
        return false;
    }

    public static function instance() {
        if (!self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('admin_menu', [$this, 'add_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('mgw_chattanooga_sync_cron', [$this, 'run_sync']);
        add_action('wp_ajax_mgw_chattanooga_sync_now', [$this, 'ajax_sync_now']);
    }

    public function add_menu() {
        add_options_page(
            __('Chattanooga Sync', 'mgw-chattanooga-sync'),
            __('Chattanooga Sync', 'mgw-chattanooga-sync'),
            'manage_woocommerce',
            'mgw-chattanooga-sync',
            [$this, 'render_settings_page']
        );
    }

    public function register_settings() {
        register_setting('mgw_chattanooga_sync', self::OPTION_SID, [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
        ]);
        register_setting('mgw_chattanooga_sync', self::OPTION_TOKEN, [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
        ]);
        register_setting('mgw_chattanooga_sync', self::OPTION_SCHEDULED_SYNC, [
            'type' => 'string',
            'sanitize_callback' => [$this, 'sanitize_scheduled_sync_enabled'],
        ]);
    }

    /**
     * '1' = schedule WP-Cron every 4 hours; anything else clears the hook.
     */
    public function sanitize_scheduled_sync_enabled($value) {
        $on = ($value === '1' || $value === 1 || $value === true);
        if ($on) {
            if (!wp_next_scheduled('mgw_chattanooga_sync_cron')) {
                wp_schedule_event(time(), 'mgw_four_hours', 'mgw_chattanooga_sync_cron');
            }
        } else {
            wp_clear_scheduled_hook('mgw_chattanooga_sync_cron');
        }
        return $on ? '1' : '0';
    }

    public function render_settings_page() {
        if (empty(get_option(self::OPTION_SID, '')) || empty(get_option(self::OPTION_TOKEN, ''))) {
            $this->load_from_env();
        }
        $sid = defined('MGW_CHATTANOOGA_API_SID') && MGW_CHATTANOOGA_API_SID ? MGW_CHATTANOOGA_API_SID : get_option(self::OPTION_SID, '');
        $token = defined('MGW_CHATTANOOGA_API_TOKEN') && MGW_CHATTANOOGA_API_TOKEN ? MGW_CHATTANOOGA_API_TOKEN : get_option(self::OPTION_TOKEN, '');
        $scheduled_on = get_option(self::OPTION_SCHEDULED_SYNC, '0') === '1';
        $last_sync = get_option(self::OPTION_LAST_SYNC, '');
        $last_status = get_option(self::OPTION_LAST_STATUS, '');
        ?>
        <div class="wrap">
            <h1><?php esc_html_e('Chattanooga Product Sync', 'mgw-chattanooga-sync'); ?></h1>
            <p class="description" style="max-width:720px;">
                <?php esc_html_e('Sync pulls the catalog CSV directly from your Chattanooga API (GET /rest/v5/items/product-feed — the same signed export the dealer portal uses). It is cached under wp-content/uploads/mgw-chattanooga-cache/ between batches. No separate script or /tmp file is required. To force use of a local file instead, define MGW_CHATTANOOGA_LEGACY_CSV_PATH in wp-config.php.', 'mgw-chattanooga-sync'); ?>
            </p>

            <form method="post" action="options.php">
                <?php settings_fields('mgw_chattanooga_sync'); ?>
                <table class="form-table">
                    <tr>
                        <th><label for="<?php echo esc_attr(self::OPTION_SID); ?>"><?php esc_html_e('API SID', 'mgw-chattanooga-sync'); ?></label></th>
                        <td><input type="text" id="<?php echo esc_attr(self::OPTION_SID); ?>" name="<?php echo esc_attr(self::OPTION_SID); ?>" value="<?php echo esc_attr($sid); ?>" class="regular-text" /></td>
                    </tr>
                    <tr>
                        <th><label for="<?php echo esc_attr(self::OPTION_TOKEN); ?>"><?php esc_html_e('API Token', 'mgw-chattanooga-sync'); ?></label></th>
                        <td><input type="password" id="<?php echo esc_attr(self::OPTION_TOKEN); ?>" name="<?php echo esc_attr(self::OPTION_TOKEN); ?>" value="<?php echo esc_attr($token); ?>" class="regular-text" autocomplete="off" /></td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e('Scheduled sync', 'mgw-chattanooga-sync'); ?></th>
                        <td>
                            <input type="hidden" name="<?php echo esc_attr(self::OPTION_SCHEDULED_SYNC); ?>" value="0" />
                            <label>
                                <input type="checkbox" name="<?php echo esc_attr(self::OPTION_SCHEDULED_SYNC); ?>" value="1" <?php checked($scheduled_on); ?> />
                                <?php esc_html_e('Enable automatic catalog sync (WP-Cron, every 4 hours). Leave off until a full CSV import has been verified; manual “Sync Now” below always works.', 'mgw-chattanooga-sync'); ?>
                            </label>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>

            <hr>
            <h2><?php esc_html_e('Sync Products', 'mgw-chattanooga-sync'); ?></h2>
            <p>
                <button type="button" id="mgw-sync-now" class="button button-primary">
                    <?php esc_html_e('Sync Now', 'mgw-chattanooga-sync'); ?>
                </button>
                <span id="mgw-sync-status" style="margin-left:1rem;"></span>
            </p>
            <?php if ($last_sync) : ?>
            <p><?php echo esc_html(sprintf(__('Last sync: %s', 'mgw-chattanooga-sync'), date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($last_sync)))); ?></p>
            <?php endif; ?>
            <?php if ($last_status) : ?>
            <pre style="background:#f5f5f5;padding:1rem;max-height:200px;overflow:auto;font-size:12px;"><?php echo esc_html($last_status); ?></pre>
            <?php endif; ?>
        </div>
        <script>
        jQuery('#mgw-sync-now').on('click', function() {
            var btn = jQuery(this);
            btn.prop('disabled', true);
            jQuery('#mgw-sync-status').text('<?php echo esc_js(__('Syncing...', 'mgw-chattanooga-sync')); ?>');
            jQuery.post(ajaxurl, { action: 'mgw_chattanooga_sync_now', nonce: '<?php echo esc_js(wp_create_nonce('mgw_chattanooga_sync')); ?>' })
                .done(function(r) {
                    if (r.success) {
                        jQuery('#mgw-sync-status').text(r.data.message || 'Done');
                        location.reload();
                    } else {
                        jQuery('#mgw-sync-status').text('Error: ' + (r.data || 'Unknown'));
                        btn.prop('disabled', false);
                    }
                })
                .fail(function() {
                    jQuery('#mgw-sync-status').text('Request failed');
                    btn.prop('disabled', false);
                });
        });
        </script>
        <?php
    }

    public function ajax_sync_now() {
        check_ajax_referer('mgw_chattanooga_sync', 'nonce');
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error('Forbidden');
        }
        $result = $this->run_sync();
        wp_send_json_success($result);
    }

    /**
     * Map top-level category name to WooCommerce product_cat slug
     */
    private function top_to_slug($top) {
        $map = [
            'Ammunition' => 'ammunition',
            'Magazines' => 'magazines',
            'Firearms' => 'firearms',
            'Gun Parts' => 'gun-parts',
            'Gear' => 'gear',
            'Optics' => 'optics',
            'Reloading' => 'reloading',
            'Outdoors' => 'outdoors',
            'Clothing & Footwear' => 'gear',
            'Knives' => 'gear',
        ];
        return $map[$top] ?? strtolower(str_replace(' ', '-', $top));
    }

    /**
     * Resolve subcategory slug from mapping "sub" value. Returns slug for child term under parent.
     * Theme creates handgun, rifle, rimfire, shotgun under ammunition.
     * For magazines/firearms we create handgun-magazines, rifle-magazines, handguns, rifles, shotguns as needed.
     */
    private function sub_to_slug($top, $sub) {
        if (!$sub || !is_string($sub)) return null;
        $sub = trim($sub);
        // Take first segment if pipe-separated (e.g. "Handgun Ammunition|Rifle Ammunition" -> "Handgun Ammunition")
        if (strpos($sub, '|') !== false) {
            $sub = trim(explode('|', $sub)[0]);
        }
        $u = strtoupper($sub);
        if ($top === 'Ammunition') {
            if (strpos($u, 'RIMFIRE') !== false) return 'rimfire';
            if (strpos($u, 'HANDGUN') !== false) return 'handgun';
            if (strpos($u, 'RIFLE') !== false) return 'rifle';
            if (strpos($u, 'SHOTGUN') !== false) return 'shotgun';
        }
        if ($top === 'Magazines') {
            if (strpos($u, 'HANDGUN') !== false) return 'handgun-magazines';
            if (strpos($u, 'RIFLE') !== false) return 'rifle-magazines';
            if (strpos($u, 'SHOTGUN') !== false) return 'shotgun-magazines';
        }
        if ($top === 'Firearms') {
            if (strpos($u, 'HANDGUN') !== false) return 'handguns';
            if (strpos($u, 'SHORT BARREL') !== false && strpos($u, 'RIFLE') !== false) return 'short-barreled-rifles';
            if (strpos($u, 'RIFLE') !== false) return 'rifles';
            if (strpos($u, 'SHOTGUN') !== false) return 'shotguns';
            if (strpos($u, 'LOWER') !== false) return 'lowers';
            if (strpos($u, 'USED') !== false) return 'used-guns';
            if (strpos($u, 'CA COMPLIANT') !== false) return 'ca-compliant';
            if (strpos($u, 'MA COMPLIANT') !== false) return 'ma-compliant';
        }
        if ($top === 'Gun Parts') {
            $segments = array_filter(array_map('trim', explode('|', $sub)));
            if (empty($segments)) return null;
            $candidate = end($segments);
            if (stripos($candidate, 'CSSI Exclusive') !== false) return null;
            $slug = sanitize_title($candidate);
            return $slug ?: null;
        }
        return null;
    }

    /**
     * Return first non-empty scalar value from normalized row or raw feed aliases.
     *
     * @param array $n    Normalized row
     * @param array $row  Raw CSV row
     * @param array $keys Candidate keys/columns
     */
    private function first_non_empty_value(array $n, array $row, array $keys) {
        foreach ($keys as $k) {
            $val = $n[$k] ?? $row[$k] ?? '';
            if (!is_scalar($val)) {
                continue;
            }
            $val = trim((string) $val);
            if ($val !== '') {
                return $val;
            }
        }
        return '';
    }

    /**
     * Get or create a subcategory term under parent. Returns WP_Term or null.
     */
    private function get_or_create_subcategory($parent_term, $sub_slug, $sub_display_name = null) {
        if (!$parent_term || !$sub_slug) return null;
        $parent_id = (int) $parent_term->term_id;
        $existing = get_term_by('slug', $sub_slug, 'product_cat');
        if ($existing && (int) $existing->parent === $parent_id) {
            return $existing;
        }
        if ($existing && (int) $existing->parent !== $parent_id) {
            return null;
        }
        $name = $sub_display_name ?? ucfirst(str_replace('-', ' ', $sub_slug));
        $t = wp_insert_term($name, 'product_cat', ['slug' => $sub_slug, 'parent' => $parent_id]);
        if (is_wp_error($t)) return null;
        return get_term($t['term_id'], 'product_cat');
    }

    /**
     * High-res image URL
     */
    private function to_high_res_image($url, $size = 500) {
        if (!$url) return '';
        return preg_replace('/\?w=\d+&h=\d+/', '?w=' . $size . '&h=' . $size, $url);
    }

    /**
     * NFA / SOT-restricted merchandise: suppressors, SBRs, dedicated NFA parts trees.
     * Allows suppressor cleaning chemicals (non-serialized consumables) only.
     */
    private function is_nfa_vendor_category($cat_key) {
        if (!is_string($cat_key) || $cat_key === '') {
            return false;
        }
        $ck = $cat_key;

        if (strcasecmp($ck, 'Suppressor Cleaners') === 0) {
            return false;
        }
        if (stripos($ck, 'Suppressors Accessories') === 0) {
            return true;
        }
        if (stripos($ck, 'Suppressor Height Sights') !== false) {
            return true;
        }

        if (stripos($ck, 'Short Barreled Rifle') !== false || stripos($ck, 'Short Barreled Rifles') !== false) {
            return true;
        }
        if (stripos($ck, 'Short Barreled Shotgun') !== false) {
            return true;
        }
        if (preg_match('/\bNFA\b/i', $ck)) {
            return true;
        }

        if (strcasecmp($ck, 'Suppressors') === 0) {
            return true;
        }
        if (stripos($ck, 'Suppressors|') === 0) {
            return true;
        }
        if (stripos($ck, 'Suppressors and Parts') === 0) {
            return true;
        }

        return false;
    }

    /**
     * Customer-facing price: MSRP if present &gt; 0, else MAP if &gt; 0. Dealer CSV "Price" is never used for retail.
     *
     * @return float|null
     */
    private function resolve_listing_price($n, array $row) {
        $msrp_raw = $n['msrp'] ?? $row['MSRP'] ?? '';
        $map_raw  = $n['map'] ?? $row['MAP'] ?? '';
        $msrp_val = is_numeric($msrp_raw) ? (float) $msrp_raw : 0;
        $map_val  = is_numeric($map_raw) ? (float) $map_raw : 0;
        if ($msrp_val > 0) {
            return $msrp_val;
        }
        if ($map_val > 0) {
            return $map_val;
        }
        return null;
    }

    /**
     * Valid HTTPS/HTTP image URL from feed (Chattanooga CDN). Empty if unusable.
     */
    private function resolve_valid_image_url($n, array $row, $sku = '') {
        $img_raw = $n['image_url'] ?? $row['Image Location'] ?? $row['Image URL'] ?? '';
        $img_raw = is_string($img_raw) ? trim($img_raw) : '';
        if ($img_raw === '') {
            return '';
        }
        $img = $this->to_high_res_image($img_raw, 800);
        if (!filter_var($img, FILTER_VALIDATE_URL)) {
            $sku = is_string($sku) ? trim($sku) : '';
            if ($sku !== '') {
                error_log(sprintf('[MGW Chattanooga Sync] Invalid image URL for SKU %s: %s', $sku, $img_raw));
            } else {
                error_log(sprintf('[MGW Chattanooga Sync] Invalid image URL: %s', $img_raw));
            }
            return '';
        }
        $scheme = wp_parse_url($img, PHP_URL_SCHEME);
        if (!in_array($scheme, ['http', 'https'], true)) {
            return '';
        }
        return $img;
    }

    /**
     * Assign WooCommerce product_cat (parent + optional child) every sync so mapping fixes propagate.
     */
    private function assign_product_categories($product_id, $parent_slug, $sub_slug) {
        $product_id = (int) $product_id;
        $parent_term = get_term_by('slug', $parent_slug, 'product_cat');
        $term_ids = [];
        if ($parent_term) {
            $term_ids[] = (int) $parent_term->term_id;
            if ($sub_slug) {
                $child_term = $this->get_or_create_subcategory($parent_term, $sub_slug);
                if ($child_term) {
                    $term_ids[] = (int) $child_term->term_id;
                }
            }
        }
        if (!empty($term_ids)) {
            wp_set_object_terms($product_id, $term_ids, 'product_cat');
        }
    }

    /**
     * Apply pa_* terms from CSV when present; fall back to name-based extraction for ammo/mags.
     *
     * @param WC_Product $product
     * @param string     $parent_slug e.g. ammunition, magazines
     */
    private function apply_chattanooga_filter_attributes($product, array $n, array $row, $parent_slug) {
        if (!$product || !is_a($product, 'WC_Product')) {
            return;
        }
        $name = $product->get_name();

        if ($parent_slug === 'ammunition') {
            $this->set_ammo_attributes($product, $name);
        } elseif ($parent_slug === 'magazines') {
            $this->set_magazine_attributes($product, $name);
        }

        $brand = $n['brand'] ?? $row['Manufacturer'] ?? '';
        $brand = is_string($brand) ? trim($brand) : '';
        if ($brand !== '') {
            $this->set_product_brand_attribute($product, $brand);
        }

        $caliber = isset($n['caliber']) ? trim((string) $n['caliber']) : '';
        if ($caliber === '' && in_array($parent_slug, ['firearms', 'guns', 'handguns', 'rifles', 'shotguns'], true)) {
            $caliber = $this->extract_caliber($name);
        }
        if ($caliber !== '') {
            $this->set_product_attribute_term($product, 'pa_caliber', $caliber);
        }

        $bullet = isset($n['bullet_type']) ? trim((string) $n['bullet_type']) : '';
        if ($bullet !== '') {
            $this->set_product_attribute_term($product, 'pa_bullet_type', $bullet);
        }

        $grain = isset($n['grain']) ? trim((string) $n['grain']) : '';
        if ($grain !== '') {
            $grain_compact = str_replace(' ', '', $grain);
            if (!preg_match('/gr$/i', $grain_compact)) {
                $grain_attr = $grain_compact . 'gr';
            } else {
                $grain_attr = $grain_compact;
            }
            $this->set_product_attribute_term($product, 'pa_grain_weight', $grain_attr);
        }

        $cap = isset($n['capacity']) ? trim((string) $n['capacity']) : '';
        if ($cap !== '' && !preg_match('/rd/i', $cap)) {
            $cap = $cap . ' rd';
        }
        if ($cap !== '') {
            $this->set_product_attribute_term($product, 'pa_capacity', $cap);
        }

        $gauge = isset($n['gauge']) ? trim((string) $n['gauge']) : '';
        if ($gauge !== '') {
            $this->set_product_attribute_term($product, 'pa_gauge', $gauge);
        }

        $velocity = isset($n['velocity']) ? trim((string) $n['velocity']) : '';
        if ($velocity !== '') {
            $this->set_product_attribute_term($product, 'pa_velocity', $velocity);
        }

        $shot_size = isset($n['shot_size']) ? trim((string) $n['shot_size']) : '';
        if ($shot_size !== '') {
            $this->set_product_attribute_term($product, 'pa_shot_size', $shot_size);
        }

        $casing = isset($n['casing']) ? trim((string) $n['casing']) : '';
        if ($casing !== '') {
            $this->set_product_attribute_term($product, 'pa_casing', $casing);
        }

        $product_line = isset($n['product_line']) ? trim((string) $n['product_line']) : '';
        if ($product_line !== '') {
            $this->set_product_attribute_term($product, 'pa_product_line', $product_line);
        }

        $style = isset($n['style']) ? trim((string) $n['style']) : '';
        if ($style !== '') {
            $this->set_product_attribute_term($product, 'pa_style', $style);
        }

        $shotshell_length = $this->first_non_empty_value(
            $n,
            $row,
            ['shotshell_length', 'Shotshell Length', 'Shell Length', 'ShellLength', 'Length']
        );
        if ($shotshell_length !== '') {
            $this->set_product_attribute_term($product, 'pa_shotshell_length', $shotshell_length);
        }

        $shot_material = $this->first_non_empty_value(
            $n,
            $row,
            ['shot_material', 'Shot Material', 'ShotMaterial', 'Pellet Material']
        );
        if ($shot_material !== '') {
            $this->set_product_attribute_term($product, 'pa_shot_material', $shot_material);
        }

        $lead_free = $this->first_non_empty_value(
            $n,
            $row,
            ['lead_free', 'Lead Free', 'Lead-Free', 'LeadFree', 'Non-Lead']
        );
        if ($lead_free !== '') {
            $normalized_yes = in_array(strtolower($lead_free), ['1', 'true', 'yes', 'y'], true) ? 'Yes' : $lead_free;
            $this->set_product_attribute_term($product, 'pa_lead_free', $normalized_yes);
        }

        $rounds_raw = $n['round_count'] ?? '';
        if ($rounds_raw === '' || $rounds_raw === null) {
            $rounds_raw = $row['Rounds'] ?? $row['Rounds Per Box'] ?? '';
        }
        if (is_string($rounds_raw)) {
            $rounds_raw = preg_replace('/[^\d.]/', '', $rounds_raw);
        }
        $rounds = is_numeric($rounds_raw) ? (int) $rounds_raw : 0;
        if ($rounds > 0) {
            $this->set_product_attribute_term($product, 'pa_rounds', (string) $rounds);
            $product->update_meta_data('_round_count', $rounds);
            $price = (float) $product->get_price();
            if ($price > 0) {
                $product->update_meta_data('_price_per_round', round($price / $rounds, 4));
            }
        }

        $product->save();
    }

    /**
     * Run full sync
     */
    public function run_sync() {
        $log = [];
        $created = 0;
        $updated = 0;
        $skipped_saves = 0;

        $GLOBALS['mgw_chattanooga_sync_import'] = true;
        try {
            // 1) Load Category Mapping
            $mapping_path = MGW_CHATTANOOGA_SYNC_PATH . 'includes/category-mapping.json';
            if (!file_exists($mapping_path)) {
                throw new Exception('Category mapping file not found');
            }
            $mapping = json_decode(file_get_contents($mapping_path), true);
            if (!is_array($mapping)) {
                throw new Exception('Category mapping JSON is invalid');
            }

            // 2) CSV path: API product-feed (canonical) or optional legacy file (may reset batch offset)
            $csv_path = $this->resolve_csv_path_for_sync($log);
            $offset   = (int) get_option('mgw_chattanooga_batch_offset', 0);
            $batch_size = 50;

            $batch_processed = 0;
            $row_no = 0;
            $last_row = $offset;
            $end_reached = false;

            // Load vendor map once
            $vendor_map = class_exists('MGW_Normalizer')
                ? (MGW_Normalizer::load_map(MGW_CHATTANOOGA_SYNC_PATH . 'includes/chattanooga-map.json') ?: MGW_Normalizer::get_chattanooga_map())
                : ['columns' => []];

            // 3) Stream-parse CSV (avoid processing whole CSV at once)
            $fh = fopen($csv_path, 'r');
            if (!$fh) {
                throw new Exception('Failed to open CSV file');
            }

            $headers = fgetcsv($fh);
            if (!$headers || !is_array($headers)) {
                fclose($fh);
                throw new Exception('CSV header row is missing/invalid');
            }
            $headers = array_map(static function ($h) {
                return trim((string) $h);
            }, $headers);

            while (($values = fgetcsv($fh)) !== false) {
                $row_no++;

                // Skip rows up to the saved offset
                if ($row_no <= $offset) {
                    continue;
                }

                // Convert row to associative array for normalizer
                $row = [];
                foreach ($headers as $i => $h) {
                    if ($h === '') continue;
                    $row[$h] = isset($values[$i]) ? (string) $values[$i] : '';
                }

                // Stop once we have enough items for this batch
                if ($batch_processed >= $batch_size) {
                    break;
                }

                // Normalize row via Traffic Controller (Chattanooga map)
                $n = class_exists('MGW_Normalizer') ? MGW_Normalizer::normalize($row, $vendor_map) : $row;

                $sku = $n['sku'] ?? $row['SKU'] ?? $row['Item Number'] ?? '';
                $sku = is_string($sku) ? trim($sku) : '';
                if (!$sku) {
                    update_option('mgw_chattanooga_batch_offset', $row_no);
                    $last_row = $row_no;
                    continue;
                }

                // Map Category (Parent + Child)
                $cat_key = $n['category_key'] ?? $row['Category'] ?? '';
                $cat_key = is_string($cat_key) ? trim($cat_key) : '';
                $map = $mapping[$cat_key] ?? null;

                if (!$map) {
                    $top_cat = 'New Arrivals';
                    $parent_slug = 'new-arrivals';
                    $sub_slug = null;
                } else {
                    $top_cat = $map['top'] ?? 'New Arrivals';
                    $parent_slug = $this->top_to_slug($top_cat);
                    $sub_slug = $this->sub_to_slug($top_cat, $map['sub'] ?? '');
                }

                // NFA / SOT-restricted — never publish; draft existing SKUs; skip creating new.
                if ($this->is_nfa_vendor_category($cat_key)) {
                    $nfa_pid = wc_get_product_id_by_sku($sku);
                    if ($nfa_pid) {
                        $p = wc_get_product((int) $nfa_pid);
                        if ($p) {
                            $p->set_status('draft');
                            $p->set_catalog_visibility('hidden');
                            $p->save();
                        }
                        update_post_meta((int) $nfa_pid, '_mgw_nfa_hold', '1');
                    }
                    update_option('mgw_chattanooga_batch_offset', $row_no);
                    $last_row = $row_no;
                    $batch_processed++;
                    continue;
                }

                $msrp_raw = $n['msrp'] ?? $row['MSRP'] ?? '';
                $map_raw  = $n['map'] ?? $row['MAP'] ?? '';
                $list_price = $this->resolve_listing_price($n, $row);
                $image_url  = $this->resolve_valid_image_url($n, $row, $sku);

                $sellable = ($list_price !== null && $list_price > 0 && $image_url !== '');
                $desired_stock_qty = (int) ($n['stock'] ?? $row['Quantity In Stock'] ?? $row['Quantity Available'] ?? 0);

                $product_id = wc_get_product_id_by_sku($sku);
                $is_existing = (bool) $product_id;

                if ($is_existing) {
                    $product = wc_get_product($product_id);
                } else {
                    $product = new WC_Product_Simple();
                    $product->set_sku($sku);
                }

                if (!$product || !is_a($product, 'WC_Product')) {
                    update_option('mgw_chattanooga_batch_offset', $row_no);
                    $last_row = $row_no;
                    continue;
                }

                if (!$is_existing) {
                    $name = $n['name'] ?? $row['Web Item Name'] ?? $row['Item Name'] ?? $row['Description'] ?? 'No Name';
                    $product->set_name((string) $name);
                    $desc = $n['description'] ?? $row['Web Item Description'] ?? '';
                    if (is_string($desc) && trim($desc) !== '') {
                        $product->set_short_description(wp_kses_post($desc));
                    }
                }

                $dealer_price = $n['price'] ?? $row['Price'] ?? '';
                if ($dealer_price !== '' && $dealer_price !== null) {
                    $product->update_meta_data('_chattanooga_dealer_price', (string) $dealer_price);
                }

                if ($cat_key !== '') {
                    $product->update_meta_data('_category_key', (string) $cat_key);
                }
                $product->update_meta_data('_msrp', (string) (is_scalar($msrp_raw) ? $msrp_raw : ''));
                $product->update_meta_data('_map', (string) (is_scalar($map_raw) ? $map_raw : ''));

                $brand = $n['brand'] ?? $row['Manufacturer'] ?? '';
                $brand = is_string($brand) ? trim($brand) : '';
                if ($brand !== '') {
                    $product->update_meta_data('_manufacturer', $brand);
                }

                $product->update_meta_data('_chattanooga_image_url', $image_url);

                $product->set_manage_stock(true);
                $product->set_stock_quantity($desired_stock_qty);
                if ($desired_stock_qty > 0) {
                    $product->set_stock_status('instock');
                } else {
                    $product->set_stock_status('outofstock');
                }

                if ($sellable) {
                    $product->set_regular_price((string) $list_price);
                    $product->set_sale_price('');
                    $product->set_price((string) $list_price);
                    $product->set_status('publish');
                    $product->set_catalog_visibility('visible');
                    delete_post_meta($product->get_id(), '_mgw_nfa_hold');
                } else {
                    $product->set_regular_price('');
                    $product->set_sale_price('');
                    $product->set_price('');
                    $product->set_status('draft');
                    $product->set_catalog_visibility('hidden');
                }

                $upc = isset($n['upc']) ? trim((string) $n['upc']) : '';
                if ($upc === '' && !empty($row['UPC'])) {
                    $upc = trim((string) $row['UPC']);
                }
                if ($upc !== '' && method_exists($product, 'set_global_unique_id')) {
                    $upc_value = sanitize_text_field($upc);
                    try {
                        $product->set_global_unique_id($upc_value);
                    } catch (Throwable $t) {
                        // Duplicate/invalid GTIN should not stop the whole sync batch.
                        $product->delete_meta_data('_global_unique_id');
                        $product->update_meta_data('_mgw_gtin_conflict', $upc_value);
                        $product->update_meta_data('_mgw_gtin_conflict_message', substr($t->getMessage(), 0, 255));
                        error_log(sprintf('[MGW Chattanooga Sync] GTIN conflict for SKU %s (UPC %s): %s', $sku, $upc_value, $t->getMessage()));
                    }
                }

                $before_id = $product->get_id();
                try {
                    $product->save();
                } catch (Throwable $t) {
                    $msg = (string) $t->getMessage();
                    if (stripos($msg, 'Invalid or duplicated GTIN') !== false || stripos($msg, 'duplicated GTIN') !== false) {
                        // Some stores enforce unique GTIN globally; skip GTIN and keep syncing.
                        if (method_exists($product, 'set_global_unique_id')) {
                            try {
                                $product->set_global_unique_id('');
                            } catch (Throwable $ignore) {
                                // no-op
                            }
                        }
                        $product->delete_meta_data('_global_unique_id');
                        $product->update_meta_data('_mgw_gtin_conflict_message', substr($msg, 0, 255));
                        try {
                            $product->save();
                            error_log(sprintf('[MGW Chattanooga Sync] Retried save without GTIN for SKU %s: %s', $sku, $msg));
                        } catch (Throwable $retryError) {
                            $skipped_saves++;
                            update_option('mgw_chattanooga_batch_offset', $row_no);
                            $last_row = $row_no;
                            $batch_processed++;
                            error_log(sprintf('[MGW Chattanooga Sync] Save failed for SKU %s even after GTIN reset: %s', $sku, $retryError->getMessage()));
                            continue;
                        }
                    } else {
                        throw $t;
                    }
                }
                $pid = $product->get_id();
                if ($pid && $sellable) {
                    $this->maybe_set_featured_image_from_feed($pid, $image_url, $sku);
                }

                if (!$before_id && $pid) {
                    $created++;
                } elseif ($before_id) {
                    $updated++;
                }

                $this->assign_product_categories($pid, $parent_slug, $sub_slug);

                $product = wc_get_product($pid);
                if ($product && $sellable) {
                    $this->apply_chattanooga_filter_attributes($product, $n, $row, $parent_slug);
                }

                update_option('mgw_chattanooga_batch_offset', $row_no);
                $last_row = $row_no;
                $batch_processed++;

                if ($batch_processed % 10 === 0) {
                    wp_cache_flush();
                    if (defined('WP_CLI') && WP_CLI) {
                        WP_CLI::log("Processed $batch_processed/$batch_size...");
                    }
                }
            }

            $end_reached = feof($fh);
            fclose($fh);

            if ($end_reached) {
                update_option('mgw_chattanooga_batch_offset', 0);
                $log[] = 'End of catalog feed reached; offset reset. Next sync will fetch a fresh feed from the API.';
            }

            wp_cache_flush();
            gc_collect_cycles();

            // If we stopped because we hit the batch limit, pause before next batch.
            if ($batch_processed >= $batch_size && !$end_reached) {
                sleep(5);
            }

            $log[] = "Batch Done. Processed rows up to row $last_row. Created: $created, Updated: $updated. (Published = MSRP or MAP, valid image URL, not NFA.)";
            $status = implode("\n", $log);
            update_option(self::OPTION_LAST_SYNC, current_time('mysql'));
            update_option(self::OPTION_LAST_STATUS, $status);

            if (defined('WP_CLI') && WP_CLI) {
                WP_CLI::success("Processed up to row $last_row (offset=$offset). Created=$created Updated=$updated");
            }

            return [
                'message' => "Synced up to row $last_row",
                'created' => $created,
                'updated' => $updated,
                'skipped_saves' => $skipped_saves,
            ];
        } catch (Exception $e) {
            $error_msg = 'Error: ' . $e->getMessage();
            update_option(self::OPTION_LAST_STATUS, $error_msg);
            if (defined('WP_CLI') && WP_CLI) {
                WP_CLI::error($error_msg);
            }
            return ['message' => $e->getMessage(), 'created' => $created, 'updated' => $updated];
        } finally {
            unset($GLOBALS['mgw_chattanooga_sync_import']);
        }
    }

    /**
     * Update post meta only when value actually changes (reduces DB churn).
     */
    private function maybe_update_post_meta_if_changed($post_id, $meta_key, $meta_value) {
        $post_id = (int) $post_id;
        $meta_key = (string) $meta_key;
        $meta_value = (string) $meta_value;

        $current = get_post_meta($post_id, $meta_key, true);
        $current = is_string($current) ? $current : (string) $current;

        if ($current !== $meta_value) {
            update_post_meta($post_id, $meta_key, $meta_value);
        }
    }

    /**
     * Absolute path to CSV for this sync run.
     * - Default: Chattanooga REST /items/product-feed → signed CSV URL (same source as their API; no manual export).
     * - Mid-batch: reuse cached file until EOF.
     * - Override: define MGW_CHATTANOOGA_LEGACY_CSV_PATH to a readable file (e.g. /tmp/chattanooga_data.csv).
     *
     * @param array $log Log lines (by ref).
     */
    private function resolve_csv_path_for_sync(array &$log) {
        if (defined('MGW_CHATTANOOGA_LEGACY_CSV_PATH') && is_string(MGW_CHATTANOOGA_LEGACY_CSV_PATH) && MGW_CHATTANOOGA_LEGACY_CSV_PATH !== '') {
            $legacy = MGW_CHATTANOOGA_LEGACY_CSV_PATH;
            if (is_readable($legacy)) {
                $log[] = 'Using legacy CSV (MGW_CHATTANOOGA_LEGACY_CSV_PATH): ' . $legacy;
                return $legacy;
            }
            $log[] = 'Warning: MGW_CHATTANOOGA_LEGACY_CSV_PATH set but not readable; using API feed instead.';
        }

        $offset = (int) get_option('mgw_chattanooga_batch_offset', 0);
        $cached = get_option('mgw_chattanooga_feed_cache_file', '');
        if ($offset > 0) {
            if ($cached && is_readable($cached)) {
                $log[] = 'Continuing batch using cached API feed: ' . basename($cached);
                return $cached;
            }
            update_option('mgw_chattanooga_batch_offset', 0);
            $log[] = 'Cached feed missing; offset reset. Fetching new feed from API.';
        }

        $path = $this->download_product_feed_csv_from_api();
        update_option('mgw_chattanooga_feed_cache_file', $path);
        update_option('mgw_chattanooga_feed_fetched_at', current_time('mysql'));
        $log[] = 'Loaded product catalog from Chattanooga API (/items/product-feed) → ' . basename($path);

        return $path;
    }

    /**
     * GET /items/product-feed → JSON with temporary CSV URL; download to uploads cache.
     *
     * @return string Absolute path to CSV
     */
    private function download_product_feed_csv_from_api() {
        require_once ABSPATH . 'wp-admin/includes/file.php';

        $sid = get_option(self::OPTION_SID, '');
        $token = get_option(self::OPTION_TOKEN, '');
        if ($sid === '' || $token === '') {
            throw new Exception('Chattanooga API SID and Token are required (Settings → Chattanooga Sync). Cannot download product feed.');
        }

        $data = $this->fetch_api('/items/product-feed');
        $url  = $this->extract_product_feed_csv_url($data);

        if ($url === '' || !filter_var($url, FILTER_VALIDATE_URL)) {
            throw new Exception('Chattanooga API returned no product feed URL. Response keys: ' . implode(', ', array_keys(is_array($data) ? $data : [])) . '. Check developer portal for schema changes.');
        }

        $dir = WP_CONTENT_DIR . '/uploads/mgw-chattanooga-cache';
        if (!wp_mkdir_p($dir)) {
            throw new Exception('Could not create directory: ' . $dir);
        }

        $tmp = download_url($url, 600);
        if (is_wp_error($tmp)) {
            throw new Exception('Downloading product feed CSV failed: ' . $tmp->get_error_message());
        }

        $stamp = gmdate('Ymd-His');
        $dated = $dir . '/product-feed-' . $stamp . '.csv';
        $latest = $dir . '/product-feed-latest.csv';

        if (!@rename($tmp, $dated)) {
            if (!copy($tmp, $dated)) {
                @unlink($tmp);
                throw new Exception('Could not save downloaded feed to ' . $dated);
            }
            @unlink($tmp);
        }

        if (file_exists($latest)) {
            @unlink($latest);
        }
        if (!copy($dated, $latest)) {
            @unlink($dated);
            throw new Exception('Could not write ' . $latest);
        }

        return $latest;
    }

    /**
     * Locate CSV download URL in various API payload shapes.
     *
     * @param array|mixed $data Decoded JSON
     */
    private function extract_product_feed_csv_url($data) {
        if (!is_array($data)) {
            return '';
        }
        $nested = isset($data['data']) && is_array($data['data']) ? $data['data'] : [];
        $candidates = [
            isset($data['product_feed']['url']) ? $data['product_feed']['url'] : null,
            isset($data['productFeed']['url']) ? $data['productFeed']['url'] : null,
            isset($nested['product_feed']['url']) ? $nested['product_feed']['url'] : null,
            isset($nested['productFeed']['url']) ? $nested['productFeed']['url'] : null,
            isset($data['url']) ? $data['url'] : null,
            isset($data['feed_url']) ? $data['feed_url'] : null,
            isset($data['product_feed_url']) ? $data['product_feed_url'] : null,
        ];
        foreach ($candidates as $u) {
            if (is_string($u) && trim($u) !== '') {
                return trim($u);
            }
        }
        return '';
    }

    private function fetch_api($endpoint) {
        $sid = get_option(self::OPTION_SID, '');
        $token = get_option(self::OPTION_TOKEN, '');
        $token_hash = md5($token);
        $auth = 'Basic ' . $sid . ':' . $token_hash;

        $url = self::API_BASE . $endpoint;
        $resp = wp_remote_get($url, [
            'headers' => [
                'Authorization' => $auth,
                'Accept' => 'application/json',
            ],
            'timeout' => 120,
        ]);

        if (is_wp_error($resp)) {
            throw new Exception($resp->get_error_message());
        }
        $code = wp_remote_retrieve_response_code($resp);
        $body = wp_remote_retrieve_body($resp);
        if ($code < 200 || $code >= 300) {
            $snippet = strlen($body) > 600 ? substr($body, 0, 600) . '…' : $body;
            throw new Exception('Chattanooga API HTTP ' . $code . '. Check SID/token. Body: ' . $snippet);
        }
        $data = json_decode($body, true);
        if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON from Chattanooga API: ' . json_last_error_msg());
        }
        if (!is_array($data)) {
            throw new Exception('Chattanooga API returned non-object JSON for ' . $endpoint);
        }
        return $data;
    }

    private function download_url($url) {
        $resp = wp_remote_get($url, ['timeout' => 120, 'redirection' => 5]);
        if (is_wp_error($resp)) {
            return '';
        }
        if (wp_remote_retrieve_response_code($resp) !== 200) {
            return '';
        }
        return wp_remote_retrieve_body($resp);
    }

    private function parse_csv($content) {
        $rows = [];
        $lines = preg_split('/\r\n|\r|\n/', $content);
        if (empty($lines)) return $rows;
        $headers = str_getcsv(array_shift($lines));
        foreach ($lines as $line) {
            if (trim($line) === '') continue;
            $values = str_getcsv($line);
            $row = [];
            foreach ($headers as $i => $h) {
                $row[$h] = $values[$i] ?? '';
            }
            $rows[] = $row;
        }
        return $rows;
    }

    /**
     * Extract caliber from product name (ammo/magazines - matches static site shop-products-ui.js)
     */
    private function extract_caliber($name) {
        $patterns = [
            '.22 LR', '.22 Magnum', '.38 Special', '.357 Magnum', '.40 S&W', '.45 ACP',
            '9mm', '10mm', '.223', '.224', '.243', '.270', '.308', '.30-06', '.300 Win Mag',
            '.300 BLK', '.300 Blackout', '5.56', '5.56 NATO', '7.62x39', '7.62x54', '12 Gauge', '20 Gauge',
            '410', '.45-70', '6.5 Creedmoor', '6mm ARC', '7.62 NATO',
        ];
        if (!$name) return '';
        $u = strtoupper($name);
        foreach ($patterns as $p) {
            if (stripos($u, $p) !== false) return $p;
        }
        return '';
    }

    /**
     * Extract bullet type from product name (ammunition)
     */
    private function extract_bullet_type($name) {
        $map = [
            'FMJ' => ['FMJ', 'Full Metal Jacket'],
            'JHP' => ['JHP', 'Jacketed Hollow Point'],
            'HP' => ['Hollow Point', ' HP'],
            'Soft Point' => ['Soft Point', 'SP'],
            'BTHP' => ['BTHP', 'Boat Tail'],
            'Round Nose' => ['Round Nose', 'LRN'],
            'Buckshot' => ['Buck', 'Buckshot'],
            'Slug' => ['Slug'],
        ];
        if (!$name) return '';
        $u = strtoupper($name);
        foreach ($map as $type => $patterns) {
            foreach ($patterns as $p) {
                if (stripos($u, $p) !== false) return $type;
            }
        }
        return '';
    }

    /**
     * Extract grain weight from product name (ammunition)
     */
    private function extract_grain_weight($name) {
        if (!preg_match('/(\d+)\s*(?:gr|grain)/i', $name ?? '', $m)) return '';
        return $m[1] . 'gr';
    }

    /**
     * Extract capacity from product name (magazines)
     */
    private function extract_capacity($name) {
        if (!preg_match('/(\d+)\s*(?:rd|rds|round|rounds|capacity|\/)/i', $name ?? '', $m)) return '';
        return $m[1] . ' rd';
    }

    /**
     * Extract round count from product name (ammunition)
     * Matches: 50/ct, 20 rounds, 500 Rounds, 225 rounds, 20RD, 30/rd, etc.
     */
    private function extract_round_count($name) {
        if (!$name) return 0;
        if (preg_match('/(\d+)\s*(?:rd|rds|round|rounds)\s*(?:\/|$)/i', $name, $m)) return (int) $m[1];
        if (preg_match('/(\d+)\s*RD\b/i', $name, $m)) return (int) $m[1];
        if (preg_match('/(\d+)\s*\/\s*(?:ct|rd|box)/i', $name, $m)) return (int) $m[1];
        if (preg_match('/\b(\d+)\s*\/\s*ct\b/i', $name, $m)) return (int) $m[1];
        if (preg_match('/\((\d+)\s*round/i', $name, $m)) return (int) $m[1];
        return 0;
    }

    /**
     * Extract steel case from product name
     */
    private function extract_steel_case($name) {
        if (!$name) return '';
        if (preg_match('/steel\s*(?:case|cased|cased)?/i', $name)) return 'Yes';
        return '';
    }

    /**
     * Extract subsonic from product name
     */
    private function extract_subsonic($name) {
        if (!$name) return '';
        if (preg_match('/subsonic/i', $name)) return 'Yes';
        return '';
    }

    /**
     * Set ammunition attributes: caliber, bullet_type, grain_weight, round_count, steel_case, subsonic
     */
    private function set_ammo_attributes($product, $name) {
        $caliber = $this->extract_caliber($name);
        $bullet = $this->extract_bullet_type($name);
        $grain = $this->extract_grain_weight($name);
        $steel = $this->extract_steel_case($name);
        $subsonic = $this->extract_subsonic($name);
        $rounds = $this->extract_round_count($name);

        foreach (['caliber' => $caliber, 'bullet_type' => $bullet, 'grain_weight' => $grain, 'steel_case' => $steel, 'subsonic' => $subsonic] as $slug => $val) {
            if ($val) $this->set_product_attribute_term($product, 'pa_' . $slug, $val);
        }
        if ($rounds > 0) {
            $product->update_meta_data('_round_count', $rounds);
            $price = (float) $product->get_price();
            if ($price > 0) {
                $product->update_meta_data('_price_per_round', round($price / $rounds, 4));
            }
        }
    }

    /**
     * Set magazine attributes: caliber, capacity
     */
    private function set_magazine_attributes($product, $name) {
        $caliber = $this->extract_caliber($name);
        $capacity = $this->extract_capacity($name);
        if ($caliber) $this->set_product_attribute_term($product, 'pa_caliber', $caliber);
        if ($capacity) $this->set_product_attribute_term($product, 'pa_capacity', $capacity);
    }

    /**
     * Ensure taxonomy exists and set term for product
     */
    private function set_product_attribute_term($product, $attr_name, $value) {
        if (!$value || !$product || !is_a($product, 'WC_Product')) return;
        $slug = sanitize_title($value);
        if (!$slug) return;
        if (!taxonomy_exists($attr_name)) {
            $nice = ucwords(str_replace(['pa_', '_'], ['', ' '], $attr_name));
            wc_create_attribute(['name' => $nice, 'slug' => str_replace('pa_', '', $attr_name), 'has_archives' => false]);
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

    /**
     * Set brand as product attribute for filtering (pa_brand)
     */
    private function set_product_brand_attribute($product, $brand) {
        if (!$brand || !$product || !is_a($product, 'WC_Product')) return;
        $attr_name = 'pa_brand';
        if (!taxonomy_exists($attr_name)) {
            wc_create_attribute(['name' => 'Brand', 'slug' => 'brand', 'has_archives' => true]);
            register_taxonomy($attr_name, 'product', [
                'labels' => ['name' => 'Brand'],
                'hierarchical' => false,
                'show_ui' => false,
                'query_var' => true,
                'rewrite' => false,
            ]);
        }
        $slug = sanitize_title($brand);
        if (!$slug) return;
        $term = get_term_by('slug', $slug, $attr_name);
        if (!$term) {
            wp_insert_term($brand, $attr_name, ['slug' => $slug]);
            $term = get_term_by('slug', $slug, $attr_name);
        }
        if ($term && !is_wp_error($term)) {
            wp_set_object_terms($product->get_id(), [(int) $term->term_id], $attr_name);
        }
    }

    private function maybe_set_featured_image_from_feed($product_id, $image_url, $sku = '') {
        if ((int) $product_id <= 0 || !is_string($image_url) || trim($image_url) === '') {
            return;
        }
        try {
            $this->set_product_image((int) $product_id, trim($image_url));
        } catch (Throwable $e) {
            $sku = is_string($sku) ? trim($sku) : '';
            if ($sku !== '') {
                error_log(sprintf('[MGW Chattanooga Sync] Failed to sideload featured image for SKU %s (%d): %s', $sku, (int) $product_id, $e->getMessage()));
            } else {
                error_log(sprintf('[MGW Chattanooga Sync] Failed to sideload featured image for product %d: %s', (int) $product_id, $e->getMessage()));
            }
        }
    }

    /**
     * Sideload featured image with retries. Theme can still use _chattanooga_image_url if this fails.
     */
    private function set_product_image($product_id, $image_url) {
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $product_id = (int) $product_id;
        $image_url  = trim((string) $image_url);
        $max_tries  = 3;
        $timeout    = 90;
        $last_error = '';

        for ($attempt = 1; $attempt <= $max_tries; $attempt++) {
            $tmp = download_url($image_url, $timeout);
            if (is_wp_error($tmp)) {
                $last_error = 'download_url failed: ' . $tmp->get_error_message();
                if ($attempt < $max_tries) {
                    sleep(min(2 * $attempt, 5));
                }
                continue;
            }

            $filesize = @filesize($tmp);
            if ($filesize === false || $filesize < 100) {
                @unlink($tmp);
                $last_error = 'downloaded image empty or too small (' . (is_int($filesize) ? (string) $filesize : 'unknown') . ' bytes)';
                if ($attempt < $max_tries) {
                    sleep(min(2 * $attempt, 5));
                }
                continue;
            }

            $file_array = [
                'name'     => basename((string) parse_url($image_url, PHP_URL_PATH)) ?: 'product.jpg',
                'tmp_name' => $tmp,
            ];
            $attach_id = media_handle_sideload($file_array, $product_id);
            if (is_wp_error($attach_id)) {
                @unlink($tmp);
                $last_error = 'media_handle_sideload failed: ' . $attach_id->get_error_message();
                if ($attempt < $max_tries) {
                    sleep(min(2 * $attempt, 5));
                }
                continue;
            }

            set_post_thumbnail($product_id, (int) $attach_id);
            return;
        }

        throw new Exception($last_error !== '' ? $last_error : 'set_product_image failed with no detail');
    }

}
