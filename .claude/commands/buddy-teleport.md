---
description: Teleport the current terminal Buddy into the Buddy Desktop Tauri app.
---

Run the workspace teleport launcher:

```bash
/Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/scripts/buddy-teleport-out.sh
```

This command starts Buddy Desktop with `BUDDY_SIDECAR_PATH` pointed at the installed Buddy MCP server. It uses the normal Buddy database by default (`~/.buddy/buddy.db`), so the desktop app renders the same Buddy that terminal tools use instead of hatching a desktop-only companion.

To isolate a test run, set `BUDDY_DB_PATH` before running the command.
