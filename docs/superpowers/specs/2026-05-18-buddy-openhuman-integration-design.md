# Buddy Desktop Integration Design

**Date:** 2026-05-18  
**Status:** Approved 2026-05-18  
**Scope:** Integrate fiorastudio/buddy MCP server + Anthropics/claude-desktop-buddy BLE protocol into a new MIT-licensed Tauri mascot app (openhuman used as design reference only — not forked, due to GPL-3.0)

---

## Problem Statement

`fiorastudio/buddy` lives entirely in the terminal — it only reacts when an AI client explicitly calls a tool. `anthropics/claude-desktop-buddy` gives Claude Desktop a hardware companion (ESP32) via BLE, but requires physical hardware. This design brings both systems into a single **native desktop mascot window** built on `tinyhumansai/openhuman` (Tauri), so buddy's virtual pet is always visible and reactive to real Claude activity — no hardware required.

---

## Chosen Approach: Sidecar + stdio MCP Polling + BLE Companion

Two data sources feed a unified mascot state:

| Source | Protocol | What it provides |
|---|---|---|
| fiorastudio/buddy sidecar | stdio JSON-RPC (MCP) | XP, level, personality stats, reactions |
| Claude Desktop | BLE Nordic UART (claude-desktop-buddy protocol) | Active sessions, permission prompts, token counts |

---

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│  Tauri App (new, MIT-licensed — openhuman as reference)    │
│                                                            │
│  ┌──────────────────────────────┐   Tauri events           │
│  │        Rust Backend          │ ─────────────────► React  │
│  │                              │                   Mascot  │
│  │  buddy_sidecar.rs            │ ◄───────────────── Window │
│  │  buddy_client.rs  (MCP)      │   Tauri commands          │
│  │  buddy_poll.rs    (2s timer) │                           │
│  │  buddy_commands.rs           │                           │
│  │                              │                           │
│  │  ble_companion.rs (BLE)      │                           │
│  │  mascot_state.rs  (merge)    │                           │
│  └──────────┬───────────────────┘                           │
│             │                                               │
└─────────────┼─────────────────────────────────────────────┘
              │ stdin/stdout (JSON-RPC)
     ┌────────▼─────────┐
     │  buddy sidecar   │  (Node.js, unchanged)
     │  MCP stdio server│
     │  ~/.buddy/buddy.db│
     └──────────────────┘

              ╔══════════════════╗
              ║  BLE (macOS)     ║
              ║  Nordic UART     ║
              ╚════════╤═════════╝
                       │
              ┌────────▼─────────┐
              │  Claude Desktop  │  (sends heartbeat snapshots)
              └──────────────────┘
```

The Rust backend has two independent subsystems that both write into `mascot_state.rs`, which owns the merged state and emits Tauri events to the frontend.

---

## Data Sources

### 1. fiorastudio/buddy (MCP Sidecar)

Buddy runs as a Tauri sidecar (via `tauri-plugin-shell`). The Rust backend is an MCP client:

- On startup: sends `initialize` + `initialized` JSON-RPC handshake
- Every 2 seconds: calls `buddy_status` → parses response into `BuddyMcpState`
- On user interaction: calls `buddy_pet`, `buddy_dream`, etc. via Tauri commands
- Sidecar crash → exponential backoff restart (1s, 2s, 4s, max 30s)

`BuddyMcpState` fields:
```rust
struct BuddyMcpState {
    name: String,
    level: u32,
    xp: u32,
    xp_to_next: u32,
    stats: BuddyStats,   // debugging, patience, chaos, wisdom, snark
    rarity: String,
    species: String,
    ascii_art: Vec<String>,
    personality: String,
    last_reaction: Option<String>,
}
```

### 2. Claude Desktop BLE (claude-desktop-buddy protocol)

The Tauri app advertises itself as a Nordic UART Service peripheral on macOS via `btleplug`. Claude Desktop connects and sends heartbeat snapshots exactly as it would to the physical ESP32 device.

BLE UUID constants (from REFERENCE.md):
- Service: `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
- RX characteristic: `6e400002-...` (Desktop writes to this)
- TX characteristic: `6e400003-...` (App notifies on this)

