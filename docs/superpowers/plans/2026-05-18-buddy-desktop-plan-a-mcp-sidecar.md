# Buddy Desktop — Plan A: MCP Sidecar → Mascot Window

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run fiorastudio/buddy as a Tauri sidecar and display its virtual pet state in the openhuman floating mascot window on macOS.

**Architecture:** New MIT-licensed Tauri v2 app (openhuman used as design reference only — not forked; openhuman is GPL-3.0). The Rust backend spawns buddy's compiled Node.js binary as a sidecar via `tauri-plugin-shell`, acts as an MCP client over stdio, and polls `buddy_status` every 2 seconds. Parsed state is cached in a `Mutex<BuddyMcpState>` and emitted to the React frontend as a `mascot-state-updated` Tauri event. The mascot window is a transparent always-on-top floating window: on macOS, an `NSPanel` + `WKWebView` via the `objc2` crate (same pattern as openhuman, written from scratch); on other platforms, a standard frameless Tauri window with `transparent: true` and `alwaysOnTop: true`.

**Tech Stack:** Tauri v2, Rust (tokio, serde_json, tauri-plugin-shell, objc2 for macOS), React + TypeScript + Vite, Node.js pkg (sidecar bundling), pnpm.

---

## File Map

**New Rust files (`buddy-desktop/src-tauri/src/`):**
- `buddy_sidecar.rs` — spawn/kill buddy process, own stdin/stdout, newline-delimited JSON-RPC framing
- `buddy_client.rs` — MCP client: `initialize_session()`, `call_tool()`, stat card text parser
- `buddy_poll.rs` — 2-second polling loop as a Tokio background task
- `buddy_commands.rs` — Tauri commands exposed to frontend (`buddy_tool`, `buddy_get_state`)
- `mascot_state.rs` — `BuddyMcpState` struct, `AnimationState` enum, `emit_mascot_event()`

**Modified Rust files:**
- `buddy-desktop/src-tauri/Cargo.toml` — add `serde_json`, `regex`, `tokio` features
- `buddy-desktop/src-tauri/src/lib.rs` — register commands, init sidecar + poll on app start

**Modified Tauri config:**
- `buddy-desktop/src-tauri/tauri.conf.json` — add `bundle.externalBin`, `plugins.shell.sidecar`

**New React files (`buddy-desktop/src/`):**
- `src/components/BuddyMascot.tsx` — root mascot component, event subscription, state dispatch
- `src/components/BuddyStats.tsx` — level, XP bar, personality stats display
- `src/components/CharacterDisplay.tsx` — ASCII art renderer

**Modified React files:**
- `src/main.tsx` — add `?window=mascot&companion=buddy` branch

**Build scripts:**
- `scripts/build-buddy-sidecar.sh` — pkg compilation to `buddy-desktop/src-tauri/binaries/`

---

## Task 1: Scaffold new Tauri app + clone buddy

**Files:**
- Create: `buddy-desktop/` (new Tauri v2 app, MIT licensed)
- Create: `buddy/` (git clone of fiorastudio/buddy — read-only, never modified)

> **License note:** openhuman is GPL-3.0. We are NOT cloning or forking it. We scaffold a fresh Tauri app and implement the mascot window from scratch, referencing openhuman's approach as a design specification only.

- [ ] **Step 1: Check prerequisites**

```bash
node --version    # need 18+
rustc --version   # need 1.77+
cargo --version
pnpm --version    # need 8+
```

If pnpm is missing: `npm install -g pnpm`

- [ ] **Step 2: Scaffold new Tauri v2 app**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport
pnpm create tauri-app@latest buddy-desktop
```

When prompted:
- Project name: `buddy-desktop`
- Frontend language: `TypeScript / JavaScript`
- Package manager: `pnpm`
- UI template: `React` → `React + TypeScript`

```bash
cd buddy-desktop
pnpm install
```

- [ ] **Step 3: Verify the scaffold builds**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
pnpm tauri dev 2>&1 | head -30
```

Expected: Tauri window opens with the React boilerplate. Ctrl-C after it appears.

- [ ] **Step 4: Add MIT license file**

Create `/Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop/LICENSE`:

```
MIT License

Copyright (c) 2026 buddy-desktop contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 5: Clone buddy (read-only reference + sidecar source)**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport
git clone https://github.com/fiorastudio/buddy.git
```

Expected: directory `buddy/` with `src/`, `package.json`, etc.

- [ ] **Step 6: Build buddy**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy
npm install
npm run build
ls dist/
```

Note the exact path of the compiled entry file (likely `dist/server/index.js` or `dist/index.js`).

- [ ] **Step 7: Init git and commit**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport
git init
echo "buddy/\nbuddy-desktop/node_modules/\nbuddy-desktop/src-tauri/target/" > .gitignore
git add CLAUDE.md LICENSE scripts/ docs/
git commit -m "chore: init workspace with MIT license"

cd buddy-desktop
git init
git add .
git commit -m "chore: scaffold Tauri v2 + React + TypeScript app (MIT)"
```

---

## Task 2: Implement floating mascot window (NSPanel on macOS)

**Files:**
- Create: `buddy-desktop/src-tauri/src/mascot_window.rs`
- Modify: `buddy-desktop/src-tauri/src/lib.rs`
- Modify: `buddy-desktop/src-tauri/Cargo.toml`
- Modify: `buddy-desktop/src-tauri/tauri.conf.json`

This implements a transparent always-on-top floating window. On macOS we use `NSPanel` + `WKWebView` via the `objc2` crate (the same architectural pattern as openhuman — written from scratch). On other platforms we use a standard Tauri frameless window with `transparent: true`.

- [ ] **Step 1: Add macOS dependencies to Cargo.toml**

In `buddy-desktop/src-tauri/Cargo.toml`, add to `[dependencies]`:

```toml
[target.'cfg(target_os = "macos")'.dependencies]
objc2 = "0.5"
objc2-app-kit = { version = "0.2", features = ["NSPanel", "NSWindow", "NSView"] }
objc2-foundation = { version = "0.2", features = ["NSString", "NSURL"] }
objc2-web-kit = { version = "0.2", features = ["WKWebView", "WKWebViewConfiguration"] }
```

- [ ] **Step 2: Verify Cargo build still compiles**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop/src-tauri
cargo build 2>&1 | tail -10
```

Expected: `Finished` with no errors.

- [ ] **Step 3: Create mascot_window.rs**

Create `buddy-desktop/src-tauri/src/mascot_window.rs`:

```rust
use tauri::{AppHandle, Manager};

