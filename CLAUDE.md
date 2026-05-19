# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace Overview

This workspace builds **buddy-desktop**: a native macOS floating mascot window that brings the `fiorastudio/buddy` virtual pet companion out of the terminal and onto the desktop. It also implements the `anthropics/claude-desktop-buddy` BLE protocol so Claude Desktop session state drives the mascot's animations.

**Upstream repos (reference only — do not copy GPL code):**
- [`tinyhumansai/openhuman`](https://github.com/tinyhumansai/openhuman) — **GPL-3.0. Do NOT fork or copy.** Used as design reference only for the NSPanel + WKWebView floating window pattern.
- [`fiorastudio/buddy`](https://github.com/fiorastudio/buddy) — MCP server (TypeScript/Node.js, SQLite, MIT). The companion being brought to desktop.
- [`anthropics/claude-desktop-buddy`](https://github.com/anthropics/claude-desktop-buddy) — BLE wire protocol reference for Claude Desktop session state.

## Directory Structure

```
buddy_openhuman_teleport/
├── buddy-desktop/    # NEW MIT-licensed Tauri v2 app (the main deliverable)
├── buddy/            # clone of fiorastudio/buddy — read-only, never modified
├── scripts/
│   └── build-buddy-sidecar.sh   # compiles buddy into pkg binary for sidecar
├── docs/
│   └── superpowers/
│       ├── specs/2026-05-18-buddy-openhuman-integration-design.md  # approved design
│       └── plans/2026-05-18-buddy-desktop-plan-a-mcp-sidecar.md    # 12-task impl plan
└── CLAUDE.md
```

## Licensing

- `buddy-desktop/` is **MIT licensed** — keep it that way.
- openhuman is GPL-3.0. We implement the mascot window from scratch using objc2 (same Rust crate openhuman uses), but write the code independently. Never copy openhuman source files.
- buddy is MIT. No source changes are made to buddy — it's compiled into a sidecar binary using `pkg`.

## Architecture (approved design)

Two data sources feed a unified mascot state machine:

| Source | Protocol | Plan |
|---|---|---|
| fiorastudio/buddy sidecar | stdio JSON-RPC (MCP), polled every 2s | Plan A |
| Claude Desktop | BLE Nordic UART (claude-desktop-buddy protocol) | Plan B |

**State machine (7 states):** `sleep / idle / busy / attention / celebrate / dizzy / heart`

The Rust backend in `buddy-desktop/src-tauri/` owns:
- `mascot_window.rs` — NSPanel + WKWebView floating window (macOS); frameless Tauri window (other platforms)
- `buddy_sidecar.rs` — spawn/kill buddy, stdio JSON-RPC framing
- `buddy_client.rs` — MCP client + stat card parser
- `buddy_poll.rs` — 2s polling loop, emits `mascot-state-updated` Tauri event
- `buddy_commands.rs` — Tauri commands for frontend interactions
- `mascot_state.rs` — BuddyMcpState, AnimationState, state merge logic
- `ble_companion.rs` — BLE Nordic UART peripheral (Plan B)

The React frontend in `buddy-desktop/src/` renders `BuddyMascot` when `?window=mascot&companion=buddy`.

## Implementation Status

- **Plan A** (MCP sidecar → mascot window): 12 tasks, fully written, ready to execute.
- **Plan B** (BLE companion + permission overlay + GIF character packs): spec written, plan not yet written.

See `docs/superpowers/plans/2026-05-18-buddy-desktop-plan-a-mcp-sidecar.md` for the full Plan A task list with complete code.

## Working in buddy-desktop (Tauri v2)

```bash
cd buddy-desktop
pnpm install
pnpm tauri dev        # dev mode
pnpm tauri build      # production build
```

Rust workspace: `buddy-desktop/src-tauri/Cargo.toml`. Run `cargo build` from there for Rust only.

## Working in buddy (MCP server — read only)

```bash
cd buddy
npm install
npm run build         # tsc compile → dist/
npm test              # vitest
```

## Building the sidecar binary

```bash
./scripts/build-buddy-sidecar.sh
# outputs: buddy-desktop/src-tauri/binaries/buddy-server-aarch64-apple-darwin
```

Requires `pkg` installed globally (`npm install -g @vercel/pkg`). The binary is gitignored — rebuild it whenever buddy's source changes.

## Key Protocol Reference: claude-desktop-buddy BLE

The mascot app advertises Nordic UART Service (`6e400001-b5a3-f393-e0a9-e50e24dcca9e`) as a BLE peripheral. Claude Desktop connects and sends JSON heartbeat snapshots (sessions running/waiting, token counts, permission prompts). The app responds to permission decisions. Full protocol in `docs/superpowers/specs/2026-05-18-buddy-openhuman-integration-design.md`.
