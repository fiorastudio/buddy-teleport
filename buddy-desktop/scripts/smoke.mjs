import { access, readFile, readdir } from "node:fs/promises";

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

const appSource = await readFile(new URL("src/App.tsx", root), "utf8");
if (!appSource.includes("useState<MascotState>(DEFAULT_MASCOT_STATE)")) {
  throw new Error("App must start from the offline default state until terminal Buddy state arrives");
}

for (const requiredSnippet of [
  'name: "buddy_pet"',
  'name: "buddy_observe"',
  'invoke<any>("buddy_teleport_back")',
  "connectionFromBuddyPayload(initialState)",
]) {
  if (!appSource.includes(requiredSnippet)) {
    throw new Error(`App action/state wiring missing expected snippet: ${requiredSnippet}`);
  }
}

const statusPopupSource = await readFile(new URL("src/components/StatusPopup.tsx", root), "utf8");
for (const requiredSnippet of ["onPetBuddy", "onObserveBuddy", "onTeleportBack"]) {
  if (!statusPopupSource.includes(requiredSnippet)) {
    throw new Error(`StatusPopup action control missing expected snippet: ${requiredSnippet}`);
  }
}

for (const label of ["Pet", "Observe", "Return"]) {
  if (!new RegExp(`>\\s*${label}\\s*<`).test(statusPopupSource)) {
    throw new Error(`StatusPopup action control missing expected button label: ${label}`);
  }
}

console.log("smoke prerequisites passed");
