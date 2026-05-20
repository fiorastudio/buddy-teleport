import { access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const checks = [];

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function run(command, args) {
  return spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
}

function outputFor(result) {
  return [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
}

const buddyEntry = join(homedir(), ".buddy", "server", "dist", "server", "index.js");
checks.push({
  name: "installed Buddy MCP entry",
  ok: await fileExists(buddyEntry),
  detail: buddyEntry,
});

const cuaStatus = run("cua-driver", ["status"]);
checks.push({
  name: "native GUI automation status",
  ok: cuaStatus.status === 0,
  detail: outputFor(cuaStatus) || `exit ${cuaStatus.status}`,
});

const cuaPermissions = run("cua-driver", ["check_permissions", '{"prompt":false}']);
checks.push({
  name: "native GUI automation permissions",
  ok: cuaPermissions.status === 0,
  detail: outputFor(cuaPermissions) || `exit ${cuaPermissions.status}`,
});

console.log("Buddy Desktop manual gate preflight\n");

for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "BLOCKED"} ${check.name}`);
  console.log(`  ${check.detail.split("\n").join("\n  ")}`);
}

const blocked = checks.filter((check) => !check.ok);

if (blocked.length === 0) {
  console.log("\nManual GUI/BLE verification prerequisites look ready on this host.");
} else {
  console.log(
    "\nManual GUI/BLE verification is not fully automatable on this host. See docs/superpowers/plans/2026-05-20-buddy-desktop-manual-verification.md for the remaining human checks.",
  );
}
