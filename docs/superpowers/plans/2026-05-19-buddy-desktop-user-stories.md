# Buddy Desktop - TDD User Story Backlog

**Date:** 2026-05-19  
**Source plan:** `2026-05-19-buddy-desktop-final-plan.md`  
**Tracker format:** GitHub Issues compatible, also maps to Linear/Jira  
**Execution style:** TDD-first, dependency-aware, parallel lanes

---

## Story Format

Each issue uses this shape:

```md
## User Story
As a <user/persona>, I want <capability>, so that <outcome>.

## Acceptance Criteria
- Given ...
- When ...
- Then ...

## TDD Plan
- Write failing test(s)
- Implement smallest change
- Refactor
- Verify command

## Dependencies
- Blocks: ...
- Blocked by: ...

## Parallelization
- Lane: ...
- Can run with: ...
```

Labels:

- `lane:bridge` - TypeScript Buddy bridge
- `lane:shell` - Tauri/Rust native shell
- `lane:ui` - React popup and visual UI
- `lane:ble` - Claude Desktop BLE compatibility
- `lane:packaging` - builds, sidecars, installer, release
- `lane:qa` - tests, fixtures, visual checks
- `type:spike` - proof or feasibility task
- `type:feature` - user-visible feature
- `type:infra` - project/build/tooling
- `type:test` - tests only
- `priority:p0` - MVP blocker
- `priority:p1` - important after MVP
- `priority:p2` - later enhancement

---

## Milestones

| Milestone | Goal | Exit criteria |
|---|---|---|
| M0 - Grounding | Workspace ready and references documented | Read-only reference repos exist; license boundaries documented |
| M1 - Buddy Bridge | Upstream Buddy usable through TS bridge | Bridge returns normalized Buddy state with tests |
| M2 - Tray MVP | Menu bar/tray popup shows Buddy | App launches, tray icon appears, popup renders state |
| M3 - Resilience | MVP can run all day | Bridge restart/offline behavior tested |
| M4 - BLE Proof | Claude Desktop can connect to prototype | `Claude-XXXX` receives heartbeat JSON |
| M5 - BLE Product | Claude session state appears in popup | Prompt overlay can approve/deny |
| M6 - Optional Mascot | Floating mascot is opt-in | User can toggle floating companion window |
| M7 - Character Packs | Local GIF packs work | Valid manifest renders state GIFs, invalid pack falls back |

---

## Dependency Graph

```text
BD-001
  -> BD-002
    -> BD-003 -> BD-004 -> BD-005
    -> BD-006 -> BD-007

BD-005 + BD-007
  -> BD-008 -> BD-009 -> BD-010

BD-010
  -> BD-011
  -> BD-012

BD-013 can start after BD-001
  -> BD-014
    -> BD-015 -> BD-016

BD-016 + BD-010
  -> BD-017 -> BD-018

BD-019 can start after BD-010
  -> BD-020
```

Fastest path:

1. Run `lane:bridge` and `lane:shell` in parallel after BD-001.
2. Start `lane:ui` with mocked state while bridge is still being wired.
3. Start BLE as a standalone spike after references are documented, not after MVP.
4. Delay optional floating mascot and character packs until Tray MVP is stable.

---

## Epic A - Foundation And References

### BD-001 - Establish Workspace References And License Boundaries

Labels: `priority:p0`, `type:infra`, `lane:qa`

## User Story
As a maintainer, I want the upstream reference repos and license boundaries documented, so that implementation can proceed without accidental code copying or license contamination.

## Acceptance Criteria
- Given the workspace, when I inspect the docs, then `buddy`, `claude-desktop-buddy`, and OpenHuman roles are clearly stated.
- Given OpenHuman is GPL-3.0, when implementation starts, then the plan explicitly says inspiration only and no source/assets copied.
- Given Buddy is upstream source of truth, when implementation starts, then Buddy is treated as unchanged/read-only.

## TDD Plan
- Add a docs lint/check script that searches final plan docs for required boundary phrases.
- Write the check to fail if OpenHuman is not marked `inspiration only`.
- Implement any missing doc text.
- Verify with `pnpm docs:check` or a lightweight shell script.

## Dependencies
- Blocks: BD-002, BD-013
- Blocked by: none

## Parallelization
- Lane: QA/docs
- Can run with: none, first task

---

### BD-002 - Scaffold `buddy-desktop` Tauri App

