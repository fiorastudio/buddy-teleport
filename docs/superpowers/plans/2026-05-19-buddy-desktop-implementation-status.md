# Buddy Desktop Implementation Status

**Date:** 2026-05-19  
**Backlog:** `docs/superpowers/plans/2026-05-19-buddy-desktop-user-stories.md`

## Fresh Agent Start Here

- Workspace: `/Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport`
- Main implementation: `buddy-desktop`
- User story source of truth: `docs/superpowers/plans/2026-05-19-buddy-desktop-user-stories.md`
- Current status review: `docs/review/user-stories-review.html`
- Current UI approval prototype: `docs/review/buddy-desktop-interaction-prototype.html`
- Local Buddy upstream source/install: `/Users/Sandbox_Jwu/.buddy/server`
- BLE reference repo: `claude-desktop-buddy`
- Do not clone Buddy again unless explicitly asked; use the local installed Buddy source and the installed MCP entry at `/Users/Sandbox_Jwu/.buddy/server/dist/server/index.js`.
- `buddy-desktop/node_modules` and `buddy-desktop/pnpm-lock.yaml` now exist from follow-up work, so frontend build checks are available.
- A later implementation pass added a Rust MCP polling path in `src-tauri/src/buddy_client.rs` and `src-tauri/src/buddy_poll.rs`. This differs from the earlier TypeScript-only bridge preference; decide whether to keep this Plan A Rust sidecar path or migrate runtime polling back through `buddy-desktop/bridge`.
- The ignored local `buddy/` reference checkout has a dirty `package-lock.json` from a prior install/build attempt. Do not commit it; root `.gitignore` excludes `buddy/`.
- The Rust sidecar path now supports `BUDDY_SIDECAR_PATH` for manual teleport verification with an installed Buddy wrapper.
- Plain debug `cargo run` falls back to the installed Buddy MCP entry at `$HOME/.buddy/server/dist/server/index.js` when no packaged debug sidecar binary exists; JavaScript MCP entries are launched through `node`.
- A live Rust smoke test can be run with `BUDDY_TELEPORT_LIVE_SIDECAR=/path/to/wrapper BUDDY_DB_PATH=/tmp/buddy.db cargo test live_buddy_sidecar_uses_existing_db_and_supports_pet_observe_when_env_is_set -- --nocapture`.
- `npm run smoke:teleport-tools` creates an isolated Buddy DB and sidecar wrapper, then runs the live Rust smoke through the same command helpers used by popup Pet/Observe/Return actions.
- Terminal-to-desktop teleport is represented by `.claude/commands/buddy-teleport.md` and `scripts/buddy-teleport-out.sh`.
- The slash command now invokes `./scripts/buddy-teleport-out.sh` from the repo instead of a machine-specific absolute checkout path; the launcher defaults to `$HOME/.buddy/server`.
- The sidecar builder now prefers `$HOME/.buddy/server` and falls back to `./buddy`, keeping release packaging aligned with the installed Buddy source used by dev/runtime smoke paths.
- Desktop-to-terminal teleport is represented by the `buddy_teleport_back` Tauri command and popup **Return** action. It records a `buddy_observe` event, marks Buddy offline in desktop state, and disables polling until the app is restarted/teleported out again.
- Tray source/config invariants are covered by tests: tray clicks target the configured hidden `status-popup` window, while the floating mascot uses a distinct `mascot` window route.
- Popup Buddy actions now expose `buddy_pet` and `buddy_observe` through the same safe Tauri command allowlist, then refresh the cached terminal Buddy state. Desktop-originated `buddy_observe` calls preserve caller-provided `cwd` and otherwise default to `BUDDY_WORKSPACE_CWD`/process cwd; the teleport-out script exports `BUDDY_WORKSPACE_CWD` as the terminal workspace root.
- Permission approve/deny no longer routes through `buddy_tool`; the frontend builds a Claude BLE `permission` frame and sends it to the `ble_respond_permission` Tauri command boundary.
- The desktop visual surface intentionally does not render Buddy's terminal ASCII status card. The parser extracts identity, XP, stats, personality, and sprite-only lines; React should animate the sprite in the avatar area, while stats/card chrome render through dedicated visual sections.
- The React app starts from the offline default state until Tauri returns the terminal Buddy state; it no longer shows the mock Buddy fixture during startup.
- Initial React connection state is derived from the Buddy payload mood, so an offline cached Buddy payload stays offline until runtime polling provides a teleported terminal Buddy.
- User review found the current live popup actions too hard to discover and the reaction/speech bubble treatment too clipped. A later review accepted the prototype direction for an initial pass and requested three revisions: label the first action **Pet**, not **Pat**; remove the long Buddy personality description from the teleported Tauri surface; and make the ASCII sprite animation visible. The React popup now follows that revised direction.

## Next Concrete Steps