/// Spawn the floating buddy mascot window.
/// On macOS: uses NSPanel + WKWebView for a transparent always-on-top panel.
/// On other platforms: uses a standard Tauri window with frameless + transparent + alwaysOnTop.
pub fn create_mascot_window(app: &AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        create_mascot_window_macos(app)
    }
    #[cfg(not(target_os = "macos"))]
    {
        create_mascot_window_crossplatform(app)
    }
}

#[cfg(not(target_os = "macos"))]
fn create_mascot_window_crossplatform(app: &AppHandle) -> Result<(), String> {
    tauri::WebviewWindowBuilder::new(app, "mascot", tauri::WebviewUrl::App("index.html?window=mascot&companion=buddy".into()))
        .title("buddy")
        .inner_size(240.0, 400.0)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(target_os = "macos")]
fn create_mascot_window_macos(app: &AppHandle) -> Result<(), String> {
    use objc2::rc::Retained;
    use objc2_app_kit::{NSPanel, NSWindowStyleMask, NSWindowCollectionBehavior};
    use objc2_foundation::{NSRect, NSPoint, NSSize};

    // Determine the URL to load
    let url_string = if cfg!(debug_assertions) {
        // In dev, Tauri's dev server URL is typically localhost:1420
        "http://localhost:1420/?window=mascot&companion=buddy".to_string()
    } else {
        // In prod, load the bundled index.html
        // Tauri's resource resolver handles this — use the crossplatform window
        // for prod until native URL resolution is confirmed
        return create_mascot_window_crossplatform(app);
    };

    unsafe {
        use objc2_foundation::{NSString, NSURL};
        use objc2_web_kit::{WKWebView, WKWebViewConfiguration};
        use objc2_app_kit::NSScreen;
        use objc2::ClassType;

        // Get screen dimensions for initial position (bottom-right)
        let screen_frame = NSScreen::mainScreen()
            .map(|s| s.frame())
            .unwrap_or(NSRect::new(NSPoint::new(0.0, 0.0), NSSize::new(1440.0, 900.0)));

        let width = 240.0_f64;
        let height = 400.0_f64;
        let x = screen_frame.size.width - width - 20.0;
        let y = 60.0;

        let frame = NSRect::new(NSPoint::new(x, y), NSSize::new(width, height));

        // NSPanel: floating window that doesn't steal focus
        let style_mask = NSWindowStyleMask::Titled
            | NSWindowStyleMask::Closable
            | NSWindowStyleMask::FullSizeContentView;

        let panel = NSPanel::alloc();
        let panel = NSPanel::initWithContentRect_styleMask_backing_defer(
            panel,
            frame,
            style_mask,
            objc2_app_kit::NSBackingStoreType::NSBackingStoreBuffered,
            false,
        );

        panel.setTitlebarAppearsTransparent(true);
        panel.setMovableByWindowBackground(true);
        panel.setBackgroundColor(
            &objc2_app_kit::NSColor::clearColor()
        );
        panel.setOpaque(false);
        panel.setHasShadow(false);
        panel.setLevel(objc2_app_kit::NSWindowLevel(
            objc2_app_kit::NSFloatingWindowLevel.0 + 1
        ));
        panel.setCollectionBehavior(
            NSWindowCollectionBehavior::CanJoinAllSpaces
                | NSWindowCollectionBehavior::Stationary
        );

        // WKWebView filling the panel
        let config = WKWebViewConfiguration::new();
        let webview = WKWebView::initWithFrame_configuration(
            WKWebView::alloc(),
            frame,
            &config,
        );
        webview.setOpaque(false);
        webview.layer()
            .map(|l| l.setBackgroundColor(std::ptr::null_mut()));

        let ns_url = NSURL::URLWithString(
            &NSString::from_str(&url_string)
        ).ok_or("invalid URL")?;
        let request = objc2_foundation::NSURLRequest::requestWithURL(&ns_url);
        webview.loadRequest(&request);

        panel.setContentView(Some(&*webview));
        panel.makeKeyAndOrderFront(None);

        // Store reference so it isn't dropped
        app.manage(PanelHolder { _panel: panel, _webview: webview });
    }
    Ok(())
}

#[cfg(target_os = "macos")]
struct PanelHolder {
    _panel: objc2::rc::Retained<objc2_app_kit::NSPanel>,
    _webview: objc2::rc::Retained<objc2_web_kit::WKWebView>,
}

#[cfg(target_os = "macos")]
unsafe impl Send for PanelHolder {}
#[cfg(target_os = "macos")]
unsafe impl Sync for PanelHolder {}
```

> **Note:** The exact objc2 API surface for NSPanel and WKWebView changes between versions. Verify the method names compile and adjust if needed — the pattern (NSPanel + WKWebView + clearColor background) is correct, individual method signatures may need minor fixes based on the exact objc2-app-kit version available.

- [ ] **Step 4: Register module and call from lib.rs**

In `buddy-desktop/src-tauri/src/lib.rs`, add:

```rust
mod mascot_window;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            mascot_window::create_mascot_window(app.handle())
                .unwrap_or_else(|e| eprintln!("mascot window error: {e}"));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 5: Enable privateApi in tauri.conf.json (macOS)**

In `buddy-desktop/src-tauri/tauri.conf.json`, add to the `app` section:

```json
"macOSPrivateApi": true
```

- [ ] **Step 6: Verify dev build opens mascot window**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
pnpm tauri dev 2>&1 | head -40
```

Expected: a floating transparent window appears showing the React app content. If NSPanel API errors appear, check objc2 version compatibility and adjust method signatures.

- [ ] **Step 7: Commit**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
git add src-tauri/src/mascot_window.rs src-tauri/src/lib.rs src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "feat: floating mascot window via NSPanel+WKWebView (macOS) and frameless window (cross-platform)"
```

---

## Task 3: Build buddy sidecar binary

**Files:**
- Create: `scripts/build-buddy-sidecar.sh`
- Create: `buddy-desktop/src-tauri/binaries/buddy-server-aarch64-apple-darwin` (output)

- [ ] **Step 1: Install pkg**

```bash
npm install -g @vercel/pkg
pkg --version
```

Expected: version string like `5.x.x`.

- [ ] **Step 2: Verify buddy entry point path**

