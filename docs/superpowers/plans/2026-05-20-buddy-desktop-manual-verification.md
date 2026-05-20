# Buddy Desktop Manual Verification Checklist

**Date:** 2026-05-20

Use this checklist on a macOS host where native GUI automation and Claude Desktop BLE pairing are available. The automated suite already covers parser/state/tool invariants; these steps close the remaining environment-gated checks from the completion audit.

## Before Starting

1. Confirm the checkout is current:
   ```bash
   git status --short --branch
   git log --oneline -3
   ```
2. Confirm the installed terminal Buddy is available:
   ```bash
   test -f "$HOME/.buddy/server/dist/server/index.js"
   ```
3. Start the desktop teleport launcher:
   ```bash
   ./scripts/buddy-teleport-out.sh
   ```

Optional host preflight:

```bash
npm run check:manual-gates
```

This reports whether the installed Buddy MCP entry exists and whether native GUI automation is available on the current host. A blocked native automation result means the checklist can still be completed manually, but it cannot be automated with `cua-driver` on that host.

## Terminal Buddy Identity

Pass criteria:

- The floating mascot and tray popup show the same Buddy name, species/rarity, level, XP, stat values, personality text, reaction text, and ASCII body currently shown by terminal `buddy_status`.
- No random desktop-only Buddy appears during startup, before the first poll, or after opening the tray popup.
- The UI starts from the shared offline default only until terminal Buddy state arrives.

Evidence to record:

- Terminal `buddy_status` output.
- Screenshot or screen recording of the floating mascot after startup.
- Screenshot or screen recording of the tray popup after opening it.

## Popup Actions

Pass criteria:

- **Pet** calls the real `buddy_pet` path and refreshes the visible Buddy without changing identity/body.
- **Observe** calls the real `buddy_observe` path and refreshes the visible Buddy without changing identity/body.
- Both actions preserve the same Buddy DB used by terminal Buddy.

Evidence to record:

- Before/after terminal `buddy_status` output.
- Before/after tray popup screenshots.
- Any app logs that show the sidecar path and Buddy DB path.

## Return To Terminal

Pass criteria:

- Clicking **Return** records a desktop return `buddy_observe`.
- The popup and mascot switch to offline/sleeping state.
- Desktop polling stops until the next teleport-out.
- Running terminal `buddy_status` after return shows the same Buddy identity/body, with no hatch or identity reset.

Evidence to record:

- Screen recording of clicking **Return**.
- Terminal `buddy_status` output after return.
- App log line or terminal output showing the return path completed.

## Tray/Menu Bar

Pass criteria:

- Clicking the Buddy menu-bar/tray icon opens the `status-popup` window, not the floating `mascot` window.
- The popup starts hidden and only appears from tray interaction.
- The Quit menu item exits the app without triggering other tray items.

Evidence to record:

- Screen recording of tray click opening the popup.
- Screen recording or log evidence for Quit behavior.

## Claude Desktop BLE Pairing

Pass criteria:

- Claude Desktop discovers the Buddy Desktop Hardware Buddy peripheral.
- Heartbeat/session state is reflected in the desktop UI.
- A permission prompt from Claude Desktop appears in the desktop UI.
- **Approve once** sends a `once` permission response with the prompt id.
- **Deny** sends a `deny` permission response with the prompt id.
- Blank, stale, or mismatched prompt ids are not accepted.

Evidence to record:

- Claude Desktop pairing screen or connection evidence.
- Desktop UI screenshot showing session/prompt state.
- Logs or captured BLE frames showing `once` and `deny` responses.

## Current Automation Limitation

Native GUI automation is currently blocked on this host because `cua-driver` is built for macOS 14 and fails to load `/usr/lib/swift/libswiftObservation.dylib`. Until a compatible host or driver is available, the GUI/tray and real Claude Desktop BLE checks above remain manual.
