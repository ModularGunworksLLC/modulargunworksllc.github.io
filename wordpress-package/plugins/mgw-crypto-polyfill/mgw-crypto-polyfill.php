<?php
/**
 * Plugin Name: MGW Crypto randomUUID Polyfill
 * Description: Fixes "crypto.randomUUID is not a function" error.
 * Version: 1.0
 */
if (!defined('ABSPATH')) exit;
add_action('wp_head', 'mgw_crypto_polyfill_output', 0);
function mgw_crypto_polyfill_output() {
    ?>
    <script>
    (function(){
        try {
            if (typeof crypto !== 'undefined' && typeof window !== 'undefined') {
                var needs = !crypto.randomUUID || typeof crypto.randomUUID !== 'function';
                if (needs) {
                    var fn = function() {
                        if (crypto.getRandomValues) {
                            return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, function(c) {
                                return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
                            });
                        }
                        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                            return v.toString(16);
                        });
                    };
                    try { crypto.randomUUID = fn; } catch (e) {
                        try { Object.defineProperty(crypto, 'randomUUID', { value: fn, writable: true, configurable: true }); } catch (e2) {}
                    }
                }
            }
        } catch (e) {}
    })();
    </script>
    <?php
}
