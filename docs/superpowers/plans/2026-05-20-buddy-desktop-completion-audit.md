# Buddy Desktop Completion Audit

**Date:** 2026-05-20  
**Scope:** Active user goal for terminal Buddy teleport into Buddy Desktop/Tauri, desktop return to terminal, Buddy tool actions, identity/body preservation, and repository check-in.

## Current Repository State

- Branch `main` is tracking `origin/main`.
- Latest pushed commit before this shared-state-helper pass: `d00e747 fix: remove production mock buddy body`.
- Relevant follow-up commits reviewed/pushed in this pass:
  - `5a29444 fix: launch installed buddy in debug app`
  - `f3473ea fix: avoid mock buddy during startup`
  - `795d8b8 fix: keep startup connection offline until buddy arrives`
  - `4d72972 test: add live teleport tool smoke`
  - `b0cbf04 test: cover teleport back command path`
  - `bd79fe3 fix: make teleport command repo-relative`
  - `811b54a test: cover tray popup window invariants`
  - `681c10d fix: align sidecar builder with installed buddy`
  - `53f18df fix: normalize BLE permission prompt ids`
  - `1967819 docs: refresh teleport usage guidance`
  - `4c51f6d test: cover React buddy identity view`
  - `b73aa6e fix: hydrate mascot from terminal buddy state`
  - `d00e747 fix: remove production mock buddy body`

## Requirement Audit

| Requirement | Current Evidence | Status |
| --- | --- | --- |
| Terminal user can invoke teleport-out via a slash-command-like entrypoint | `.claude/commands/buddy-teleport.md` invokes `./scripts/buddy-teleport-out.sh`; `README.md` documents the same repo-relative launcher; `buddy-desktop/scripts/smoke.mjs` fails if the slash command or README regresses to a machine-specific `/Users/...` path. | Proven by source and smoke test |
| Teleport launcher uses the terminal Buddy install and DB, not a desktop-only Buddy | `scripts/buddy-teleport-out.sh` defaults to `$HOME/.buddy/server`, prints `BUDDY_DB_PATH`/`$HOME/.buddy/buddy.db`, creates a `BUDDY_SIDECAR_PATH` wrapper, and exports `BUDDY_WORKSPACE_CWD`. | Proven by source and live smoke |
| Release sidecar builder uses the same installed Buddy source by default | `scripts/build-buddy-sidecar.sh` now prefers `$HOME/.buddy/server` and falls back to a workspace-local `buddy/` checkout. | Proven by source and smoke test |
| Plain debug launch does not fail with a missing packaged sidecar | `resolve_buddy_sidecar_path` falls back to the installed Buddy MCP entry in debug when no packaged sidecar exists; `.js` MCP entries spawn through `node`. | Proven by `cargo test` and observed `cargo run` startup |
| Tauri app uses the correct terminal Buddy body/identity rather than random mock bodies | React starts from `DEFAULT_MASCOT_STATE`; the unused `MOCK_MASCOT_STATE` production body has been removed; runtime polling parses the seeded terminal Buddy (`TeleportSmoke`) in `npm run smoke:teleport-runtime`; sprite frames preserve parsed ASCII body lines; the floating `BuddyMascot` root now fetches `buddy_get_state` on mount instead of waiting only for later poll events; `App` and `BuddyMascot` now use shared state helpers for terminal hydration and return events. | Proven by source, unit tests, and runtime smoke |
| Status, XP graph, name, species/rarity, personality, stats, and sprite body are preserved into React state | Rust parser extracts identity, XP, stats, personality, and sprite-only `ascii_art`; `frontend_buddy_payload` preserves them as camelCase; React renders identity, XP bar, stats, and sprite frames. | Proven by Rust/frontend tests |
| React surfaces display the terminal Buddy fields, not duplicated or invented component fields | `buildBuddyIdentityView` is now shared by `BuddyStats` and `CharacterDisplay`; `buddyIdentityView.test.mjs` verifies terminal-style `TeleportAda` name, level, XP labels/bar percent, stat rows, reaction text, and ASCII body frames; `appState.test.mjs` verifies shared terminal hydration, refresh, mascot event, and return-event transitions; `scripts/smoke.mjs` guards `BuddyMascot` startup state fetch, return-event handling, and absence of production mock Buddy bodies. | Proven by frontend unit test, smoke test, and typecheck |
| Pet and Observe actions use the real Buddy sidecar path and refresh identity | `buddy_tool` calls `call_buddy_tool_once` with the cached sidecar path; `npm run smoke:teleport-tools` hatches `TeleportAda`, runs `buddy_pet` and `buddy_observe` through the Rust command helper, and verifies identity remains `TeleportAda` / `ROBOT`. | Proven by live smoke |
| Observe path preserves guard-mode defaults and workspace cwd | `normalize_buddy_tool_args` adds `claims`, `edges`, and `cwd`; `scripts/buddy-teleport-out.sh` exports `BUDDY_WORKSPACE_CWD`. | Proven by Rust tests |
| Desktop Return action teleports Buddy back to terminal state | `buddy_teleport_back` uses `teleport_back_once`, records `buddy_observe`, marks state offline, emits `buddy-teleported-back`, and disables polling. Live smoke verifies identity remains `TeleportAda` / `ROBOT` and payload mood is `sleeping`. | Proven by Rust tests and live smoke |
| Tray click targets the popup window rather than the mascot surface | Tray constants target `status-popup`; `tauri.conf.json` defines `status-popup` hidden by default; mascot window uses a distinct `mascot` label and `window=mascot&companion=buddy` route. | Proven by Rust and frontend smoke tests |
| BLE permission response frames are normalized consistently across frontend and Tauri | React `buildPermissionDecision` and Rust `build_permission_response` trim prompt ids, reject blank ids, and only allow `once`/`deny`. | Proven by frontend and Rust tests |
| Work is checked into repository | Latest completed implementation work is committed and pushed to `origin/main`; this audit will be refreshed again after the documentation cleanup commit. | Proven by `git status --short --branch` and push results |

