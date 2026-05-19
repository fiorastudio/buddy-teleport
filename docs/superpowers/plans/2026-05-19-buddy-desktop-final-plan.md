# Buddy Desktop - Final Implementation Plan

**Date:** 2026-05-19  
**Status:** Final plan for review  
**Supersedes:** `2026-05-18-buddy-desktop-plan-a-mcp-sidecar.md`  
**Primary correction:** Keep upstream Buddy/MCP logic in TypeScript/Node for maximum reuse; keep native desktop, window, and BLE peripheral duties in the app shell.

---

## Goal

Build `buddy-desktop`: a desktop mascot app that shows Buddy's virtual pet state and optionally reacts to Claude Desktop activity through the `claude-desktop-buddy` BLE protocol.

The app must:

- Reuse `fiorastudio/buddy` as directly as possible.
- Avoid reimplementing Buddy internals in Rust or native code.
- Treat `anthropics/claude-desktop-buddy` as a wire-protocol reference.
- Use `tinyhumansai/openhuman` as UX and native-window inspiration only.
- Keep the first shippable slice small: Buddy status in a menu bar/tray popup.
- Prefer zero screen clutter when idle.
- Add Claude Desktop BLE compatibility only after a standalone BLE proof-of-life succeeds.

---

## Architecture

```
buddy-desktop/

  React UI
    - menu bar/tray status popup
    - optional mascot window mode
    - Buddy stats and character display
    - Claude session / permission overlay, added after BLE works

  Native shell: Tauri v2
    - window creation
    - tray/menu/app lifecycle
    - menu bar/tray icon and popup
    - optional transparent always-on-top mascot window
    - native BLE peripheral bridge, if Rust/CoreBluetooth prototype passes

  TypeScript Buddy bridge
    - launches or imports upstream Buddy
    - speaks MCP stdio to Buddy
    - polls/calls Buddy tools
    - emits structured desktop state

  Upstream repos, reference only
    - buddy/                       fiorastudio/buddy, MIT, unchanged
    - claude-desktop-buddy/         Anthropic hardware reference, unchanged
    - openhuman/                    UX/native-window inspiration only, no code copy
```

### Why This Split

Buddy upstream is TypeScript/Node and MCP-based. The desktop app should not duplicate Buddy tool behavior, database behavior, stat calculation, or protocol assumptions in Rust. A thin TypeScript bridge gives us the best chance of surviving upstream changes.

Claude Desktop Hardware Buddy compatibility is different: it requires the app to behave like a BLE peripheral advertising Nordic UART Service. That is a native/platform concern and should be isolated behind a small BLE module or helper.

---

## UX Direction

Primary UX: **menu bar / tray app**.

Buddy should live in the macOS menu bar, or system tray on Windows/Linux. Clicking the icon opens a compact status popup with Buddy state, Claude activity, and any permission prompt. When nothing needs attention, the app should create no screen clutter.

Optional modes:

- Floating mascot window for users who want Buddy visible on the desktop.
- Always-on-top compact companion panel.
- Character/GIF display inside the popup or floating panel.

The default should not be a persistent floating pet. That mode is useful, but it should be opt-in.

Use OpenHuman as inspiration for the polished native-app feel: menu bar presence, lightweight companion behavior, and macOS-native window affordances. Do not copy OpenHuman source code or assets; it remains a design reference only.

UX priorities:

1. Zero clutter when idle.
2. Fast status glance from the menu bar.
3. Permission prompts appear clearly and briefly.
4. Floating mascot is optional.
5. The app should feel like a lightweight companion, not a dashboard.

---

## Source Of Truth Boundaries

| Area | Source of truth | Desktop responsibility |
|---|---|---|
| Buddy tools, DB, XP, pet state | `fiorastudio/buddy` | Run upstream and call public MCP tools |
| Buddy desktop UI state | TypeScript bridge | Normalize Buddy MCP results into structured JSON |
| Menu bar/tray UX | Tauri/native shell | Create tray icon, status popup, notification entrypoints |
| Floating mascot window | Tauri/native shell | Optional mode, not default |
| OpenHuman-inspired UX | `tinyhumansai/openhuman` reference | Borrow product patterns, not source code or assets |
| Claude session heartbeat | `claude-desktop-buddy/REFERENCE.md` | Parse newline-delimited BLE JSON |
| BLE peripheral transport | Native BLE layer | Advertise NUS, RX/TX characteristics, line buffering |
| Character pack format | `claude-desktop-buddy` reference | Load local GIF packs; BLE folder push later |

