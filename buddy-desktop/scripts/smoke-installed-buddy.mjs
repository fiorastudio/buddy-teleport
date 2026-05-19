import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  McpJsonRpcClient,
  launchBuddyProcess,
  normalizeBuddyState,
} = require("../bridge/src/index.js");

const entry = process.env.BUDDY_MCP_ENTRY || "/Users/Sandbox_Jwu/.buddy/server/dist/server/index.js";
const home = mkdtempSync(path.join(tmpdir(), "buddy-desktop-live-home-"));
const dbPath = path.join(home, ".buddy", "buddy.db");

const child = launchBuddyProcess({
  command: process.execPath,
  args: [entry],
  env: {
    ...process.env,
    HOME: home,
    BUDDY_DB_PATH: dbPath,
  },
});

const client = new McpJsonRpcClient({
  input: child.input,
  output: child.output,
  timeoutMs: 5000,
});

try {
  await client.initialize();
  await client.callTool("buddy_hatch", { name: "Desktop Smoke", user_id: "desktop-smoke" });
  const status = await client.callTool("buddy_status", { user_id: "desktop-smoke" });
  const normalized = normalizeBuddyState(status);
  if (!normalized.ok) {
    throw new Error(normalized.error.message);
  }
  console.log(`installed Buddy smoke passed: ${normalized.state.name} ${normalized.state.species} Lv.${normalized.state.level}`);
} finally {
  client.close();
  child.stop();
}
