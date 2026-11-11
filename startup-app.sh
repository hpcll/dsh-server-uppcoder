#!/bin/bash
# ds-harness-remote Server on Uppcoder
# Platform convention: listen on $APP_PORT (default 8000), bind 127.0.0.1.
# The container's nginx fronts it on 80; the gateway terminates HTTPS.
# NOTE: the app directory is NOT /app on this platform (it is the directory
# this script lives in, e.g. /home/uppcoder/app). Derive it from the script.
set -e
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

# Load account/password/public URL from .env if present.
# .env is created via the container terminal, NOT committed to git.
if [ -f "$APP_DIR/.env" ]; then
  set -a
  . "$APP_DIR/.env"
  set +a
fi

export DSH_SERVER_HOST=127.0.0.1
export DSH_SERVER_PORT=${APP_PORT:-8000}
export DSH_SERVER_DATA_FILE=${DSH_SERVER_DATA_FILE:-$APP_DIR/data/state.json}
mkdir -p "$(dirname "$DSH_SERVER_DATA_FILE")"

exec node dist/main.js
