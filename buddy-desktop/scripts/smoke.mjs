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

const workspaceRoot = new URL("../", root);
const teleportCommand = await readFile(new URL(".claude/commands/buddy-teleport.md", workspaceRoot), "utf8");
if (!teleportCommand.includes("./scripts/buddy-teleport-out.sh")) {
  throw new Error("Claude teleport command must invoke the repo-relative teleport launcher");
}
if (teleportCommand.includes("/Users/")) {
  throw new Error("Claude teleport command must not hard-code a machine-specific checkout path");
}

const teleportLauncher = await readFile(new URL("scripts/buddy-teleport-out.sh", workspaceRoot), "utf8");
if (!teleportLauncher.includes('BUDDY_SERVER_DIR="${BUDDY_SERVER_DIR:-$HOME/.buddy/server}"')) {
  throw new Error("teleport launcher must default to the current user's Buddy install under $HOME");
}

const sidecarBuilder = await readFile(new URL("scripts/build-buddy-sidecar.sh", workspaceRoot), "utf8");
if (!sidecarBuilder.includes('DEFAULT_BUDDY_DIR="$HOME/.buddy/server"')) {
  throw new Error("sidecar builder must prefer the current user's installed Buddy source");
}
if (!sidecarBuilder.includes('DEFAULT_BUDDY_DIR="$WORKSPACE/buddy"')) {
  throw new Error("sidecar builder must still support a workspace-local Buddy checkout fallback");
}

const readme = await readFile(new URL("README.md", workspaceRoot), "utf8");
for (const requiredSnippet of [
  "./scripts/buddy-teleport-out.sh",
  "$HOME/.buddy/server",
  "BUDDY_DIR=/path/to/buddy/server",
  "**Return**",
]) {
  if (!readme.includes(requiredSnippet)) {
    throw new Error(`README teleport contract missing expected snippet: ${requiredSnippet}`);
  }
}
if (readme.includes("/Users/")) {
  throw new Error("README must not hard-code a machine-specific checkout path");
}
if (readme.includes("Return to terminal")) {
  throw new Error("README must match the current popup action label: Return");
}

const claudeGuide = await readFile(new URL("CLAUDE.md", workspaceRoot), "utf8");
for (const requiredSnippet of [
  "$HOME/.buddy/server",
  "commands.rs",
  "ble.rs",
  "buddy-teleport-out.sh",
  "2026-05-20-buddy-desktop-completion-audit.md",
]) {
  if (!claudeGuide.includes(requiredSnippet)) {
    throw new Error(`CLAUDE.md guidance missing expected snippet: ${requiredSnippet}`);
  }
}
for (const staleSnippet of ["buddy_commands.rs", "ble_companion.rs", "fully written, ready to execute"]) {
  if (claudeGuide.includes(staleSnippet)) {
    throw new Error(`CLAUDE.md still contains stale guidance: ${staleSnippet}`);
  }
}

const tauriConfig = JSON.parse(await readFile(new URL("src-tauri/tauri.conf.json", root), "utf8"));
const statusPopupWindow = tauriConfig.app?.windows?.find((window) => window.label === "status-popup");
if (!statusPopupWindow) {
  throw new Error("Tauri config must define the status-popup window targeted by the tray");
}
if (statusPopupWindow.visible !== false) {
  throw new Error("status-popup should start hidden until the tray opens it");
}

const appSource = await readFile(new URL("src/App.tsx", root), "utf8");
if (!appSource.includes("useState<MascotState>(DEFAULT_MASCOT_STATE)")) {
  throw new Error("App must start from the offline default state until terminal Buddy state arrives");
}
if (appSource.includes("MOCK_MASCOT_STATE")) {
  throw new Error("App must not import or render a mock Buddy body");
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
if (statusPopupSource.includes("MOCK_MASCOT_STATE")) {
  throw new Error("StatusPopup must not export or render a mock Buddy body");
}
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

const mascotSource = await readFile(new URL("src/components/BuddyMascot.tsx", root), "utf8");
if (mascotSource.includes("MOCK_MASCOT_STATE")) {
  throw new Error("BuddyMascot must not import or render a mock Buddy body");
}
for (const requiredSnippet of [
  'invoke<any>("buddy_get_state")',
  'listen<any>("buddy-teleported-back"',
  "connectionFromBuddyPayload(initialState)",
]) {
  if (!mascotSource.includes(requiredSnippet)) {
    throw new Error(`BuddyMascot terminal-state wiring missing expected snippet: ${requiredSnippet}`);
  }
}

const stateTypesSource = await readFile(new URL("src/types/state.ts", root), "utf8");
if (stateTypesSource.includes("MOCK_MASCOT_STATE") || stateTypesSource.includes("mock-buddy")) {
  throw new Error("Production state types must not define a mock Buddy body");
}

console.log("smoke prerequisites passed");
