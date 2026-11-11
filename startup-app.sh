#!/bin/bash
# ds-harness-remote Server on Uppcoder
# Platform convention: listen on $APP_PORT (default 8000), bind 127.0.0.1.
# The container's nginx fronts it on 80; the gateway terminates HTTPS.
set -e
cd /app

# Load account/password/public URL from /app/.env if present.
# .env is created via the container terminal, NOT committed to git.
if [ -f /app/.env ]; then
  set -a
  . /app/.env
  set +a
fi

export DSH_SERVER_HOST=127.0.0.1
export DSH_SERVER_PORT=${APP_PORT:-8000}
export DSH_SERVER_DATA_FILE=${DSH_SERVER_DATA_FILE:-/app/data/state.json}
mkdir -p "$(dirname "$DSH_SERVER_DATA_FILE")"

exec node dist/main.js