Labels: `priority:p0`, `type:infra`, `lane:shell`

## User Story
As a desktop user, I want an installable app shell, so that Buddy can run as a real menu bar/tray app instead of a terminal script.

## Acceptance Criteria
- Given the workspace, when I run the app in dev mode, then a Tauri app starts without Rust or TypeScript compile errors.
- Given the repo, when I inspect `buddy-desktop/LICENSE`, then it is MIT.
- Given the app scaffold, when I inspect source layout, then it has `src`, `src-tauri`, and room for `bridge`.

## TDD Plan
- Write a smoke script that checks required files and runs `pnpm exec tsc --noEmit`.
- Run it and see it fail before scaffold.
- Scaffold Tauri v2 React TypeScript app.
- Add MIT license.
- Verify with `pnpm --dir buddy-desktop exec tsc --noEmit` and `cargo check`.

## Dependencies
- Blocks: BD-006, BD-008
- Blocked by: BD-001

## Parallelization
- Lane: shell
- Can run with: BD-003 after root structure is agreed

---

## Epic B - TypeScript Buddy Bridge

### BD-003 - Create Bridge Package Skeleton

Labels: `priority:p0`, `type:infra`, `lane:bridge`

## User Story
As a developer, I want a separate TypeScript bridge package, so that all Buddy-specific MCP compatibility stays close to upstream Buddy and out of Rust.

## Acceptance Criteria
- Given `buddy-desktop/bridge`, when I run bridge tests, then the test runner executes.
- Given the bridge package, when I inspect its modules, then it has `mcpClient`, `buddyProcess`, `stateMapper`, and `protocol`.
- Given Rust shell code, when I inspect it, then no Rust Buddy MCP parser exists.

## TDD Plan
- Add failing test import for `normalizeBuddyState`.
- Add minimal bridge package and test config.
- Export placeholder modules.
- Verify with `pnpm --dir buddy-desktop/bridge test`.

## Dependencies
- Blocks: BD-004, BD-005
- Blocked by: BD-001

## Parallelization
- Lane: bridge
- Can run with: BD-002, BD-006

---

### BD-004 - Implement MCP JSON-RPC Client In TypeScript

Labels: `priority:p0`, `type:feature`, `lane:bridge`

## User Story
As the app shell, I want the bridge to speak MCP over stdio, so that it can call upstream Buddy without reimplementing Buddy internals.

## Acceptance Criteria
- Given a mock stdio MCP server, when the bridge initializes, then it sends `initialize` and `notifications/initialized`.
- Given a tool call request, when the mock server responds, then the bridge resolves the matching request by JSON-RPC id.
- Given malformed JSON or timeout, when the bridge waits for a response, then it returns a controlled error.

## TDD Plan
- Write tests with a fake line-based child process or in-memory duplex stream.
- First test initialize handshake.
- Second test `tools/call`.
- Third test malformed line and timeout.
- Implement JSON-RPC id correlation and newline framing.
- Verify with `pnpm --dir buddy-desktop/bridge test`.

## Dependencies
- Blocks: BD-005
- Blocked by: BD-003

## Parallelization
- Lane: bridge
- Can run with: BD-006, BD-007 once interfaces are agreed

---

### BD-005 - Normalize Buddy Status Into Desktop State

Labels: `priority:p0`, `type:feature`, `lane:bridge`

## User Story
As a Buddy user, I want the app to display my Buddy's current name, level, XP, species, and stats, so that the desktop companion reflects the real upstream Buddy state.

## Acceptance Criteria
- Given a current Buddy `buddy_status` response, when `stateMapper` runs, then it returns typed `BuddyState`.
- Given a stat card text fixture, when parsing runs, then name, rarity, species, level, XP, and stats are extracted.
- Given a future structured response, when mapping runs, then structured fields are preferred over text parsing.
- Given an unrecognized response, when mapping runs, then it returns an explicit error and does not crash.

## TDD Plan
- Add fixtures for current stat card response and expected normalized state.
- Add structured-response fixture even if upstream does not provide it yet.
- Write failing mapper tests.
- Implement mapper.
- Refactor parser behind a narrow function.
- Verify with `pnpm --dir buddy-desktop/bridge test`.

## Dependencies
- Blocks: BD-008, BD-009
- Blocked by: BD-004

## Parallelization
- Lane: bridge
- Can run with: BD-006 and BD-007 after type contract is agreed