## Verification Commands Passed

- `npm test` from `buddy-desktop`
- `npm run build` from `buddy-desktop`
- `npm run typecheck` from `buddy-desktop`
- `cargo test` from `buddy-desktop/src-tauri`
- `npm run docs:check` from workspace root
- `npm run smoke:teleport-tools` from workspace root
- `npm run smoke:teleport-runtime` from workspace root
- `git diff --check` from workspace root
- Plain `cargo run` from `buddy-desktop/src-tauri` started `target/debug/buddy-desktop` and spawned `node $HOME/.buddy/server/dist/server/index.js` without the previous missing-sidecar retry loop.

## Remaining Gates

- Native GUI automation is blocked in this host: `cua-driver status` and `cua-driver check_permissions '{"prompt":false}'` both fail because `/Applications/CuaDriver.app/Contents/MacOS/cua-driver` was built for macOS 14 and cannot load `/usr/lib/swift/libswiftObservation.dylib` on this OS.
- Because native GUI automation is unavailable, direct click verification of popup **Pet**, **Observe**, **Return**, and tray/menu-bar behavior remains manual/environment-gated; source/config invariants for tray target selection are covered.
- Browser screenshot automation for the Tauri webview remains unavailable through the required in-app browser Node REPL tool in this session.
- Claude Desktop BLE pairing and real Hardware Buddy permission flow still require manual pairing with Claude Desktop; protocol parsing, fake peripheral behavior, and permission frame serialization are covered by automated tests.

## Audit Conclusion

The terminal-to-desktop and desktop-to-terminal Buddy teleport logic is now strongly covered by source review, unit tests, isolated live Buddy smokes, and bounded native runtime smokes. The specific concern about wrong/random bodies is addressed by removing mock startup state, deriving connection from Buddy payload mood, and verifying live runtime parsing against seeded terminal Buddy DBs.

The goal should remain open until the environment supports native GUI/tray automation or a human manually verifies the popup and tray surfaces, plus real Claude Desktop BLE pairing.