```bash
ls /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy/dist/
```

If the compiled file is at `dist/server/index.js`, use that. If it's at `dist/index.js`, adjust the script below accordingly.

- [ ] **Step 3: Create build script**

```bash
mkdir -p /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/scripts
```

Write `/Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/scripts/build-buddy-sidecar.sh`:

```bash
#!/usr/bin/env bash
set -e

WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
BUDDY_DIR="$WORKSPACE/buddy"
OUT_DIR="$WORKSPACE/buddy-desktop/src-tauri/binaries"

mkdir -p "$OUT_DIR"

cd "$BUDDY_DIR"
npm run build

# Adjust ENTRY if buddy's compiled output is at a different path
ENTRY="dist/server/index.js"
if [ ! -f "$ENTRY" ]; then
  ENTRY="dist/index.js"
fi
if [ ! -f "$ENTRY" ]; then
  echo "ERROR: cannot find compiled buddy entry. Check dist/ structure."
  exit 1
fi

echo "Bundling $ENTRY with pkg..."
npx pkg "$ENTRY" \
  --target node18-macos-arm64 \
  --output "$OUT_DIR/buddy-server-aarch64-apple-darwin"

echo "Done: $OUT_DIR/buddy-server-aarch64-apple-darwin"
```

- [ ] **Step 4: Run the build script**

```bash
chmod +x /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/scripts/build-buddy-sidecar.sh
/Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/scripts/build-buddy-sidecar.sh
```

Expected: binary at `buddy-desktop/src-tauri/binaries/buddy-server-aarch64-apple-darwin`, size ~50-100MB.

- [ ] **Step 5: Smoke-test the binary**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}' \
  | /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop/src-tauri/binaries/buddy-server-aarch64-apple-darwin
```

Expected: JSON response containing `"result"` with `"protocolVersion"`. (Ctrl-C after 3 seconds if it hangs waiting for more input.)

- [ ] **Step 6: Commit**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport
git add scripts/build-buddy-sidecar.sh
# Don't add the binary itself — add it to openhuman's .gitignore
echo "src-tauri/binaries/" >> buddy-desktop/.gitignore 2>/dev/null || true
git commit -m "chore: add buddy sidecar build script (pkg)"
```

---

## Task 4: Tauri config and Cargo dependencies

**Files:**
- Modify: `buddy-desktop/src-tauri/Cargo.toml`
- Modify: `buddy-desktop/src-tauri/tauri.conf.json`

- [ ] **Step 1: Inspect current Cargo.toml**

```bash
cat /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop/src-tauri/Cargo.toml
```

Note the existing `[dependencies]` section and Tauri version.

- [ ] **Step 2: Add Rust dependencies**

In `buddy-desktop/src-tauri/Cargo.toml`, add to `[dependencies]`:

```toml
serde = { version = "1", features = ["derive"] }
serde_json = "1"
regex = "1"
tokio = { version = "1", features = ["full"] }
```

(Skip any that are already present. Tauri v2 typically already includes `serde` and `tokio`.)

- [ ] **Step 3: Verify Cargo build still compiles**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop/src-tauri
cargo build 2>&1 | tail -10
```

Expected: `Finished` line with no errors.

- [ ] **Step 4: Inspect tauri.conf.json**

```bash
cat /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop/src-tauri/tauri.conf.json
```

Note the existing `bundle` and `plugins` sections.

- [ ] **Step 5: Add sidecar to tauri.conf.json**

In the `bundle` object, add or extend `externalBin`:

```json
"bundle": {
  "externalBin": ["binaries/buddy-server"]
}
```

In the `plugins` object, add or extend `shell`:

```json
"plugins": {
  "shell": {
    "open": false,
    "sidecar": true,
    "scope": [
      {
        "name": "binaries/buddy-server",
        "sidecar": true
      }
    ]
  }
}
```

(Merge carefully — don't delete existing `bundle` or `plugins` keys.)

- [ ] **Step 6: Verify Tauri still starts**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
pnpm dev:app 2>&1 | head -20
```

Expected: Tauri window opens (or at least compiles without error). Ctrl-C after window appears.

- [ ] **Step 7: Commit**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
git add app/src-tauri/Cargo.toml app/src-tauri/tauri.conf.json
git commit -m "chore: add buddy sidecar deps and tauri config"
```

---

## Task 5: buddy_sidecar.rs — process spawn and JSON-RPC framing

**Files:**
- Create: `buddy-desktop/src-tauri/src/buddy_sidecar.rs`

- [ ] **Step 1: Write the failing unit test**

Create `buddy-desktop/src-tauri/src/buddy_sidecar.rs` with:

```rust
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use std::sync::{Arc, Mutex};

pub struct BuddySidecar {
    pub child: Child,
    pub stdin: ChildStdin,
    reader: BufReader<ChildStdout>,
}

impl BuddySidecar {
    /// Spawn buddy sidecar. `binary_path` is the absolute path to the pkg binary.
    pub fn spawn(binary_path: &str) -> Result<Self, String> {
        let mut child = Command::new(binary_path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("failed to spawn buddy: {e}"))?;

        let stdin = child.stdin.take().ok_or("no stdin")?;
        let stdout = child.stdout.take().ok_or("no stdout")?;
        let reader = BufReader::new(stdout);

        Ok(Self { child, stdin, reader })
    }

    /// Send a JSON-RPC line and read the response line.
    pub fn send_recv(&mut self, request: &serde_json::Value) -> Result<serde_json::Value, String> {
        let mut line = serde_json::to_string(request).map_err(|e| e.to_string())?;
        line.push('\n');
        self.stdin.write_all(line.as_bytes()).map_err(|e| e.to_string())?;
        self.stdin.flush().map_err(|e| e.to_string())?;

        let mut response = String::new();
        self.reader.read_line(&mut response).map_err(|e| e.to_string())?;

        serde_json::from_str(response.trim()).map_err(|e| format!("parse error: {e} — raw: {response}"))
    }
}

