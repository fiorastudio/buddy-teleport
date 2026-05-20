# Buddy Teleport (Buddy Desktop)

Buddy Teleport is a native macOS application that brings the `fiorastudio/buddy` virtual pet companion out of the terminal and onto your desktop as a floating mascot.

## Features

- **Floating Mascot**: A transparent, always-on-top window featuring your Buddy.
- **Tray Integration**: Compact status popup accessible from the macOS menu bar.
- **Buddy Bridge**: Real-time integration with the Buddy MCP server using a sidecar process. The repo currently contains both a tested TypeScript bridge package and a Rust MCP polling path.
- **Animation States**: Visual feedback for Buddy's status (Idle, Busy, Celebrate, Sleep, etc.).
- **BLE Integration (In Progress)**: Connecting with Claude Desktop via BLE to mirror session states and handle tool permissions.

## Architecture

Buddy Desktop is built with **Tauri v2** and **React**.

- **Rust Backend**: Manages the application lifecycle, tray icon, floating window (`NSPanel` on macOS), and the current Buddy sidecar polling path.
- **TypeScript Bridge**: Provides a tested MCP client and normalized state mapper that can be used to keep Buddy compatibility close to upstream JavaScript.
- **React Frontend**: Renders the status popup and the animated mascot.

## Project Structure

```text
buddy_openhuman_teleport/
├── buddy-desktop/          # Main Tauri v2 app implementation
│   ├── src-tauri/          # Rust backend logic
│   ├── src/                # React/TypeScript frontend
│   └── bridge/             # TypeScript Buddy sidecar bridge
├── docs/                   # Project documentation and user stories
└── scripts/                # Build and smoke-test scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
- Rust 1.77+
- pnpm 8+

### Installation

1. Clone the repository.
2. Install dependencies for the main app:
   ```bash
   cd buddy-desktop
   pnpm install
   ```
3. Install dependencies for the bridge:
   ```bash
   cd buddy-desktop/bridge
   npm install
   ```

### Running in Development

The normal teleport entrypoint starts the app with your installed terminal Buddy:

```bash
./scripts/buddy-teleport-out.sh
```

From `buddy-desktop/`, you can also run Tauri directly:

```bash
cd buddy-desktop
BUDDY_SIDECAR_PATH=/path/to/buddy-server-or-wrapper pnpm tauri dev
```

If `BUDDY_SIDECAR_PATH` is omitted, release builds use the packaged sidecar binary from Tauri resources. Debug builds first use an existing packaged debug sidecar if present, then fall back to `$HOME/.buddy/server/dist/server/index.js`. The sidecar inherits the normal Buddy environment, so by default it reads the same `~/.buddy/buddy.db` that terminal Buddy uses. Set `BUDDY_DB_PATH` only for isolated smoke tests.

### Building the Sidecar

To bundle the Buddy MCP server into a sidecar binary:
```bash
./scripts/build-buddy-sidecar.sh
```

The builder prefers `$HOME/.buddy/server`, falls back to a workspace-local `./buddy` checkout, and can be pointed at another Buddy source with `BUDDY_DIR=/path/to/buddy/server`.

### Teleport Contract

Buddy Teleport must not hatch a random desktop-only Buddy. The desktop app polls `buddy_status` from the Buddy sidecar and renders that terminal Buddy's name, level, XP, species, personality text, ASCII art, and stats. Interactive desktop calls expose safe Buddy tools such as `buddy_pet` and `buddy_observe`; destructive identity-changing tools such as `buddy_hatch` and `buddy_respawn` are intentionally not exposed through the desktop command allowlist.

Terminal to desktop:

```bash
./scripts/buddy-teleport-out.sh
```

The same launcher is available as the Claude slash command artifact `.claude/commands/buddy-teleport.md`.

Desktop back to terminal:

- Use the popup action **Return**.
- The app records a `buddy_observe` event and disables desktop polling so the terminal Buddy remains the source of truth until teleported out again.

Verification commands:

```bash
cd buddy-desktop
npm test
npm run smoke:teleport-tools
npm run smoke:teleport-runtime
```

## Implementation Status

- [x] **M0 - Grounding**: Workspace and references established.
- [x] **M1 - Buddy Bridge**: TypeScript bridge with MCP polling and parsing.
- [x] **M2 - Tray MVP**: Functional tray app with status popup.
- [ ] **M4 - BLE Proof**: Bluetooth connection with Claude Desktop.
- [ ] **M5 - BLE Product**: Claude session state and prompt approval UI.

## License

This project is licensed under the MIT License.
