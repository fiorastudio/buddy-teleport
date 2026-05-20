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
├── buddy-desktop/    # MIT-licensed Tauri v2 app (the main deliverable)
├── buddy/            # optional ignored fallback checkout of fiorastudio/buddy
├── scripts/
│   ├── buddy-teleport-out.sh    # launches desktop teleport from terminal Buddy
│   └── build-buddy-sidecar.sh   # compiles Buddy into a pkg binary for release sidecar
├── docs/
│   └── superpowers/
│       ├── specs/2026-05-18-buddy-openhuman-integration-design.md  # approved design
│       └── plans/2026-05-20-buddy-desktop-completion-audit.md      # current verification audit
└── CLAUDE.md
```

## Licensing

- `buddy-desktop/` is **MIT licensed** — keep it that way.
- openhuman is GPL-3.0. We implement the mascot window from scratch using objc2 (same Rust crate openhuman uses), but write the code independently. Never copy openhuman source files.
- buddy is MIT. No source changes are made to buddy in this repository. Development defaults to the installed Buddy source at `$HOME/.buddy/server`; an ignored workspace-local `buddy/` checkout is only a fallback for sidecar builds.

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
- `commands.rs` — Tauri commands for frontend interactions, safe Buddy tools, and teleport back
- `mascot_state.rs` — BuddyMcpState, AnimationState, state merge logic
- `ble.rs` — BLE Nordic UART peripheral and permission-prompt handling
- `tray.rs` — menu bar tray and status popup routing
- `mascot_window.rs` — separate desktop mascot window creation

The React frontend in `buddy-desktop/src/` renders `BuddyMascot` when `?window=mascot&companion=buddy`.

## Implementation Status

- **Terminal Buddy teleport** (MCP sidecar → desktop mascot): implemented and covered by unit, smoke, and live isolated-tool tests.
- **Desktop back to terminal**: implemented through the **Return** action, which records `buddy_observe` and stops desktop polling until the next teleport-out.
- **Buddy identity rendering**: implemented from terminal `buddy_status`; the desktop app renders the terminal Buddy's name, level, XP, stats, species/rarity, personality, and parsed ASCII body instead of hatching a random desktop-only Buddy.
- **BLE companion protocol**: implementation and permission prompt paths exist, but real Claude Desktop pairing remains a manual verification gate.

See `docs/superpowers/plans/2026-05-20-buddy-desktop-completion-audit.md` for the current requirement-by-requirement verification state.

## Working in buddy-desktop (Tauri v2)

```bash
cd buddy-desktop
pnpm install
pnpm tauri dev        # dev mode; falls back to $HOME/.buddy/server if no debug sidecar exists
pnpm tauri build      # production build
```

Rust workspace: `buddy-desktop/src-tauri/Cargo.toml`. Run `cargo build` from there for Rust only.

## Working With Buddy Source

```bash
cd "$HOME/.buddy/server"
npm run build         # tsc compile -> dist/
npm test              # vitest, if dependencies are installed
```

Use the installed Buddy source at `$HOME/.buddy/server` by default. Do not clone Buddy into this repository unless a task explicitly needs the ignored fallback checkout.

## Building the sidecar binary

```bash
./scripts/build-buddy-sidecar.sh
# outputs: buddy-desktop/src-tauri/binaries/buddy-server-aarch64-apple-darwin
```

The builder prefers `$HOME/.buddy/server`, falls back to `./buddy`, and accepts `BUDDY_DIR=/path/to/buddy/server` for explicit source selection. Requires `pkg` installed globally (`npm install -g @vercel/pkg`). The binary is gitignored; rebuild it whenever Buddy's source changes.

## Teleport Checks

```bash
./scripts/buddy-teleport-out.sh
cd buddy-desktop
npm test
npm run smoke:teleport-tools
npm run smoke:teleport-runtime
```

The Claude slash command artifact `.claude/commands/buddy-teleport.md` invokes the same repo-relative teleport launcher.

## Key Protocol Reference: claude-desktop-buddy BLE

The mascot app advertises Nordic UART Service (`6e400001-b5a3-f393-e0a9-e50e24dcca9e`) as a BLE peripheral. Claude Desktop connects and sends JSON heartbeat snapshots (sessions running/waiting, token counts, permission prompts). The app responds to permission decisions. Full protocol in `docs/superpowers/specs/2026-05-18-buddy-openhuman-integration-design.md`.