---

## Epic C - Tray Shell And Popup MVP

### BD-006 - Define Shared App State Contract

Labels: `priority:p0`, `type:infra`, `lane:ui`

## User Story
As frontend and shell code, we want one shared state contract, so that bridge, Tauri events, and React UI all agree on payload shape.

## Acceptance Criteria
- Given the TypeScript app, when importing `BuddyState`, then fields match bridge output.
- Given mocked state, when React components render, then no missing/null field crashes occur.
- Given future Claude fields, when absent in MVP, then UI still renders Buddy-only state.

## TDD Plan
- Add TypeScript type tests or component tests with minimum and full states.
- Define `BuddyState`, `ClaudeSessionState`, and `MascotState`.
- Add default offline state.
- Verify with `pnpm --dir buddy-desktop exec tsc --noEmit`.

## Dependencies
- Blocks: BD-007, BD-009, BD-017
- Blocked by: BD-002

## Parallelization
- Lane: UI
- Can run with: BD-003, BD-004

---

### BD-007 - Build Status Popup UI Against Mock State

Labels: `priority:p0`, `type:feature`, `lane:ui`

## User Story
As a user, I want a compact popup showing Buddy status, so that I can quickly glance at Buddy without keeping a window open.

## Acceptance Criteria
- Given mock Buddy state, when the popup renders, then it shows name, species, level, XP, stats, and character display.
- Given offline state, when the popup renders, then it shows a quiet sleeping/offline status.
- Given long text fields, when rendered in the popup, then layout does not overflow.
- Given no Claude session state, when rendered, then the popup does not show empty Claude UI.

## TDD Plan
- Add component tests for online, offline, and long-text states.
- Implement `StatusPopup`, `BuddyStats`, `CharacterDisplay`.
- Add basic responsive CSS constraints for compact popup.
- Verify with `pnpm --dir buddy-desktop exec tsc --noEmit` and component tests.

## Dependencies
- Blocks: BD-009
- Blocked by: BD-006

## Parallelization
- Lane: UI
- Can run with: BD-004, BD-005

---

### BD-008 - Launch And Monitor Bridge From Tauri

Labels: `priority:p0`, `type:feature`, `lane:shell`

## User Story
As the app shell, I want to launch and monitor the TypeScript Buddy bridge, so that Buddy state is available without putting MCP logic in Rust.

## Acceptance Criteria
- Given the app starts, when bridge binary/script is available, then Tauri launches it.
- Given the bridge emits a state line, when Tauri reads it, then Tauri stores and emits the state to React.
- Given the bridge exits unexpectedly, when backoff elapses, then Tauri restarts it.
- Given bridge is unavailable, when app starts, then app remains alive and reports offline state.

## TDD Plan
- Write Rust tests around bridge line parsing and backoff state machine.
- Use a fake bridge process/script in integration tests.
- Implement `bridge_process.rs`.
- Verify with `cargo test` and `cargo check`.

## Dependencies
- Blocks: BD-009, BD-011
- Blocked by: BD-002, BD-005

## Parallelization
- Lane: shell
- Can run with: BD-007 after bridge output contract is frozen

---

### BD-009 - Connect Popup To Live Bridge State

Labels: `priority:p0`, `type:feature`, `lane:ui`

## User Story
As a user, I want the tray popup to update from real Buddy state, so that the UI reflects what upstream Buddy reports.

## Acceptance Criteria
- Given Tauri emits `mascot-state-updated`, when popup is open, then UI updates without reload.
- Given no event has arrived, when popup opens, then it shows cached/default state.
- Given bridge offline event, when popup is open, then UI changes to sleeping/offline state.

## TDD Plan
- Add frontend tests around event subscription wrapper with fake event source.
- Add Rust event payload fixture test.
- Wire Tauri event to React state.
- Verify with `pnpm --dir buddy-desktop exec tsc --noEmit`, component tests, and manual dev run.

## Dependencies
- Blocks: BD-010
- Blocked by: BD-005, BD-007, BD-008

## Parallelization
- Lane: UI/shell integration
- Can run after bridge and shell contracts stabilize

---

### BD-010 - Implement Menu Bar / Tray App Behavior

Labels: `priority:p0`, `type:feature`, `lane:shell`

## User Story
As a desktop user, I want Buddy to live in the menu bar/tray, so that it creates no screen clutter when idle.

