#!/bin/sh
# Renders scripts/og-card.html to assets/og.png (1200x630) with headless Chrome, then stamps the
# image's hash into index.html's og:image (?v=<8 hex>) so platforms that cache by URL fetch the new one.
set -e
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1200,630 --virtual-time-budget=5000 \
  --screenshot="$PWD/assets/og.png" "file://$PWD/scripts/og-card.html"
V=$(shasum -a 256 assets/og.png | cut -c1-8)
perl -pi -e "s#assets/og\.png(\?v=[0-9a-f]*)?\"#assets/og.png?v=$V\"#" index.html
echo "og.sh: assets/og.png?v=$V"
