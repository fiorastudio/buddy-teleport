import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "package.json",
  "index.html",
  "tsconfig.json",
  "vite.config.ts",
  "LICENSE",
  "src/main.tsx",
  "src/App.tsx",
  "src/components/StatusPopup.tsx",
  "src-tauri/Cargo.toml",
  "src-tauri/tauri.conf.json",
  "src-tauri/src/lib.rs",
  "src-tauri/src/bridge_process.rs",
  "src-tauri/src/commands.rs",
  "src-tauri/src/tray.rs",
];

for (const file of requiredFiles) {
  await access(new URL(`../${file}`, import.meta.url));
}

const license = await readFile(new URL("../LICENSE", import.meta.url), "utf8");
if (!license.startsWith("MIT License")) {
  throw new Error("buddy-desktop/LICENSE must be MIT");
}

const lib = await readFile(new URL("../src-tauri/src/lib.rs", import.meta.url), "utf8");
if (lib.includes("buddy_status") || lib.includes("tools/call")) {
  throw new Error("Rust shell must not parse or call Buddy MCP directly");
}

console.log("buddy-desktop scaffold checks passed");
