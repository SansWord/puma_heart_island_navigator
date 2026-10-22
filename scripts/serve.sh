#!/bin/sh
# Serves the site locally and opens it in the browser. Ctrl-C to stop.
# Usage: scripts/serve.sh [port]   (default 8765)
set -e
cd "$(dirname "$0")/.."
PORT="${1:-8765}"
URL="http://127.0.0.1:$PORT/"

if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT is already in use; try: scripts/serve.sh $((PORT + 1))" >&2
  exit 1
fi

echo "Serving $URL  (Ctrl-C to stop)"
( sleep 1; open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || true ) &
exec python3 -m http.server "$PORT" --bind 127.0.0.1