---

## BLE Requirements Confirmed From Upstream

From `claude-desktop-buddy/REFERENCE.md` and `src/ble_bridge.cpp`:

- Advertise as a BLE peripheral.
- Device name must start with `Claude`.
- Advertise Nordic UART Service.
- Service UUID: `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
- RX, desktop to device: `6e400002-b5a3-f393-e0a9-e50e24dcca9e`
- TX, device to desktop: `6e400003-b5a3-f393-e0a9-e50e24dcca9e`
- Payload format: UTF-8 JSON, one object per line, newline terminated.
- Desktop sends heartbeat snapshots on change and keepalive about every 10 seconds.
- If no snapshot arrives for about 30 seconds, treat Claude as disconnected.
- Permission responses are sent back as newline-delimited JSON:

```json
{"cmd":"permission","id":"req_abc123","decision":"once"}
{"cmd":"permission","id":"req_abc123","decision":"deny"}
```

Security note: upstream recommends encrypted LE Secure Connections bonding. The desktop supports unencrypted devices, but transcript snippets and tool hints can cross this link, so encrypted mode should be the target after the first proof-of-life.

---

## Final Technology Choice

Use **Tauri v2 + React + TypeScript** for the desktop app, but with a strict rule:

> TypeScript owns Buddy integration. Native code owns native platform behavior.

Tauri is still reasonable because the app wants a lightweight always-running menu bar/tray process and may need native BLE peripheral support. But Tauri should not become a place where Buddy's MCP behavior is reimplemented.

If BLE peripheral support in Rust/Tauri proves unstable, the fallback is a small native macOS Swift/CoreBluetooth helper process. The app architecture should allow that helper to be swapped in without changing the Buddy bridge or React UI.

---

## Implementation Phases

### Phase 0 - Repo And Protocol Grounding

Status: mostly done.

- Keep `buddy/` as a read-only upstream clone or submodule.
- Keep `claude-desktop-buddy/` as a read-only protocol reference.
- Keep OpenHuman as a design/native-window reference only.
- Add both to workspace docs as reference dependencies.
- Do not copy GPL or unrelated reference code into `buddy-desktop`.
- Add root `.gitignore` entries for upstream clones, generated binaries, `node_modules`, and Tauri targets.

Deliverable:

- Workspace has documented reference repos and no desktop implementation yet depends on copied internals.

### Phase 1 - Buddy Bridge Proof Of Life

Goal: prove we can talk to upstream Buddy through its public MCP surface without Rust parsing Buddy internals.

Create a TypeScript bridge package:

```
buddy-desktop/bridge/
  package.json
  src/index.ts
  src/buddyProcess.ts
  src/mcpClient.ts
  src/stateMapper.ts
  src/protocol.ts
```

Responsibilities:

- Start upstream Buddy as a child process or import its MCP server entrypoint if upstream supports that cleanly.
- Perform MCP initialize handshake.
- Call `buddy_status`.
- Expose a small bridge API over stdio or localhost:
  - `get_state`
  - `call_tool`
  - `subscribe_state`
- Keep all Buddy-specific parsing and compatibility in TypeScript.

Important:

- Prefer structured MCP responses if upstream provides them.
- If Buddy only exposes a terminal stat card, parse it in `stateMapper.ts` as a temporary compatibility adapter.
- Add fixture tests for the current stat card format.
- Keep the parser isolated so it is easy to replace if upstream adds structured status.

Verification:

- `pnpm --dir buddy-desktop/bridge test`
- Bridge can return normalized JSON:

```json
{
  "name": "buddy",
  "level": 1,
  "xp": 3,
  "xpToNext": 17,
  "stats": {
    "debugging": 14,
    "patience": 11,
    "chaos": 26,
    "wisdom": 3,
    "snark": 59
  },
  "rarity": "COMMON",
  "species": "PENGUIN",
  "asciiArt": []
}
```

### Phase 2 - Minimal Menu Bar / Tray App

Goal: show Buddy state from a menu bar/tray icon before custom native panel work.

Create `buddy-desktop/` as a new MIT-licensed Tauri v2 app:

```
buddy-desktop/
  src/
    main.tsx
    components/StatusPopup.tsx
    components/BuddyMascot.tsx
    components/BuddyStats.tsx
    components/CharacterDisplay.tsx
    types/state.ts
  src-tauri/
    src/lib.rs
    src/bridge_process.rs
    src/commands.rs
    src/tray.rs