## Acceptance Criteria
- Given the app is running on macOS, when I look at the menu bar, then Buddy icon is present.
- Given I click the icon, when popup is closed, then popup opens near the menu bar.
- Given I click away, when popup is open, then popup hides.
- Given no floating mode is enabled, when app is idle, then no persistent desktop window is visible.

## TDD Plan
- Write Rust unit tests for tray state transitions where possible.
- Add integration smoke script for app startup.
- Implement `tray.rs` and popup window lifecycle.
- Manual verify on macOS.

## Dependencies
- Blocks: BD-011, BD-012, BD-017
- Blocked by: BD-009

## Parallelization
- Lane: shell
- Critical path for MVP

---

## Epic D - Resilience And Interaction

### BD-011 - Add Bridge `call_tool` For Buddy Interactions

Labels: `priority:p1`, `type:feature`, `lane:bridge`

## User Story
As a Buddy user, I want popup actions like pet or dream to call real Buddy tools, so that interactions update upstream Buddy instead of being UI-only.

## Acceptance Criteria
- Given a supported tool name, when UI calls `call_tool`, then bridge sends MCP `tools/call`.
- Given the tool succeeds, when response arrives, then bridge emits updated state.
- Given a tool fails, when response arrives, then UI receives a non-crashing error state.
- Given an unsupported tool name, when requested, then bridge rejects it before calling upstream.

## TDD Plan
- Add bridge tests for allowlisted tool call.
- Add test for unsupported tool rejection.
- Add UI command tests with fake bridge response.
- Implement bridge `call_tool` and Tauri command forwarding.

## Dependencies
- Blocks: BD-012
- Blocked by: BD-008, BD-010

## Parallelization
- Lane: bridge
- Can run while BLE spike proceeds

---

### BD-012 - MVP End-To-End Smoke Test

Labels: `priority:p0`, `type:test`, `lane:qa`

## User Story
As a maintainer, I want a repeatable MVP smoke test, so that we know the tray Buddy app works end to end before adding BLE.

## Acceptance Criteria
- Given dev prerequisites are installed, when I run the smoke checklist, then bridge starts and tray popup renders Buddy state.
- Given bridge process is killed, when app continues running, then offline state appears and bridge restarts.
- Given upstream Buddy remains unchanged, when smoke completes, then no files under `buddy/` are modified.

## TDD Plan
- Create a smoke test checklist and automate what can be automated.
- Add a fake bridge mode for deterministic UI screenshots.
- Verify manually on macOS for tray behavior.

## Dependencies
- Blocks: BD-017 product integration confidence
- Blocked by: BD-010, BD-011 optional for interactions

## Parallelization
- Lane: QA
- Runs at milestone boundary

---

## Epic E - BLE Prototype And Integration

### BD-013 - Define BLE Protocol Fixtures

Labels: `priority:p0`, `type:test`, `lane:ble`

## User Story
As a BLE implementer, I want protocol fixtures from `claude-desktop-buddy`, so that BLE parsing can be tested without connecting to Claude Desktop every time.

## Acceptance Criteria
- Given heartbeat JSON fixture, when parser runs, then session fields match expected values.
- Given prompt fixture, when parser runs, then pending prompt id/tool/hint are extracted.
- Given `status`, `name`, `owner`, and `unpair` command fixtures, when parser runs, then command variants are identified.
- Given fragmented lines, when line buffer receives chunks, then it emits complete JSON only after newline.

## TDD Plan
- Write parser tests from `REFERENCE.md` examples.
- Write line-buffer fragmentation tests.
- Implement `ble/protocol` parser independent of BLE transport.
- Verify with `cargo test ble_protocol` or TS tests if prototype is Swift/TS.

## Dependencies
- Blocks: BD-014, BD-017
- Blocked by: BD-001

## Parallelization
- Lane: BLE
- Can run in parallel with Buddy Bridge MVP

---

### BD-014 - Spike Rust BLE Peripheral Mode

Labels: `priority:p0`, `type:spike`, `lane:ble`

## User Story
As a technical lead, I want to prove whether Rust can advertise as a BLE peripheral on macOS, so that we choose the simplest reliable native BLE layer.

