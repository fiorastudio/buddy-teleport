# BLE Prototype

This folder contains the testable Hardware Buddy protocol seam used before
wiring a real macOS BLE peripheral.

Automated coverage:

- Nordic UART UUID config
- newline-delimited JSON fragmentation
- heartbeat and prompt parsing
- status ack serialization
- permission decision serialization

Manual Claude Desktop gate:

1. Enable Claude Desktop developer mode.
2. Open Hardware Buddy.
3. Run the eventual native peripheral implementation advertising `Claude-XXXX`.
4. Confirm Claude Desktop discovers and connects.
5. Confirm heartbeat JSON arrives.
6. Trigger a permission prompt and confirm `once`/`deny` is accepted.
