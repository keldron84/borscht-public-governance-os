#!/usr/bin/env bash
# Build the UI (if needed) and serve API + SPA on one port.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

UI="$ROOT/apps/ui"
PORT="${BORSCHT_PORT:-8799}"
HOST="${BORSCHT_HOST:-127.0.0.1}"
CURSOR_NODE="/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node"

if command -v lsof >/dev/null 2>&1; then
  OLD_PIDS="$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -n "$OLD_PIDS" ]]; then
    echo "borscht: stopping existing listener(s) on :${PORT}…"
    kill $OLD_PIDS 2>/dev/null || true
    sleep 1
  fi
fi

if [[ ! -d "$UI/node_modules" ]]; then
  echo "borscht: installing UI deps…"
  if command -v npm >/dev/null 2>&1; then
    (cd "$UI" && npm install)
  else
    echo "borscht: npm not in PATH — run: cd apps/ui && npm install" >&2
  fi
fi

if [[ ! -d "$UI/dist" ]] || [[ "${BORSCHT_FORCE_BUILD:-0}" == "1" ]]; then
  echo "borscht: building UI…"
  if command -v npm >/dev/null 2>&1; then
    (cd "$UI" && npm run build)
  elif [[ -x "$CURSOR_NODE" && -f "$UI/node_modules/vite/bin/vite.js" ]]; then
    (cd "$UI" && "$CURSOR_NODE" node_modules/vite/bin/vite.js build)
  else
    echo "borscht: cannot build UI (need npm or Cursor node + vite). API will still serve." >&2
  fi
fi

echo "borscht: http://${HOST}:${PORT}/"
exec python3 apps/api/server.py --host "$HOST" --port "$PORT"