## Acceptance Criteria
- Given the prototype runs, when scanning from Claude Desktop Hardware Buddy window, then `Claude-XXXX` appears.
- Given Claude connects, when it writes heartbeat JSON, then prototype logs parsed state.
- Given Claude sends `status`, when prototype receives it, then prototype sends a valid status ack over TX.
- Given a prompt arrives, when prototype sends permission response, then Claude accepts or logs expected behavior.

## TDD Plan
- Reuse BD-013 parser tests.
- Build smallest Rust `btleplug` peripheral prototype.
- Add unit tests around line buffering and status ack serialization.
- Manual verify with Claude Desktop developer mode.

## Dependencies
- Blocks: BD-015
- Blocked by: BD-013

## Parallelization
- Lane: BLE
- Can run while tray MVP is being built

---

### BD-015 - Spike Swift/CoreBluetooth Helper Fallback

Labels: `priority:p1`, `type:spike`, `lane:ble`

## User Story
As a technical lead, I want a fallback Swift/CoreBluetooth helper plan, so that BLE does not block the product if Rust peripheral mode is unreliable.

## Acceptance Criteria
- Given Rust BLE spike fails or is unstable, when Swift helper runs, then it can advertise `Claude-XXXX`.
- Given the helper receives a heartbeat line, when it parses it, then it emits JSON to stdout or local IPC.
- Given Tauri starts helper, when helper emits session state, then shell can consume it through the same protocol shape.

## TDD Plan
- Define helper IPC contract with fixtures.
- Write parser/serializer tests independent of CoreBluetooth.
- Implement minimal helper only if BD-014 is not sufficient.

## Dependencies
- Blocks: BD-016 if selected
- Blocked by: BD-014 decision

## Parallelization
- Lane: BLE
- Do not implement fully unless Rust path is blocked

---

### BD-016 - Decide BLE Implementation Path

Labels: `priority:p0`, `type:spike`, `lane:ble`

## User Story
As a maintainer, I want a documented BLE implementation decision, so that product integration proceeds on a proven path.

## Acceptance Criteria
- Given Rust spike results, when reviewed, then decision says `Rust btleplug` or `Swift helper`.
- Given decision is made, when implementation starts, then only one integration path is active.
- Given fallback exists, when chosen path regresses, then fallback criteria are documented.

## TDD Plan
- No code test required.
- Add decision record with spike evidence and commands.
- Link to parser tests and manual Claude Desktop verification.

## Dependencies
- Blocks: BD-017
- Blocked by: BD-014 and optionally BD-015

## Parallelization
- Lane: BLE
- Decision gate

---

### BD-017 - Integrate Claude Session State Into Popup

Labels: `priority:p1`, `type:feature`, `lane:ble`, `lane:ui`

## User Story
As a Claude Desktop user, I want Buddy's popup to show Claude session activity, so that the companion reflects running, waiting, and idle states.

## Acceptance Criteria
- Given Claude is connected and `running > 0`, when popup renders, then it shows busy state.
- Given `waiting > 0` or `prompt` exists, when popup renders, then it shows attention state and prompt details.
- Given no heartbeat for 30 seconds, when popup renders, then it shows disconnected/dizzy state.
- Given Buddy bridge is online and Claude is disconnected, when popup renders, then Buddy state still works.

## TDD Plan
- Add state reducer tests for animation precedence.
- Add UI tests for running, waiting, prompt, disconnected states.
- Wire BLE session events into shared `MascotState`.
- Verify with fake BLE session and real prototype.

## Dependencies
- Blocks: BD-018
- Blocked by: BD-010, BD-013, BD-016

## Parallelization
- Lane: BLE/UI
- Can be split: reducer tests, UI prompt surface, native event wiring

---

### BD-018 - Approve/Deny Permission Prompt From Popup

Labels: `priority:p1`, `type:feature`, `lane:ble`, `lane:ui`

## User Story
As a Claude Desktop user, I want to approve or deny permission prompts from Buddy's popup, so that I can respond without switching windows.

## Acceptance Criteria
- Given a pending prompt, when popup opens, then tool and hint are visible.
- Given user clicks approve once, when BLE layer sends response, then JSON is `{"cmd":"permission","id":"...","decision":"once"}`.
- Given user clicks deny, when BLE layer sends response, then JSON is `{"cmd":"permission","id":"...","decision":"deny"}`.
- Given BLE send fails, when user clicks action, then UI shows failure without losing prompt context.

