#!/bin/bash
# Legacy helper — MGW plugins were removed from wordpress-package.
# Use: bash wordpress-package/scripts/deploy-greenfield-shell.sh <branch>
# Or copy themes manually from wordpress-package/modulargunworks-shell (and modulargunworks if needed).

set -euo pipefail
echo "This script no longer installs mgw-crypto-polyfill (removed from the package)."
echo "Deploy the theme with:"
echo "  bash wordpress-package/scripts/deploy-greenfield-shell.sh cursor/normalize-wp-plugin-native-97d8"
exit 1