```

Responsibilities:

- Tauri launches the TypeScript bridge as a sidecar process.
- Rust does not speak Buddy MCP directly.
- Rust creates a menu bar/tray icon.
- Clicking the icon opens a compact status popup.
- Rust forwards bridge state to React through Tauri events.
- React renders Buddy identity, level, XP, stats, and default ASCII/GIF fallback inside the popup.

Verification:

- `pnpm --dir buddy-desktop tauri dev`
- Menu bar/tray icon appears.
- Status popup updates from the bridge.
- Killing the bridge shows offline state and restarts with backoff.

### Phase 3 - Optional Floating Mascot Window

Goal: add an opt-in floating mascot window after the menu bar/tray flow works.

Implement in the smallest possible slice:

- First: Tauri frameless transparent always-on-top window.
- Then, only if needed for macOS behavior: `NSPanel`/`WKWebView` native panel.

Rules:

- Do not start with `NSPanel`.
- Keep native panel code isolated in `mascot_window.rs`.
- Keep React unaware of whether the host window is Tauri-standard or macOS-native.
- Keep floating mode optional and user-controlled.

Verification:

- Mascot window is transparent where expected.
- It is always-on-top.
- It can be moved.
- It does not steal focus unnecessarily.
- It works in dev and production builds.

### Phase 4 - BLE Peripheral Prototype

Goal: prove Claude Desktop can connect to this app as if it were a hardware buddy.

This is a standalone prototype before app integration.

Prototype requirements:

- Advertise name `Claude-XXXX`.
- Advertise NUS service UUID `6e400001-b5a3-f393-e0a9-e50e24dcca9e`.
- Expose RX characteristic for desktop writes.
- Expose TX characteristic for device notifications.
- Accumulate bytes until newline.
- Parse heartbeat JSON.
- Send a valid `status` ack when requested.
- Send a test permission response when a prompt arrives.

Candidate implementations:

1. Rust `btleplug` peripheral mode.
2. Native Swift/CoreBluetooth helper.

Decision gate:

- If Rust peripheral mode works reliably on macOS, integrate it into Tauri.
- If not, keep Tauri for UI/windowing and use a Swift BLE helper process.

Verification:

- Claude Desktop Hardware Buddy window discovers `Claude-XXXX`.
- Claude sends heartbeat JSON.
- App receives `total`, `running`, `waiting`, `msg`, `entries`, `tokens_today`, and `prompt`.
- App sends `permission` response and Claude accepts it.

### Phase 5 - BLE Integration Into App State

Goal: merge Claude session state with Buddy state.

Add:

```
buddy-desktop/src-tauri/src/ble/
  mod.rs
  protocol.rs
  peripheral.rs

