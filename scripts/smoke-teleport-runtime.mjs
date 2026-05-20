#!/usr/bin/env node
import { mkdtemp, writeFile, chmod, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const workspace = join(dirname(fileURLToPath(import.meta.url)), "..");
const buddyServerDir = process.env.BUDDY_SERVER_DIR || join(homedir(), ".buddy/server");
const buddyEntry = process.env.BUDDY_ENTRY || join(buddyServerDir, "dist/server/index.js");
const runMs = Number(process.env.BUDDY_TELEPORT_SMOKE_MS || 15_000);
const buddyName = process.env.BUDDY_TELEPORT_SMOKE_NAME || "TeleportSmoke";
const tempRoot = await mkdtemp(join(tmpdir(), "buddy-teleport-runtime-"));
const dbPath = process.env.BUDDY_DB_PATH || join(tempRoot, "buddy.db");
const wrapperPath = join(tempRoot, "buddy-sidecar");

async function main() {
  await writeFile(
    wrapperPath,
    `#!/usr/bin/env bash\nexec "${process.execPath}" "${buddyEntry}"\n`,
    "utf8",
  );
  await chmod(wrapperPath, 0o755);

  const statusText = await seedBuddy();
  if (!statusText.includes(buddyName)) {
    throw new Error(`seeded Buddy status did not include ${buddyName}`);
  }
  if (!/DEBUGGING|PATIENCE|CHAOS|WISDOM|SNARK/.test(statusText)) {
    throw new Error("seeded Buddy status did not include stat rows");
  }

  const launchOutput = await runTeleportLauncher();
  if (!/target\/debug\/buddy-desktop/.test(stripAnsi(launchOutput))) {
    throw new Error("Tauri runtime did not reach target/debug/buddy-desktop");
  }
  if (/stat card did not contain Buddy stats/.test(launchOutput)) {
    throw new Error("runtime poller failed to parse the seeded terminal Buddy card");
  }

  console.log(`teleport runtime smoke passed for ${buddyName}`);
  console.log(process.env.BUDDY_DB_PATH ? `Buddy DB: ${dbPath}` : "Temporary Buddy DB cleaned up");
}

async function seedBuddy() {
  const child = spawn(process.execPath, [buddyEntry], {
    env: { ...process.env, BUDDY_DB_PATH: dbPath },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let nextId = 1;
  let output = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const send = (method, params = {}) => {
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params })}\n`);
  };

  send("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "buddy-teleport-runtime-smoke", version: "0.1.0" },
  });
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} })}\n`);
  await delay(100);
  send("tools/call", {
    name: "buddy_hatch",
    arguments: { name: buddyName, species: "Penguin", user_id: "teleport-runtime-smoke" },
  });
  await delay(150);
  send("tools/call", { name: "buddy_status", arguments: {} });
  await delay(500);
  child.kill("SIGTERM");
  await waitForExit(child);

  if (stderr.trim()) {
    console.error(stderr.trim());
  }
  return output;
}

async function runTeleportLauncher() {
  const child = spawn("./scripts/buddy-teleport-out.sh", {
    cwd: workspace,
    detached: true,
    env: {
      ...process.env,
      BUDDY_DB_PATH: dbPath,
      BUDDY_SIDECAR_PATH: wrapperPath,
      BUDDY_ENTRY: buddyEntry,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk;
    process.stdout.write(chunk);
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
    process.stderr.write(chunk);
  });

  await delay(runMs);
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
  await Promise.race([waitForExit(child), delay(2_000)]);
  return output;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForExit(child) {
  return new Promise((resolve) => {
    child.once("exit", resolve);
  });
}

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

try {
  await main();
} finally {
  if (!process.env.BUDDY_DB_PATH) {
    await rm(tempRoot, { recursive: true, force: true });
  }
}
