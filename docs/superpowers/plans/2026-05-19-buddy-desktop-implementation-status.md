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
- `buddy-desktop/node_modules` and `buddy-desktop/pnpm-lock.yaml` now exist from follow-up work, so frontend build checks are available.
- A later implementation pass added a Rust MCP polling path in `src-tauri/src/buddy_client.rs` and `src-tauri/src/buddy_poll.rs`. This differs from the earlier TypeScript-only bridge preference; decide whether to keep this Plan A Rust sidecar path or migrate runtime polling back through `buddy-desktop/bridge`.
- The ignored local `buddy/` reference checkout has a dirty `package-lock.json` from a prior install/build attempt. Do not commit it; root `.gitignore` excludes `buddy/`.

## Next Concrete Steps

1. Decide architecture direction: keep Rust MCP polling sidecar or restore the runtime TypeScript bridge boundary.
2. Build the Buddy sidecar binary with `scripts/build-buddy-sidecar.sh`, preferably with `BUDDY_DIR=/Users/Sandbox_Jwu/.buddy/server` to avoid touching the ignored `buddy/` checkout.
3. Run `npm run tauri:dev` in `buddy-desktop`.
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
- `npm run build` from `buddy-desktop`
- `cargo test` from `buddy-desktop/src-tauri`
- `npm run docs:check` from workspace root
- `node scripts/smoke-installed-buddy.mjs` from `buddy-desktop`

## Manual Or Dependency Gates

- Real Tauri dev run requires a built Buddy sidecar binary under `buddy-desktop/src-tauri/binaries/`.
- Playwright or browser visual verification requires the Vite/Tauri dev server to run after dependencies install.
- Claude Desktop BLE verification still requires manual Hardware Buddy pairing and prompt approval testing.
- Native macOS tray/menu-bar behavior still requires `tauri dev` or a built app.

## Upstream Boundaries

- Buddy remains upstream source of truth. The current app has both a tested TypeScript bridge package and a Rust MCP polling path; this should be reconciled before release.
- OpenHuman remains inspiration only; no OpenHuman source or assets are copied.
- `claude-desktop-buddy` is used as the BLE protocol reference.