buddy-desktop/src/types/claudeSession.ts
buddy-desktop/src/components/ApproveOverlay.tsx
```

Merged state:

```ts
interface MascotState {
  buddy: BuddyState;
  claude: {
    connected: boolean;
    total: number;
    running: number;
    waiting: number;
    msg: string;
    entries: string[];
    tokensToday: number;
    pendingPrompt: null | {
      id: string;
      tool: string;
      hint: string;
    };
  };
  animationState:
    | "sleep"
    | "idle"
    | "busy"
    | "attention"
    | "celebrate"
    | "dizzy"
    | "heart";
}
```

Animation precedence:

1. `attention` if Claude has pending prompt or `waiting > 0`.
2. `busy` if `running > 0`.
3. `heart` briefly after fast approval.
4. `celebrate` briefly after Buddy level-up.
5. `dizzy` if BLE heartbeat gap exceeds 30 seconds.
6. `idle` if Buddy or Claude is connected.
7. `sleep` if both Buddy bridge and Claude BLE are disconnected.

### Phase 6 - Character Packs

Goal: support `claude-desktop-buddy` style GIF character packs locally.

Start with local install only:

- Load character packs from `~/.buddy/characters/<pack-name>/`.
- Validate `manifest.json`.
- Render GIF state assets in `CharacterDisplay`.
- Keep ASCII fallback.

Defer BLE folder push until after local packs work.

Later:

- Implement folder push protocol:
  - `char_begin`
  - `file`
  - `chunk`
  - `file_end`
  - `char_end`
- Validate paths before writing.
- Reject absolute paths and `..`.

---

## Files To Create

### TypeScript Bridge

| File | Purpose |
|---|---|
| `buddy-desktop/bridge/src/index.ts` | Bridge entrypoint |
| `buddy-desktop/bridge/src/buddyProcess.ts` | Launch upstream Buddy |
| `buddy-desktop/bridge/src/mcpClient.ts` | MCP JSON-RPC client |
| `buddy-desktop/bridge/src/stateMapper.ts` | Normalize Buddy responses |
| `buddy-desktop/bridge/src/protocol.ts` | Bridge message protocol |
| `buddy-desktop/bridge/test/stateMapper.test.ts` | Fixture tests |

### Tauri Shell

| File | Purpose |
|---|---|
| `buddy-desktop/src-tauri/src/bridge_process.rs` | Start/monitor TS bridge |
| `buddy-desktop/src-tauri/src/commands.rs` | Tauri commands |
| `buddy-desktop/src-tauri/src/tray.rs` | Menu bar/tray icon and popup lifecycle |
| `buddy-desktop/src-tauri/src/mascot_window.rs` | Optional floating window logic |
| `buddy-desktop/src-tauri/src/state.rs` | Shared app state |
| `buddy-desktop/src-tauri/src/ble/protocol.rs` | BLE JSON protocol types |
| `buddy-desktop/src-tauri/src/ble/peripheral.rs` | BLE peripheral implementation or helper IPC |

### React UI

| File | Purpose |
|---|---|
| `buddy-desktop/src/components/StatusPopup.tsx` | Menu bar/tray popup UI |
| `buddy-desktop/src/components/BuddyMascot.tsx` | Root mascot UI |
| `buddy-desktop/src/components/BuddyStats.tsx` | Buddy status display |
| `buddy-desktop/src/components/CharacterDisplay.tsx` | ASCII/GIF renderer |
| `buddy-desktop/src/components/ApproveOverlay.tsx` | Permission prompt controls |
| `buddy-desktop/src/types/state.ts` | Shared frontend types |

---

## What Changes From The Old Plan

| Old Plan A | Final Plan |
|---|---|
| Rust implements MCP client | TypeScript bridge implements MCP client |
| Rust parses Buddy stat card | TypeScript adapter parses only if necessary |
| Tauri shell directly owns Buddy protocol | Tauri shell owns bridge process only |
| Start with macOS `NSPanel` | Start with menu bar/tray popup, add floating panel later |
| BLE appears after MCP sidecar work | BLE gets its own standalone prototype gate |
| `buddy_tool` stub accepted | Interactive tools must go through bridge `call_tool` |
| Mixed raw process and Tauri sidecar assumptions | Choose one bridge launch strategy and test it |

---

## Risk Register

| Risk | Mitigation |
|---|---|
| Buddy changes stat card format | Keep parser isolated in TypeScript; prefer structured upstream MCP if available |
| BLE peripheral support is unstable in Rust | Use Swift/CoreBluetooth helper process |
| Native panel code slows MVP | Ship menu bar/tray popup first; floating panel is optional |
| OpenHuman license contamination | Use OpenHuman as inspiration only; do not copy source, assets, or GPL-derived implementation |
| Claude Desktop BLE API changes | Keep `claude-desktop-buddy` reference clone and protocol tests |
| Unencrypted BLE leaks prompt hints | Target encrypted bonding after proof-of-life |
| Character pack writes are unsafe | Validate paths and defer BLE folder push |

---

## First Execution Slice

The first slice should not touch BLE or `NSPanel`.

1. Scaffold `buddy-desktop`.
2. Add TypeScript bridge.
3. Launch upstream Buddy.
4. Call `buddy_status`.
5. Render normalized Buddy state in a menu bar/tray popup.
6. Add tests around the Buddy state mapper.

Exit criteria:

- User can run `pnpm --dir buddy-desktop tauri dev`.
- A menu bar/tray icon appears.
- Clicking the icon shows Buddy name, level, XP, species, and stats.
- Buddy upstream remains unchanged.
- No Rust MCP parser exists.

---

## Decision Gates

Before starting Phase 4:

- Buddy bridge and menu bar/tray popup must work end-to-end.

Before integrating BLE:

- Claude Desktop must connect to the standalone BLE prototype.

Before implementing floating mascot or `NSPanel`:

- Menu bar/tray popup must be working.
- Standard frameless always-on-top Tauri window must be working.

Before implementing BLE folder push:

- Local character packs must work.

---

## Final Recommendation

Proceed with Tauri only under the revised architecture:

- Tauri/Rust: native shell, app lifecycle, tray/menu, windowing, BLE or BLE helper IPC.
- TypeScript bridge: upstream Buddy MCP integration.
- React: UI.
- Upstream repos: unchanged references.

This keeps the app lightweight without sacrificing upstream Buddy reusability.
