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

1. Clone the repository and submodules.
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

```bash
cd buddy-desktop
pnpm tauri dev
```

### Building the Sidecar

To bundle the Buddy MCP server into a sidecar binary:
```bash
BUDDY_DIR=/Users/Sandbox_Jwu/.buddy/server ./scripts/build-buddy-sidecar.sh
```

## Implementation Status

- [x] **M0 - Grounding**: Workspace and references established.
- [x] **M1 - Buddy Bridge**: TypeScript bridge with MCP polling and parsing.
- [x] **M2 - Tray MVP**: Functional tray app with status popup.
- [ ] **M4 - BLE Proof**: Bluetooth connection with Claude Desktop.
- [ ] **M5 - BLE Product**: Claude session state and prompt approval UI.

## License

This project is licensed under the MIT License.