impl Drop for BuddySidecar {
    fn drop(&mut self) {
        let _ = self.child.kill();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_send_recv_with_echo() {
        // Use `cat` as a mock process that echoes stdin to stdout
        let mut sidecar = BuddySidecar {
            child: std::process::Command::new("cat")
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::null())
                .spawn()
                .unwrap(),
            stdin: {
                let mut c = std::process::Command::new("cat")
                    .stdin(Stdio::piped())
                    .stdout(Stdio::piped())
                    .stderr(Stdio::null())
                    .spawn()
                    .unwrap();
                c.stdin.take().unwrap()
            },
            reader: {
                let c = std::process::Command::new("cat")
                    .stdin(Stdio::piped())
                    .stdout(Stdio::piped())
                    .stderr(Stdio::null())
                    .spawn()
                    .unwrap();
                BufReader::new(c.stdout.unwrap())
            },
        };
        // Actually, test by spawning a single cat and checking round-trip:
        drop(sidecar);

        let mut child = std::process::Command::new("cat")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .unwrap();
        let stdin = child.stdin.take().unwrap();
        let stdout = child.stdout.take().unwrap();
        let mut real = BuddySidecar {
            child,
            stdin,
            reader: BufReader::new(stdout),
        };

        let req = serde_json::json!({"jsonrpc": "2.0", "id": 1, "method": "ping"});
        let resp = real.send_recv(&req).unwrap();
        assert_eq!(resp["method"], "ping");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop/src-tauri
cargo test buddy_sidecar 2>&1 | tail -20
```

Expected: compile succeeds but test may pass (cat echoes correctly) — if it does, that's fine; the test validates round-trip framing.

- [ ] **Step 3: Register module in lib.rs**

In `buddy-desktop/src-tauri/src/lib.rs`, add at the top:

```rust
mod buddy_sidecar;
```

- [ ] **Step 4: Verify it compiles**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop/src-tauri
cargo build 2>&1 | tail -5
```

Expected: `Finished` with no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
git add app/src-tauri/src/buddy_sidecar.rs app/src-tauri/src/lib.rs
git commit -m "feat: add BuddySidecar with stdio JSON-RPC framing"
```

---

## Task 6: buddy_client.rs — MCP protocol + stat card parser

**Files:**
- Create: `buddy-desktop/src-tauri/src/buddy_client.rs`

The MCP initialize handshake:
- Send `initialize` → receive result → send `notifications/initialized` (no response expected)
- Then call `tools/call` with `{"name":"buddy_status","arguments":{}}` to get the stat card

The stat card text looks like:
```
.__________________________________________.
| ★ COMMON                         PENGUIN |
| buddy                                    |
| DEBUGGING  █░░░░░░░   14                 |
| PATIENCE   ▓░░░░░░░   11                 |
| CHAOS      ██░░░░░░   26                 |
| WISDOM     ░░░░░░░░    3                 |
| SNARK      ████▓░░░   59                 |
| Lv.1 · 3/17 XP to next                   |
'__________________________________________'
```

- [ ] **Step 1: Write the failing tests**

Create `buddy-desktop/src-tauri/src/buddy_client.rs`:

```rust
use crate::buddy_sidecar::BuddySidecar;
use crate::mascot_state::BuddyMcpState;
use regex::Regex;
use serde_json::{json, Value};

pub struct BuddyClient {
    sidecar: BuddySidecar,
    next_id: u64,
}

impl BuddyClient {
    pub fn new(sidecar: BuddySidecar) -> Self {
        Self { sidecar, next_id: 1 }
    }

    fn next_id(&mut self) -> u64 {
        let id = self.next_id;
        self.next_id += 1;
        id
    }

    /// Perform MCP initialize handshake. Must be called once before call_tool.
    pub fn initialize(&mut self) -> Result<(), String> {
        let id = self.next_id();
        let req = json!({
            "jsonrpc": "2.0",
            "id": id,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "openhuman", "version": "0.1.0"}
            }
        });
        let resp = self.sidecar.send_recv(&req)?;
        if resp.get("error").is_some() {
            return Err(format!("initialize error: {}", resp["error"]));
        }
        // Send initialized notification (no response expected — fire and forget)
        let notif = json!({"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}});
        let mut line = serde_json::to_string(&notif).unwrap();
        line.push('\n');
        use std::io::Write;
        self.sidecar.stdin.write_all(line.as_bytes()).map_err(|e| e.to_string())?;
        self.sidecar.stdin.flush().map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Call a buddy MCP tool and return the raw JSON response.
    pub fn call_tool(&mut self, name: &str, args: Value) -> Result<Value, String> {
        let id = self.next_id();
        let req = json!({
            "jsonrpc": "2.0",
            "id": id,
            "method": "tools/call",
            "params": {"name": name, "arguments": args}
        });
        self.sidecar.send_recv(&req)
    }

    /// Call buddy_status and parse the stat card into BuddyMcpState.
    pub fn get_status(&mut self) -> Result<BuddyMcpState, String> {
        let resp = self.call_tool("buddy_status", json!({}))?;
        let text = resp["result"]["content"]
            .as_array()
            .and_then(|arr| arr.first())
            .and_then(|c| c["text"].as_str())
            .ok_or("buddy_status: no text content in response")?;
        parse_stat_card(text)
    }
}

/// Parse a buddy stat card text block into BuddyMcpState.
pub fn parse_stat_card(card: &str) -> Result<BuddyMcpState, String> {
    // Rarity + species: "| ★ COMMON                         PENGUIN |"
    let rarity_re = Regex::new(r"★\s+(\w+)").unwrap();
    let species_re = Regex::new(r"★\s+\w+\s+(\w+)").unwrap();
    // Name line: "| buddy                                    |"
    // (first line after the species line that has only word chars + spaces)
    let stat_re = Regex::new(r"(DEBUGGING|PATIENCE|CHAOS|WISDOM|SNARK)\s+[█▓░]+\s+(\d+)").unwrap();
    let level_re = Regex::new(r"Lv\.(\d+)\s*·\s*(\d+)/(\d+)").unwrap();

    let rarity = rarity_re.captures(card)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().to_string())
        .unwrap_or_default();

    let species = species_re.captures(card)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().to_string())
        .unwrap_or_default();

    let mut stats = crate::mascot_state::BuddyStats::default();
    for cap in stat_re.captures_iter(card) {
        let val: u32 = cap[2].parse().unwrap_or(0);
        match &cap[1] {
            "DEBUGGING" => stats.debugging = val,
            "PATIENCE"  => stats.patience = val,
            "CHAOS"     => stats.chaos = val,
            "WISDOM"    => stats.wisdom = val,
            "SNARK"     => stats.snark = val,
            _ => {}
        }
    }

    let (level, xp, xp_to_next) = level_re.captures(card)
        .map(|c| (
            c[1].parse().unwrap_or(1),
            c[2].parse().unwrap_or(0),
            c[3].parse().unwrap_or(17),
        ))
        .unwrap_or((1, 0, 17));

    // Name: first non-empty line after the species line that isn't a stat or level line
    let name = card.lines()
        .map(|l| l.trim_matches(|c| c == '|' || c == ' '))
        .filter(|l| !l.is_empty()
            && !l.contains('★')
            && !l.contains("DEBUGGING") && !l.contains("PATIENCE")
            && !l.contains("CHAOS") && !l.contains("WISDOM") && !l.contains("SNARK")
            && !l.contains("Lv.")
            && !l.starts_with('.') && !l.starts_with('\'')
            && l.chars().all(|c| c.is_alphanumeric() || c == ' ' || c == '-' || c == '_'))
        .next()
        .unwrap_or("buddy")
        .trim()
        .to_string();

    // ASCII art: all lines from card
    let ascii_art: Vec<String> = card.lines().map(|l| l.to_string()).collect();

    Ok(BuddyMcpState {
        name,
        level,
        xp,
        xp_to_next,
        stats,
        rarity,
        species,
        ascii_art,
        personality: String::new(),
        last_reaction: None,
        online: true,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE_CARD: &str = r#"
.__________________________________________.
| ★ COMMON                         PENGUIN |
|                                          |
| buddy                                    |
|                                          |
| DEBUGGING  █░░░░░░░   14                 |
| PATIENCE   ▓░░░░░░░   11                 |
| CHAOS      ██░░░░░░   26                 |
| WISDOM     ░░░░░░░░    3                 |
| SNARK      ████▓░░░   59                 |
|                                          |
| Lv.1 · 3/17 XP to next                   |
'__________________________________________'
"#;

    #[test]
    fn test_parse_stat_card_name() {
        let state = parse_stat_card(SAMPLE_CARD).unwrap();
        assert_eq!(state.name, "buddy");
    }

    #[test]
    fn test_parse_stat_card_rarity_species() {
        let state = parse_stat_card(SAMPLE_CARD).unwrap();
        assert_eq!(state.rarity, "COMMON");
        assert_eq!(state.species, "PENGUIN");
    }

    #[test]
    fn test_parse_stat_card_stats() {
        let state = parse_stat_card(SAMPLE_CARD).unwrap();
        assert_eq!(state.stats.debugging, 14);
        assert_eq!(state.stats.patience, 11);
        assert_eq!(state.stats.chaos, 26);
        assert_eq!(state.stats.wisdom, 3);
        assert_eq!(state.stats.snark, 59);
    }

    #[test]
    fn test_parse_stat_card_level_xp() {
        let state = parse_stat_card(SAMPLE_CARD).unwrap();
        assert_eq!(state.level, 1);
        assert_eq!(state.xp, 3);
        assert_eq!(state.xp_to_next, 17);
    }
}
```

- [ ] **Step 2: Create mascot_state.rs with required types** (needed for buddy_client.rs to compile)

Create `buddy-desktop/src-tauri/src/mascot_state.rs`:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct BuddyStats {
    pub debugging: u32,
    pub patience: u32,
    pub chaos: u32,
    pub wisdom: u32,
    pub snark: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuddyMcpState {
    pub name: String,
    pub level: u32,
    pub xp: u32,
    pub xp_to_next: u32,
    pub stats: BuddyStats,
    pub rarity: String,
    pub species: String,
    pub ascii_art: Vec<String>,
    pub personality: String,
    pub last_reaction: Option<String>,
    pub online: bool,
}

impl Default for BuddyMcpState {
    fn default() -> Self {
        Self {
            name: "buddy".into(),
            level: 1,
            xp: 0,
            xp_to_next: 17,
            stats: BuddyStats::default(),
            rarity: "COMMON".into(),
            species: "UNKNOWN".into(),
            ascii_art: vec![],
            personality: String::new(),
            last_reaction: None,
            online: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AnimationState {
    Sleep,
    Idle,
    Busy,
    Attention,
    Celebrate,
    Dizzy,
    Heart,
}

/// Compute animation state from MCP state alone (BLE layer added in Plan B).
pub fn compute_animation_state(mcp: &BuddyMcpState, prev_level: u32) -> AnimationState {
    if !mcp.online {
        return AnimationState::Sleep;
    }
    if mcp.level > prev_level {
        return AnimationState::Celebrate;
    }
    AnimationState::Idle
}
```

- [ ] **Step 3: Register both modules in lib.rs**

In `buddy-desktop/src-tauri/src/lib.rs`, add:

```rust
mod buddy_sidecar;
mod buddy_client;
mod mascot_state;
```

- [ ] **Step 4: Run the stat card parser tests**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop/src-tauri
cargo test buddy_client 2>&1
```

Expected: `test test_parse_stat_card_name ... ok`, `test test_parse_stat_card_rarity_species ... ok`, etc. All 4 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
git add app/src-tauri/src/buddy_client.rs app/src-tauri/src/mascot_state.rs app/src-tauri/src/lib.rs
git commit -m "feat: MCP client with stat card parser (4 tests passing)"
```

---

## Task 7: buddy_poll.rs — background polling loop

**Files:**
- Create: `buddy-desktop/src-tauri/src/buddy_poll.rs`

- [ ] **Step 1: Write the tests**

Create `buddy-desktop/src-tauri/src/buddy_poll.rs`:

```rust
use crate::mascot_state::{AnimationState, BuddyMcpState, compute_animation_state};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub struct PollState {
    pub mcp: BuddyMcpState,
    pub prev_level: u32,
}

impl Default for PollState {
    fn default() -> Self {
        Self { mcp: BuddyMcpState::default(), prev_level: 1 }
    }
}

/// Start the polling background task. Spawns a Tokio task that calls buddy_status every 2s.
/// `binary_path`: absolute path to buddy sidecar binary.
/// `shared_state`: Arc<Mutex<PollState>> shared with Tauri commands.
/// `app`: AppHandle used to emit events to frontend.
pub fn start_poll(
    binary_path: String,
    shared_state: Arc<Mutex<PollState>>,
    app: AppHandle,
) {
    tokio::spawn(async move {
        let mut backoff_secs = 1u64;

        loop {
            match run_buddy_session(&binary_path, &shared_state, &app).await {
                Ok(()) => { backoff_secs = 1; }
                Err(e) => {
                    eprintln!("[buddy_poll] session error: {e}. Retrying in {backoff_secs}s");
                    {
                        let mut state = shared_state.lock().unwrap();
                        state.mcp.online = false;
                        state.mcp.last_reaction = None;
                    }
                    let _ = app.emit("buddy-offline", ());
                    tokio::time::sleep(Duration::from_secs(backoff_secs)).await;
                    backoff_secs = (backoff_secs * 2).min(30);
                }
            }
        }
    });
}

async fn run_buddy_session(
    binary_path: &str,
    shared_state: &Arc<Mutex<PollState>>,
    app: &AppHandle,
) -> Result<(), String> {
    use crate::buddy_sidecar::BuddySidecar;
    use crate::buddy_client::BuddyClient;

    let sidecar = BuddySidecar::spawn(binary_path)?;
    let mut client = BuddyClient::new(sidecar);
    client.initialize()?;

    let mut consecutive_errors = 0u32;

    loop {
        tokio::time::sleep(Duration::from_secs(2)).await;

        match client.get_status() {
            Ok(new_state) => {
                consecutive_errors = 0;
                let prev_level = {
                    let state = shared_state.lock().unwrap();
                    state.prev_level
                };
                let anim = compute_animation_state(&new_state, prev_level);
                {
                    let mut state = shared_state.lock().unwrap();
                    state.prev_level = state.mcp.level;
                    state.mcp = new_state.clone();
                }
                emit_mascot_event(app, &new_state, &anim);
            }
            Err(e) => {
                consecutive_errors += 1;
                eprintln!("[buddy_poll] status error ({consecutive_errors}): {e}");
                if consecutive_errors >= 3 {
                    return Err(format!("3 consecutive errors: {e}"));
                }
            }
        }
    }
}

fn emit_mascot_event(app: &AppHandle, mcp: &BuddyMcpState, anim: &AnimationState) {
    use serde_json::json;
    let payload = json!({
        "buddy": {
            "name": mcp.name,
            "level": mcp.level,
            "xp": mcp.xp,
            "xpToNext": mcp.xp_to_next,
            "stats": {
                "debugging": mcp.stats.debugging,
                "patience": mcp.stats.patience,
                "chaos": mcp.stats.chaos,
                "wisdom": mcp.stats.wisdom,
                "snark": mcp.stats.snark,
            },
            "rarity": mcp.rarity,
            "species": mcp.species,
            "asciiArt": mcp.ascii_art,
            "personality": mcp.personality,
            "lastReaction": mcp.last_reaction,
        },
        "animationState": anim,
    });
    let _ = app.emit("mascot-state-updated", payload);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mascot_state::{BuddyMcpState, BuddyStats};

    #[test]
    fn test_animation_state_sleep_when_offline() {
        let mcp = BuddyMcpState { online: false, ..Default::default() };
        assert_eq!(compute_animation_state(&mcp, 1), AnimationState::Sleep);
    }

    #[test]
    fn test_animation_state_idle_when_online_no_sessions() {
        let mcp = BuddyMcpState { online: true, level: 1, ..Default::default() };
        assert_eq!(compute_animation_state(&mcp, 1), AnimationState::Idle);
    }

    #[test]
    fn test_animation_state_celebrate_on_level_up() {
        let mcp = BuddyMcpState { online: true, level: 2, ..Default::default() };
        // prev_level=1, current level=2 → celebrate
        assert_eq!(compute_animation_state(&mcp, 1), AnimationState::Celebrate);
    }
}
```

- [ ] **Step 2: Register module in lib.rs**

In `buddy-desktop/src-tauri/src/lib.rs`, add:

```rust
mod buddy_poll;
```

- [ ] **Step 3: Run the animation state tests**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop/src-tauri
cargo test buddy_poll 2>&1
```

Expected: 3 tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
git add app/src-tauri/src/buddy_poll.rs app/src-tauri/src/lib.rs
git commit -m "feat: background MCP polling loop (3 state machine tests passing)"
```

---

## Task 8: buddy_commands.rs + lib.rs wiring

**Files:**
- Create: `buddy-desktop/src-tauri/src/buddy_commands.rs`
- Modify: `buddy-desktop/src-tauri/src/lib.rs`

- [ ] **Step 1: Create buddy_commands.rs**

Create `buddy-desktop/src-tauri/src/buddy_commands.rs`:

```rust
use crate::buddy_poll::PollState;
use crate::mascot_state::BuddyMcpState;
use std::sync::{Arc, Mutex};
use tauri::State;
use serde_json::Value;

pub struct BuddyPollHandle(pub Arc<Mutex<PollState>>);

/// Call any buddy tool (buddy_pet, buddy_dream, etc.) from the frontend.
/// Returns the raw tool result text.
#[tauri::command]
pub fn buddy_tool(
    name: String,
    args: Option<Value>,
    state: State<BuddyPollHandle>,
) -> Result<String, String> {
    // Note: This shares the sidecar connection. For simplicity in Plan A,
    // tool calls reuse the poll state. The poll loop is async; commands are sync.
    // A production impl would use a dedicated command channel — acceptable for v1.
    //
    // For now, return a stub — the poll loop keeps state fresh.
    // Interactive tool calls (pet, dream) can be implemented as a message-passing
    // channel in a follow-up task if needed.
    Err(format!("buddy_tool({name}) not yet wired — use buddy_get_state for reads"))
}

/// Get the current cached buddy state synchronously.
#[tauri::command]
pub fn buddy_get_state(state: State<BuddyPollHandle>) -> BuddyMcpState {
    state.0.lock().unwrap().mcp.clone()
}
```

- [ ] **Step 2: Wire up in lib.rs**

Find the `run()` function or `Builder` chain in `buddy-desktop/src-tauri/src/lib.rs`. Add the state management and command registration. The exact shape depends on what's in lib.rs — read it first with `cat`, then make the minimal additions:

```rust
// At top of lib.rs (after existing use statements):
use std::sync::{Arc, Mutex};
mod buddy_sidecar;
mod buddy_client;
mod mascot_state;
mod buddy_poll;
mod buddy_commands;

use buddy_commands::BuddyPollHandle;
use buddy_poll::{start_poll, PollState};
```

In the Tauri `Builder` chain, add `.manage()` and `.invoke_handler()`:

```rust
let poll_state = Arc::new(Mutex::new(PollState::default()));
let poll_state_clone = poll_state.clone();

tauri::Builder::default()
    // ... existing plugins ...
    .manage(BuddyPollHandle(poll_state))
    .invoke_handler(tauri::generate_handler![
        buddy_commands::buddy_tool,
        buddy_commands::buddy_get_state,
        // ... existing handlers ...
    ])
    .setup(|app| {
        // Find the buddy sidecar binary path
        let resource_dir = app.path().resource_dir()
            .expect("resource dir not found");
        // Tauri puts externalBin into the resource dir in dev; in prod it's next to the binary.
        // In development, the binary is in src-tauri/binaries/.
        let binary_path = std::env::current_exe()
            .unwrap()
            .parent().unwrap()
            .join("buddy-server")  // Tauri strips platform suffix at runtime
            .to_string_lossy()
            .to_string();

        let app_handle = app.handle().clone();
        start_poll(binary_path, poll_state_clone, app_handle);
        Ok(())
    })
    // ... rest of builder ...
```

> **Note:** The exact binary path resolution in Tauri v2 depends on the build mode. In dev, check `tauri-plugin-shell` docs for how sidecar paths are resolved. You may need to use `app.shell().sidecar("buddy-server")` instead of a raw path. Adjust accordingly after reading the actual lib.rs.

- [ ] **Step 3: Verify compilation**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop/src-tauri
cargo build 2>&1 | tail -15
```

Expected: `Finished` with no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
git add app/src-tauri/src/buddy_commands.rs app/src-tauri/src/lib.rs
git commit -m "feat: wire buddy poll and commands into Tauri app"
```

---

## Task 9: React types and BuddyStats component

**Files:**
- Create: `buddy-desktop/src/types/buddy.ts`
- Create: `buddy-desktop/src/components/BuddyStats.tsx`

- [ ] **Step 1: Inspect existing React structure**

```bash
ls /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop/src/
cat /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop/src/main.tsx | head -30
```

Note the existing component structure, CSS setup (Tailwind? CSS modules? Plain CSS?), and how existing components are organized.

- [ ] **Step 2: Create shared TypeScript types**

Create `buddy-desktop/src/types/buddy.ts`:

```typescript
export interface BuddyStats {
  debugging: number;
  patience: number;
  chaos: number;
  wisdom: number;
  snark: number;
}

export type AnimationState =
  | "sleep" | "idle" | "busy" | "attention"
  | "celebrate" | "dizzy" | "heart";

export interface BuddyState {
  buddy: {
    name: string;
    level: number;
    xp: number;
    xpToNext: number;
    stats: BuddyStats;
    rarity: string;
    species: string;
    asciiArt: string[];
    personality: string;
    lastReaction: string | null;
  };
  animationState: AnimationState;
}
```

- [ ] **Step 3: Create BuddyStats component**

Create `buddy-desktop/src/components/BuddyStats.tsx`:

```tsx
import type { BuddyStats as Stats } from "../types/buddy";

interface Props {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  rarity: string;
  species: string;
  stats: Stats;
  lastReaction: string | null;
}

const STAT_KEYS: (keyof Stats)[] = ["debugging", "patience", "chaos", "wisdom", "snark"];
const MAX_STAT = 100;

export function BuddyStats({
  name, level, xp, xpToNext, rarity, species, stats, lastReaction
}: Props) {
  const xpPct = Math.min((xp / xpToNext) * 100, 100);

  return (
    <div style={{ fontFamily: "monospace", fontSize: 12, color: "#ccc", padding: 8 }}>
      <div style={{ marginBottom: 4 }}>
        <strong style={{ color: "#fff" }}>{name}</strong>
        {" "}
        <span style={{ color: "#888" }}>
          ★ {rarity} {species}
        </span>
      </div>

      <div style={{ marginBottom: 6 }}>
        <span>Lv.{level}</span>
        {" "}
        <span style={{ color: "#888" }}>{xp}/{xpToNext} XP</span>
        <div style={{
          height: 4, background: "#333", borderRadius: 2, marginTop: 2
        }}>
          <div style={{
            height: "100%", width: `${xpPct}%`,
            background: "#5af", borderRadius: 2,
            transition: "width 0.4s ease"
          }} />
        </div>
      </div>

      {STAT_KEYS.map((key) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ width: 80, color: "#aaa", textTransform: "uppercase", fontSize: 10 }}>
            {key}
          </span>
          <div style={{ flex: 1, height: 4, background: "#333", borderRadius: 2 }}>
            <div style={{
              height: "100%",
              width: `${(stats[key] / MAX_STAT) * 100}%`,
              background: "#5af",
              borderRadius: 2
            }} />
          </div>
          <span style={{ width: 24, textAlign: "right" }}>{stats[key]}</span>
        </div>
      ))}

      {lastReaction && (
        <div style={{
          marginTop: 8, padding: "4px 8px",
          background: "#222", borderRadius: 4,
          color: "#9f9", fontSize: 11, fontStyle: "italic"
        }}>
          {lastReaction}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
git add app/src/types/buddy.ts app/src/components/BuddyStats.tsx
git commit -m "feat: BuddyStats component and shared TypeScript types"
```

---

## Task 10: CharacterDisplay and BuddyMascot components

**Files:**
- Create: `buddy-desktop/src/components/CharacterDisplay.tsx`
- Create: `buddy-desktop/src/components/BuddyMascot.tsx`

- [ ] **Step 1: Create CharacterDisplay (ASCII renderer)**

Create `buddy-desktop/src/components/CharacterDisplay.tsx`:

```tsx
import type { AnimationState } from "../types/buddy";

interface Props {
  asciiArt: string[];
  animationState: AnimationState;
  species: string;
}

const STATE_COLORS: Record<AnimationState, string> = {
  sleep:     "#888",
  idle:      "#ccc",
  busy:      "#5af",
  attention: "#fa0",
  celebrate: "#ff5",
  dizzy:     "#f5a",
  heart:     "#f55",
};

export function CharacterDisplay({ asciiArt, animationState, species }: Props) {
  const color = STATE_COLORS[animationState] ?? "#ccc";

  if (asciiArt.length === 0) {
    return (
      <div style={{ color: "#444", fontFamily: "monospace", fontSize: 12, padding: 8 }}>
        {species || "???"}
      </div>
    );
  }

  return (
    <pre style={{
      fontFamily: "monospace",
      fontSize: 11,
      lineHeight: 1.3,
      color,
      margin: 0,
      padding: 8,
      whiteSpace: "pre",
      transition: "color 0.3s ease",
    }}>
      {asciiArt.join("\n")}
    </pre>
  );
}
```

- [ ] **Step 2: Create BuddyMascot root component**

Create `buddy-desktop/src/components/BuddyMascot.tsx`:

```tsx
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { BuddyState } from "../types/buddy";
import { BuddyStats } from "./BuddyStats";
import { CharacterDisplay } from "./CharacterDisplay";

const OFFLINE_STATE: BuddyState = {
  buddy: {
    name: "buddy",
    level: 1,
    xp: 0,
    xpToNext: 17,
    stats: { debugging: 0, patience: 0, chaos: 0, wisdom: 0, snark: 0 },
    rarity: "COMMON",
    species: "UNKNOWN",
    asciiArt: [],
    personality: "",
    lastReaction: null,
  },
  animationState: "sleep",
};

export function BuddyMascot() {
  const [mascot, setMascot] = useState<BuddyState>(OFFLINE_STATE);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unlisten1 = listen<BuddyState>("mascot-state-updated", (event) => {
      setMascot(event.payload);
      setOffline(false);
    });
    const unlisten2 = listen("buddy-offline", () => {
      setOffline(true);
      setMascot((prev) => ({ ...prev, animationState: "sleep" }));
    });
    return () => {
      unlisten1.then((fn) => fn());
      unlisten2.then((fn) => fn());
    };
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      background: "rgba(0,0,0,0.85)",
      borderRadius: 12,
      padding: 8,
      minWidth: 200,
      userSelect: "none",
    }}>
      {offline && (
        <div style={{ color: "#888", fontSize: 10, marginBottom: 4 }}>
          buddy is sleeping...
        </div>
      )}
      <CharacterDisplay
        asciiArt={mascot.buddy.asciiArt}
        animationState={mascot.animationState}
        species={mascot.buddy.species}
      />
      <BuddyStats
        name={mascot.buddy.name}
        level={mascot.buddy.level}
        xp={mascot.buddy.xp}
        xpToNext={mascot.buddy.xpToNext}
        rarity={mascot.buddy.rarity}
        species={mascot.buddy.species}
        stats={mascot.buddy.stats}
        lastReaction={mascot.buddy.lastReaction}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no type errors. (If `@tauri-apps/api/event` is not found, run `pnpm add @tauri-apps/api` first.)

- [ ] **Step 4: Commit**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
git add app/src/components/CharacterDisplay.tsx app/src/components/BuddyMascot.tsx
git commit -m "feat: BuddyMascot and CharacterDisplay components"
```

---

## Task 11: Wire BuddyMascot into main.tsx

**Files:**
- Modify: `buddy-desktop/src/main.tsx`

- [ ] **Step 1: Read main.tsx**

```bash
cat /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop/src/main.tsx
```

Note how the existing mascot window branch is implemented (the `?window=mascot` query param).

- [ ] **Step 2: Add buddy companion branch**

Find the section that checks `window.location.search` for `window=mascot` and add a companion check. For example, if existing code looks like:

```tsx
const params = new URLSearchParams(window.location.search);
if (params.get("window") === "mascot") {
  root.render(<MascotApp />);
} else {
  root.render(<App />);
}
```

Change it to:

```tsx
const params = new URLSearchParams(window.location.search);
if (params.get("window") === "mascot" && params.get("companion") === "buddy") {
  root.render(
    <React.StrictMode>
      <BuddyMascot />
    </React.StrictMode>
  );
} else if (params.get("window") === "mascot") {
  root.render(<MascotApp />);
} else {
  root.render(<App />);
}
```

Add the import at the top of main.tsx:

```tsx
import { BuddyMascot } from "./components/BuddyMascot";
```

(Adapt to match the actual structure in main.tsx — don't blindly copy; read it first.)

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
git add app/src/main.tsx
git commit -m "feat: add buddy companion branch to mascot window routing"
```

---

## Task 12: End-to-end smoke test

No code to write — manual verification checklist.

- [ ] **Step 1: Build the sidecar**

```bash
/Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/scripts/build-buddy-sidecar.sh
```

Expected: binary present at `buddy-desktop/src-tauri/binaries/buddy-server-aarch64-apple-darwin`.

- [ ] **Step 2: Run the app in dev mode**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
pnpm dev:app
```

Expected: Tauri window opens. No Rust panic in the terminal.

- [ ] **Step 3: Open the buddy mascot window**

Open a browser or check if Tauri opens a second window. In the Tauri dev window, navigate to the mascot URL. Depending on how openhuman launches mascot windows, either:
- A second window appears automatically with `?window=mascot&companion=buddy`
- Or open the Tauri dev tools console and check for `mascot-state-updated` events firing every ~2 seconds

Check the Rust terminal output for `[buddy_poll]` log lines. You should see no errors after the first successful `buddy_status` call.

- [ ] **Step 4: Verify stat card renders**

In the buddy mascot window, verify:
- Penguin ASCII art is visible
- Name, level, XP bar appear
- Personality stats bars appear
- Colors reflect `idle` animation state (light grey `#ccc`)

- [ ] **Step 5: Simulate sidecar crash**

```bash
pkill -f "buddy-server"
```

Expected: `buddy-offline` event fires within 2-4 seconds; mascot shows "buddy is sleeping..." message; sidecar auto-restarts and mascot recovers within ~5 seconds.

- [ ] **Step 6: Final commit**

```bash
cd /Users/Sandbox_Jwu/Documents/buddy_openhuman_teleport/buddy-desktop
git add -A
git status  # verify only expected files
git commit -m "feat: Plan A complete — buddy MCP sidecar mascot window"
```

---

## What's Next: Plan B

Plan B covers:
1. `ble_companion.rs` — BLE Nordic UART peripheral so Claude Desktop sends heartbeats to this app
2. `mascot_state.rs` update — merge BLE session state into the animation state machine
3. `ApproveOverlay.tsx` — permission prompt UI with approve/deny buttons
4. `character_pack.rs` — GIF character pack loading from `~/.buddy/characters/`
5. `CharacterDisplay.tsx` update — GIF animation support alongside ASCII fallback

Plan B spec: `docs/superpowers/specs/2026-05-18-buddy-openhuman-integration-design.md` (same spec, BLE sections).
