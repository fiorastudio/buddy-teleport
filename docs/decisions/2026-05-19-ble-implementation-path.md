# BLE Implementation Path Decision

**Date:** 2026-05-19  
**Status:** Provisional, pending manual Claude Desktop connection test

## Decision

Use a transport abstraction for the Claude Desktop Hardware Buddy BLE layer.

The current implementation includes a tested protocol/prototype seam in
`buddy-desktop/ble-prototype`. It confirms:

- `Claude-XXXX` advertisement config shape.
- Nordic UART UUID constants.
- fragmented newline-delimited JSON handling.
- heartbeat and prompt parsing.
- status ack serialization.
- permission response serialization.

## Current Path

Default integration path remains Rust/Tauri if macOS BLE peripheral mode proves
reliable.

## Fallback

If Rust peripheral mode cannot advertise or accept Claude Desktop connections
reliably, use a Swift/CoreBluetooth helper process and keep the same JSON
transport contract between helper and Tauri.

## Manual Gate Still Required

This workspace cannot complete the hardware-level acceptance gate by itself:

- Claude Desktop developer mode must be available.
- The Hardware Buddy window must scan for and connect to `Claude-XXXX`.
- The app must receive heartbeat JSON from Claude Desktop.
- The app must send a permission response accepted by Claude Desktop.

Until that manual test passes, BLE product integration should use the fake
transport/prototype for automated tests only.
