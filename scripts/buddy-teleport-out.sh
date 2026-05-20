#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
BUDDY_SERVER_DIR="${BUDDY_SERVER_DIR:-$HOME/.buddy/server}"
BUDDY_ENTRY="${BUDDY_ENTRY:-$BUDDY_SERVER_DIR/dist/server/index.js}"
WRAPPER_DIR="${TMPDIR:-/tmp}/buddy-teleport"
WRAPPER="${BUDDY_SIDECAR_PATH:-$WRAPPER_DIR/buddy-sidecar}"

if [ -n "${BUDDY_SIDECAR_PATH:-}" ]; then
  if [ ! -x "$WRAPPER" ]; then
    echo "ERROR: Buddy sidecar override is not executable: $WRAPPER"
    exit 1
  fi
else
  if [ ! -f "$BUDDY_ENTRY" ]; then
    echo "ERROR: Buddy MCP entry not found: $BUDDY_ENTRY"
    echo "Set BUDDY_ENTRY=/path/to/dist/server/index.js"
    exit 1
  fi

  mkdir -p "$WRAPPER_DIR"
  cat > "$WRAPPER" <<EOF
#!/usr/bin/env bash
exec "$(command -v node)" "$BUDDY_ENTRY"
EOF
  chmod +x "$WRAPPER"
fi

echo "Teleporting terminal Buddy into desktop via $WRAPPER"
echo "Using Buddy DB: ${BUDDY_DB_PATH:-$HOME/.buddy/buddy.db}"

cd "$WORKSPACE/buddy-desktop"
BUDDY_WORKSPACE_CWD="${BUDDY_WORKSPACE_CWD:-$WORKSPACE}" BUDDY_SIDECAR_PATH="$WRAPPER" pnpm tauri dev