## TDD Plan
- Add UI tests for prompt overlay and button actions.
- Add BLE serializer tests for permission response.
- Add integration test with fake BLE transport.
- Manual verify with Claude Desktop prompt.

## Dependencies
- Blocks: none
- Blocked by: BD-017

## Parallelization
- Lane: BLE/UI
- UI can start with fake send function before transport is wired

---

## Epic F - Optional Enhancements

### BD-019 - Add Opt-In Floating Mascot Window

Labels: `priority:p2`, `type:feature`, `lane:shell`, `lane:ui`

## User Story
As a Buddy fan, I want an optional floating mascot window, so that Buddy can stay visible when I choose.

## Acceptance Criteria
- Given floating mode is off, when app starts, then no floating window appears.
- Given user enables floating mode, when app applies setting, then a compact always-on-top mascot appears.
- Given user disables floating mode, when setting changes, then floating window closes.
- Given tray popup is used, when floating mode is active, then both surfaces reflect same state.

## TDD Plan
- Add settings reducer tests.
- Add shell tests for create/close window commands where possible.
- Implement standard frameless Tauri window first.
- Only add `NSPanel` if standard window fails UX requirements.

## Dependencies
- Blocks: BD-020 optional visual reuse
- Blocked by: BD-010

## Parallelization
- Lane: shell/UI
- Can run after MVP; not on critical path

---

### BD-020 - Load Local Character Packs

Labels: `priority:p2`, `type:feature`, `lane:ui`

## User Story
As a user, I want Buddy to use local GIF character packs, so that the desktop companion can share visual assets with hardware buddy packs.

## Acceptance Criteria
- Given a valid pack in `~/.buddy/characters/<pack>`, when selected, then `CharacterDisplay` renders the GIF for current state.
- Given `idle` has multiple frames, when displayed, then frames can rotate or select deterministically.
- Given an invalid manifest, when selected, then UI falls back to ASCII without crashing.
- Given a path contains `..` or absolute traversal, when loaded, then it is rejected.

## TDD Plan
- Add manifest validation tests.
- Add path safety tests.
- Add `CharacterDisplay` tests for GIF vs ASCII fallback.
- Implement local pack loader.

## Dependencies
- Blocks: future BLE folder push
- Blocked by: BD-007 or BD-019 depending on target surface

## Parallelization
- Lane: UI
- Can run after popup UI is stable

---

## Recommended Parallel Work Plan

### Sprint 1 - MVP Foundation

Parallel lanes:

- Worker A, Bridge: BD-003, BD-004, BD-005
- Worker B, Shell: BD-002, BD-008 foundation
- Worker C, UI: BD-006, BD-007 with mock state
- Worker D, BLE: BD-013 fixtures

Synchronization point:

- Bridge output contract from BD-005 and shared state contract from BD-006 must align before BD-009.

### Sprint 2 - Tray MVP

Parallel lanes:

- Worker A, Shell/UI integration: BD-009, BD-010
- Worker B, Bridge interactions: BD-011
- Worker C, BLE prototype: BD-014
- Worker D, QA: BD-012 fake bridge smoke harness

Synchronization point:

- BD-010 and BD-012 define MVP ready.
- BD-014 determines BLE feasibility.

### Sprint 3 - BLE Product Slice

Parallel lanes:

- Worker A, BLE integration path: BD-016, native integration
- Worker B, State/UI: BD-017 reducer and popup states
- Worker C, Permission UX: BD-018 UI with fake sender
- Worker D, Optional enhancements: BD-019 spike or BD-020 local pack loader

Synchronization point:

- BD-018 manual verification with Claude Desktop.

---

## Critical Path

Minimum product without BLE:

```text
BD-001 -> BD-002 -> BD-006 -> BD-007
BD-001 -> BD-003 -> BD-004 -> BD-005
BD-005 + BD-007 -> BD-008 -> BD-009 -> BD-010 -> BD-012
```

Minimum product with Claude Desktop BLE:

```text
Tray MVP path
BD-001 -> BD-013 -> BD-014 -> BD-016 -> BD-017 -> BD-018
```

---

## Definition Of Done

For every implementation issue:

- Failing test exists before implementation where feasible.
- Acceptance criteria are covered by automated tests or explicit manual verification.
- No Buddy upstream source files are modified.
- No OpenHuman code or assets are copied.
- Rust shell does not parse Buddy MCP responses.
- New user-facing behavior is documented in the relevant plan/review doc.
