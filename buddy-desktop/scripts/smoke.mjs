import { access, readdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function exists(path) {
  try {
    await access(new URL(path, root));
    return true;
  } catch {
    return false;
  }
}

const required = [
  "index.html",
  "src/main.tsx",
  "src/App.tsx",
  "bridge/src/mcpClient.js",
  "bridge/src/sidecar.js",
  "bridge/src/stateMapper.js",
  "src/components/StatusPopup.tsx",
  "src-tauri/src/tray.rs",
  "ble-prototype/protocol.js",
];

for (const file of required) {
  if (!(await exists(file))) {
    throw new Error(`missing smoke prerequisite: ${file}`);
  }
}

const bridgeFixtures = await readdir(new URL("bridge/test/fixtures", root));
if (!bridgeFixtures.includes("current-stat-card.txt")) {
  throw new Error("bridge stat-card fixture missing");
}

console.log("smoke prerequisites passed");
