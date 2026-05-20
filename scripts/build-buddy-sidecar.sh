#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_BUDDY_DIR="$HOME/.buddy/server"
if [ ! -d "$DEFAULT_BUDDY_DIR" ]; then
  DEFAULT_BUDDY_DIR="$WORKSPACE/buddy"
fi
BUDDY_DIR="${BUDDY_DIR:-$DEFAULT_BUDDY_DIR}"
OUT_DIR="$WORKSPACE/buddy-desktop/src-tauri/binaries"

if [ ! -d "$BUDDY_DIR" ]; then
  echo "ERROR: Buddy source directory not found: $BUDDY_DIR"
  echo "Set BUDDY_DIR=/path/to/buddy or clone Buddy into $WORKSPACE/buddy."
  exit 1
fi

mkdir -p "$OUT_DIR"

cd "$BUDDY_DIR"
npm ci
npm run build

ENTRY="dist/server/index.js"
if [ ! -f "$ENTRY" ]; then
  ENTRY="dist/index.js"
fi
if [ ! -f "$ENTRY" ]; then
  echo "ERROR: cannot find compiled buddy entry. Check dist/ structure."
  exit 1
fi

case "$(uname -m)" in
  arm64|aarch64)
    PKG_TARGET="node18-macos-arm64"
    TAURI_TRIPLE="aarch64-apple-darwin"
    ;;
  x86_64|amd64)
    PKG_TARGET="node18-macos-x64"
    TAURI_TRIPLE="x86_64-apple-darwin"
    ;;
  *)
    echo "ERROR: unsupported architecture: $(uname -m)"
    exit 1
    ;;
esac

echo "Bundling $ENTRY from $BUDDY_DIR for $TAURI_TRIPLE..."
npx pkg "$ENTRY" \
  --target "$PKG_TARGET" \
  --output "$OUT_DIR/buddy-server-$TAURI_TRIPLE"

echo "Done: $OUT_DIR/buddy-server-$TAURI_TRIPLE"
