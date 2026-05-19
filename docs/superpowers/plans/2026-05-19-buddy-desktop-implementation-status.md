# Buddy Desktop Implementation Status

**Date:** 2026-05-19  
**Backlog:** `docs/superpowers/plans/2026-05-19-buddy-desktop-user-stories.md`

## Fresh Agent Start Here

- Workspace: `/Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport`
- Main implementation: `buddy-desktop`
- User story source of truth: `docs/superpowers/plans/2026-05-19-buddy-desktop-user-stories.md`
- Current status review: `docs/review/user-stories-review.html`
- Local Buddy upstream source/install: `/Users/Sandbox_Jwu/.buddy/server`
- BLE reference repo: `claude-desktop-buddy`
- Do not clone Buddy again unless explicitly asked; use the local installed Buddy source and the installed MCP entry at `/Users/Sandbox_Jwu/.buddy/server/dist/server/index.js`.
- Do not retry `npm install` in a loop. The sandboxed attempt hung for several minutes and left no `node_modules` or `package-lock.json` in `buddy-desktop`.
- Continue with offline tests unless the user approves a networked dependency install.

## Next Concrete Steps

1. Install frontend/Tauri dependencies in `buddy-desktop` when network access is available.
2. Run `npm run build` in `buddy-desktop`.
3. Run `npm run dev` or `npm run tauri:dev` in `buddy-desktop`.
4. Use browser/Playwright to visually verify the popup and permission prompt.
5. Manually verify macOS tray/menu-bar behavior.
6. Manually pair Claude Desktop Hardware Buddy and verify BLE heartbeat, status ack, and permission response.

## Completed Offline

- BD-001: reference and license boundary checks are automated with `npm run docs:check`.
- BD-002: Tauri-shaped app scaffold exists with MIT license, Vite entry files, React popup entry, and Rust shell modules.
- BD-003 to BD-005: TypeScript Buddy bridge package exists with MCP JSON-RPC client, process launcher, normalized state mapper, sidecar protocol, and tests.
- BD-006 to BD-007: shared state contract, popup components, offline/default state, and view-model tests exist.
- BD-008 to BD-011: bridge sidecar launch spec, sidecar event protocol, Rust event boundary parsing, and Buddy tool forwarding exist. Rust does not parse Buddy MCP responses.
- BD-013 to BD-014: BLE protocol fixtures, line buffering, command parsing, permission serialization, and fake peripheral prototype exist.
- BD-016 to BD-018: provisional BLE decision, Claude session reducer states, popup prompt overlay, and permission response serialization exist.
- BD-019 to BD-020: opt-in floating mascot state machine and local character pack validation exist.

## Verified Commands

- `npm test` from `buddy-desktop`
- `cargo test` from `buddy-desktop/src-tauri`
- `npm run docs:check` from workspace root
- `node scripts/smoke-installed-buddy.mjs` from `buddy-desktop`

## Manual Or Dependency Gates

- Real Tauri dev run requires installing frontend/Tauri packages. The sandboxed `npm install` attempt hung without writing `node_modules` or `package-lock.json`.
- Playwright or browser visual verification requires the Vite/Tauri dev server to run after dependencies install.
- Claude Desktop BLE verification still requires manual Hardware Buddy pairing and prompt approval testing.
- Native macOS tray/menu-bar behavior still requires `tauri dev` or a built app.

## Upstream Boundaries

- Buddy remains upstream source of truth and is accessed through the TypeScript bridge.
- OpenHuman remains inspiration only; no OpenHuman source or assets are copied.
- `claude-desktop-buddy` is used as the BLE protocol reference.
