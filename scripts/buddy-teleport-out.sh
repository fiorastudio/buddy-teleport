#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
BUDDY_SERVER_DIR="${BUDDY_SERVER_DIR:-/Users/Sandbox_Jwu/.buddy/server}"
BUDDY_ENTRY="${BUDDY_ENTRY:-$BUDDY_SERVER_DIR/dist/server/index.js}"
WRAPPER_DIR="${TMPDIR:-/tmp}/buddy-teleport"
WRAPPER="$WRAPPER_DIR/buddy-sidecar"

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

echo "Teleporting terminal Buddy into desktop via $BUDDY_ENTRY"
echo "Using Buddy DB: ${BUDDY_DB_PATH:-$HOME/.buddy/buddy.db}"

cd "$WORKSPACE/buddy-desktop"
BUDDY_SIDECAR_PATH="$WRAPPER" pnpm tauri dev