`BleSessionState` fields:
```rust
struct BleSessionState {
    connected: bool,
    sessions_total: u32,
    sessions_running: u32,
    sessions_waiting: u32,
    msg: String,
    entries: Vec<String>,
    tokens_today: u64,
    pending_prompt: Option<PendingPrompt>,
    last_heartbeat: Instant,
}

struct PendingPrompt {
    id: String,
    tool: String,
    hint: String,
}
```

When a `prompt` is present in the heartbeat, the frontend shows an approve/deny UI. Approval sends `{"cmd":"permission","id":"...","decision":"once"}` back via BLE TX.

---

## Unified Mascot State Machine

`mascot_state.rs` merges both sources into a single `MascotState` that drives the frontend. Precedence: BLE session state takes priority for animation (it's real-time activity), buddy MCP state contributes persistent identity and reactions.

### State Machine (7 states, mirrors claude-desktop-buddy)

| State | Trigger condition | Visual |
|---|---|---|
| `sleep` | BLE disconnected AND buddy sidecar offline | Sleeping animation |
| `idle` | (BLE connected OR sidecar online), no active sessions | Default idle animation |
| `busy` | `running > 0` | Active/working animation |
| `attention` | `waiting > 0` (permission prompt pending) | Alert animation + approve/deny overlay |
| `celebrate` | buddy level-up detected (XP crossed threshold) | Celebration animation |
| `dizzy` | BLE heartbeat gap > 30s (connection unstable) | Dizzy animation |
| `heart` | Permission approved in < 5s | Heart animation (brief) |

### Merged Payload (emitted as `mascot-state-updated` Tauri event)

```typescript
interface MascotState {
  // From buddy MCP
  buddy: {
    name: string;
    level: number;
    xp: number;
    xpToNext: number;
    stats: { debugging: number; patience: number; chaos: number; wisdom: number; snark: number };
    rarity: string;
    species: string;
    personality: string;
    lastReaction: string | null;
  };
  // From BLE
  session: {
    connected: boolean;
    running: number;
    waiting: number;
    tokensToday: number;
    msg: string;
    entries: string[];
    pendingPrompt: { id: string; tool: string; hint: string } | null;
  };
  // Derived
  animationState: "sleep" | "idle" | "busy" | "attention" | "celebrate" | "dizzy" | "heart";
  characterPack: CharacterPack | null;   // if custom pack loaded
}
```

---

## Character Pack Compatibility

The openhuman mascot window supports the same character pack format as claude-desktop-buddy hardware:

```json
{
  "name": "buddy-penguin",
  "colors": { "body": "#FFFFFF", "bg": "#000000", "text": "#FFFFFF" },
  "states": {
    "sleep":     "sleep.gif",
    "idle":      ["idle_0.gif", "idle_1.gif"],
    "busy":      "busy.gif",
    "attention": "attention.gif",
    "celebrate": "celebrate.gif",
    "dizzy":     "dizzy.gif",
    "heart":     "heart.gif"
  }
}
```

- Default display: ASCII art from `buddy_status` (existing stat card format)
- Custom packs: GIF animations loaded from `~/.buddy/characters/<pack-name>/`
- Pack install: drag-and-drop onto mascot window OR via Tauri command (mirrors the hardware folder-push protocol, but as a local file copy)
- The `buddy-penguin` default pack ships with the app and uses the buddy species ASCII art frames

---

## Components

### New Rust files (`openhuman/app/src-tauri/src/`)

| File | Responsibility |
|---|---|
| `buddy_sidecar.rs` | Wraps `tauri-plugin-shell` sidecar; owns stdin/stdout handles; newline-delimited JSON-RPC framing |
| `buddy_client.rs` | MCP client: `initialize_session()`, `call_tool(name, args) → Value` with timeout |
| `buddy_poll.rs` | 2s timer loop; calls `buddy_status`; updates shared `BuddyMcpState` |
| `buddy_commands.rs` | Tauri commands: `buddy_tool(name, args)`, `buddy_get_state()` |
| `ble_companion.rs` | BLE peripheral using `btleplug`; advertises Nordic UART; parses heartbeat JSON; emits on TX |
| `mascot_state.rs` | Merges `BuddyMcpState` + `BleSessionState` → `MascotState`; emits `mascot-state-updated` event; owns state machine transitions |
| `character_pack.rs` | Loads/validates character packs from `~/.buddy/characters/`; serves GIF paths to frontend |

### New React files (`openhuman/app/src/`)

| File | Responsibility |
|---|---|
| `BuddyMascot.tsx` | Renders when `?window=mascot&companion=buddy`; subscribes to `mascot-state-updated`; drives animation state; shows approve/deny overlay when `pendingPrompt` present |
| `CharacterDisplay.tsx` | Shows either ASCII art (default) or GIF animation (character pack); switches frame on `animationState` change |
| `ApproveOverlay.tsx` | Permission prompt UI; calls `invoke("ble_respond_permission", {id, decision})` |
| `BuddyStats.tsx` | Small sidebar showing level, XP bar, personality stats |

### Modified files

- `openhuman/app/src-tauri/Cargo.toml` — add `btleplug`, `serde_json`, `tokio`
- `openhuman/app/src-tauri/src/lib.rs` — register new Tauri commands; spawn sidecar + BLE on app init
- `openhuman/app/src-tauri/tauri.conf.json` — add sidecar binary to `bundle.externalBin`; add BLE permission (`"bluetooth"`)
- `openhuman/app/src/main.tsx` — add `?window=mascot&companion=buddy` branch to mount `BuddyMascot`

### buddy sidecar binary (no source changes)

Built from `fiorastudio/buddy` with `npm run build`, then compiled into a self-contained binary using [`pkg`](https://github.com/vercel/pkg):

```bash
cd buddy && npm run build && npx pkg dist/server/index.js --target node18-macos-arm64 --output ../openhuman/app/src-tauri/binaries/buddy-server-aarch64-apple-darwin
```

This produces a single binary with Node.js embedded — no separate runtime needed. Tauri's `bundle.externalBin` picks it up by name. The binary must be re-compiled for each target platform (arm64/x86_64 macOS; Windows/Linux in later phases).

`pkg` is preferred over `bun build --compile` because buddy has native SQLite dependencies (`better-sqlite3`) that require a Node.js-compatible binary format.

---

## Error Handling

| Failure | Response |
|---|---|
| Buddy sidecar crash | Restart with exponential backoff (1s → 2s → 4s → max 30s); emit `buddy-offline` → frontend shows "buddy is sleeping" |
| MCP parse error / timeout | Skip tick; after 3 consecutive failures trigger sidecar restart |
| BLE not available (e.g. Linux) | `ble_companion.rs` stubs out gracefully; mascot runs on buddy MCP data only |
| Claude Desktop not connected | `session.connected = false`; `animationState = "sleep"` if also no buddy sidecar |
| Character pack invalid | Fall back to ASCII art; log warning; do not crash |
| SQLite contention (concurrent buddy processes) | Not handled in Rust — buddy's WAL mode serializes writes internally |

---

## Testing

| Layer | Approach |
|---|---|
| `buddy_client.rs` | Unit tests with mock subprocess that speaks JSON-RPC over pipes |
| `mascot_state.rs` | Unit tests for all state machine transitions with mock `BuddyMcpState` + `BleSessionState` inputs |
| `ble_companion.rs` | Integration test: mock BLE central sends heartbeat JSON; assert `BleSessionState` fields |
| Full integration | Tauri test harness: spawn real buddy sidecar against temp DB; send mock BLE heartbeat; assert `mascot-state-updated` event payload |
| Visual | Manual smoke: run `pnpm dev:app`; open mascot window; verify ASCII art + stats render; verify permission overlay appears on mock prompt |

---

## Out of Scope (v1)

- Windows/Linux BLE support (stub out; show `idle` only)
- Folder-push protocol for character pack distribution over BLE (local file copy only for now)
- Buddy proactively emitting events (stays purely polled)
- Multi-buddy support (one sidecar instance per app)

---

## Open Questions (resolved)

- **Q**: Does buddy need modification?  
  **A**: No — zero changes to fiorastudio/buddy source.
- **Q**: How does Claude Desktop connect?  
  **A**: Via the same BLE Nordic UART advertisement the hardware uses. Claude Desktop is already built to connect to any device advertising that service UUID.
- **Q**: Is BLE peripheral mode available in Tauri on macOS?  
  **A**: Yes, `btleplug` 0.11+ exposes CoreBluetooth peripheral mode on macOS 10.15+. Peripheral mode support should be verified with a standalone Rust prototype before committing to this approach; if unstable, the fallback is to embed a small Swift helper that wraps CoreBluetooth natively and communicates with Rust via Tauri's sidecar IPC.
