#!/bin/bash
# Run this script from SSH on your Lightsail/Bitnami instance
# Usage: bash setup-on-lightsail.sh

WP="/opt/bitnami/wordpress"
PLUGINS="$WP/wp-content/plugins"

# Get the directory where this script lives (so we can find the files)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SOURCE_PLUGIN="$SCRIPT_DIR/plugins/mgw-crypto-polyfill"
SOURCE_FIX="$SCRIPT_DIR/mgw-run-once-fix.php"

echo "Installing MGW Cart/Checkout fix..."

# Create plugin directory
mkdir -p "$PLUGINS/mgw-crypto-polyfill"

# Copy plugin (if we're running from the project directory)
if [ -f "$SOURCE_PLUGIN/mgw-crypto-polyfill.php" ]; then
    cp "$SOURCE_PLUGIN/mgw-crypto-polyfill.php" "$PLUGINS/mgw-crypto-polyfill/"
    echo "✓ Plugin copied"
else
    echo "✗ Plugin file not found at $SOURCE_PLUGIN/mgw-crypto-polyfill.php"
    echo "  Make sure you run this from the wordpress-package directory"
fi

# Copy fix script
if [ -f "$SOURCE_FIX" ]; then
    cp "$SOURCE_FIX" "$WP/"
    echo "✓ Fix script copied"
else
    echo "✗ Fix script not found at $SOURCE_FIX"
fi

echo ""
echo "Done! Next steps:"
echo "1. Log into WordPress admin"
echo "2. Visit: https://YOUR-DOMAIN.com/mgw-run-once-fix.php?key=mgw2024fix"
echo "3. Delete mgw-run-once-fix.php when done"