1. Decide architecture direction: keep Rust MCP polling sidecar or restore the runtime TypeScript bridge boundary.
2. Build the Buddy sidecar binary with `scripts/build-buddy-sidecar.sh`; it prefers `$HOME/.buddy/server` and falls back to the ignored `buddy/` checkout.
3. Use the popup **Pet**, **Observe**, and **Return** actions in a native app session against the real terminal Buddy DB.
4. Add Playwright or another browser automation dependency if screenshot-level visual verification is required; current repo dependencies do not include Playwright.
5. Manually verify macOS tray/menu-bar behavior.
6. Manually pair Claude Desktop Hardware Buddy and verify BLE heartbeat, status ack, and permission response.

## Completed Offline

- BD-001: reference and license boundary checks are automated with `npm run docs:check`.
- BD-002: Tauri-shaped app scaffold exists with MIT license, Vite entry files, React popup entry, and Rust shell modules.
- BD-003 to BD-005: TypeScript Buddy bridge package exists with MCP JSON-RPC client, process launcher, normalized state mapper, sidecar protocol, and tests.
- BD-006 to BD-007: shared state contract, popup components, offline/default state, and view-model tests exist.
- Buddy visual treatment derives from parsed state fields instead of dumping the terminal card into the desktop UI; top stat controls avatar accent/surface, sprite-only ASCII animates in the avatar frame, reactions render as wrapped speech-bubble UI, and personality stats remain visible without showing the long personality description.
- The popup startup path no longer renders `MOCK_MASCOT_STATE`, preventing a transient wrong body before the terminal Buddy state arrives.
- Frontend smoke checks now guard the popup Pet/Observe/Return wiring and the initial terminal-Buddy connection-state handoff.
- A static interaction prototype exists at `docs/review/buddy-desktop-interaction-prototype.html` for approval of persistent Buddy controls and wrapped speech-bubble reaction rendering.
- BD-008 to BD-011: bridge sidecar launch spec, sidecar event protocol, Rust event boundary parsing, Rust Buddy MCP status parsing, safe Buddy tool forwarding, and teleport-back state handling exist.
- BD-013 to BD-014: BLE protocol fixtures, line buffering, command parsing, permission serialization, and fake peripheral prototype exist.
- BD-016 to BD-018: provisional BLE decision, Claude session reducer states, popup prompt overlay, permission response serialization, and a native Tauri BLE permission command boundary exist.
- BD-019 to BD-020: opt-in floating mascot state machine and local character pack validation exist.

## Verified Commands

- `npm test` from `buddy-desktop`
- `npm run build` from `buddy-desktop`
- `cargo test` from `buddy-desktop/src-tauri`
- `BUDDY_DB_PATH=/private/tmp/buddy-teleport-live/buddy.db BUDDY_TELEPORT_LIVE_SIDECAR=/private/tmp/buddy-teleport-live/buddy-sidecar cargo test live_buddy_sidecar_uses_existing_db_and_supports_pet_observe_when_env_is_set -- --nocapture` from `buddy-desktop/src-tauri`
- `npm run docs:check` from workspace root
- `node scripts/smoke-installed-buddy.mjs` from `buddy-desktop`
- `npm run smoke:teleport-runtime` from workspace root seeds an isolated terminal Buddy DB, launches the same teleport wrapper path for a bounded native Tauri run, and fails if runtime polling cannot parse that Buddy's stat card.
- `npm run smoke:teleport-tools` from workspace root hatches `TeleportAda`, runs `buddy_pet`, `buddy_observe`, and teleport-back through Rust command helpers, refreshes status, and verifies the same terminal Buddy identity remains present with an offline return payload.
- `cargo run` from `buddy-desktop/src-tauri` starts `target/debug/buddy-desktop` and spawns `node /Users/Sandbox_Jwu/.buddy/server/dist/server/index.js` without the earlier `failed to spawn buddy: No such file or directory` retry loop.
- `BUDDY_DB_PATH=/private/tmp/buddy-teleport-gui/buddy.db ./scripts/buddy-teleport-out.sh` launched the Vite dev server and native Tauri app after seeding the temp DB with `TeleportAda`; startup reached `target/debug/buddy-desktop` with no Buddy parser errors, and `curl http://127.0.0.1:1420/` returned the React entry HTML with host permissions.

## Manual Or Dependency Gates

- Release/native packaging still requires a built Buddy sidecar binary under `buddy-desktop/src-tauri/binaries/`; `npm run smoke:teleport-runtime` creates a wrapper for isolated teleport verification.
- Screenshot-level Playwright verification is not yet available because the repo does not currently depend on Playwright.
- A blank Buddy DB is not a valid teleport target: the runtime poller expects an existing terminal Buddy stat card. Seed a temp DB or use the real terminal Buddy DB when doing isolated runtime checks.
- Claude Desktop BLE verification still requires manual Hardware Buddy pairing and prompt approval testing.
- Native macOS tray/menu-bar behavior still requires `tauri dev` or a built app.

## Upstream Boundaries

- Buddy remains upstream source of truth. The current app has both a tested TypeScript bridge package and a Rust MCP polling path; this should be reconciled before release.
- OpenHuman remains inspiration only; no OpenHuman source or assets are copied.
- `claude-desktop-buddy` is used as the BLE protocol reference.
