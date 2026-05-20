#!/usr/bin/env node
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const workspace = join(dirname(fileURLToPath(import.meta.url)), "..");
const buddyServerDir = process.env.BUDDY_SERVER_DIR || join(homedir(), ".buddy/server");
const buddyEntry = process.env.BUDDY_ENTRY || join(buddyServerDir, "dist/server/index.js");
const tempRoot = await mkdtemp(join(tmpdir(), "buddy-teleport-tools-"));
const dbPath = process.env.BUDDY_DB_PATH || join(tempRoot, "buddy.db");
const wrapperPath = join(tempRoot, "buddy-sidecar");

async function main() {
  await writeFile(
    wrapperPath,
    `#!/usr/bin/env bash\nexec "${process.execPath}" "${buddyEntry}"\n`,
    "utf8",
  );
  await chmod(wrapperPath, 0o755);

  await runCargoToolSmoke();
  console.log("teleport tool smoke passed for Buddy command path");
  console.log(process.env.BUDDY_DB_PATH ? `Buddy DB: ${dbPath}` : "Temporary Buddy DB cleaned up");
}

async function runCargoToolSmoke() {
  const child = spawn(
    "cargo",
    [
      "test",
      "live_buddy_sidecar_uses_existing_db_and_supports_pet_observe_when_env_is_set",
      "--",
      "--nocapture",
    ],
    {
      cwd: join(workspace, "buddy-desktop/src-tauri"),
      env: {
        ...process.env,
        BUDDY_DB_PATH: dbPath,
        BUDDY_TELEPORT_LIVE_SIDECAR: wrapperPath,
      },
      stdio: "inherit",
    },
  );

  const exitCode = await new Promise((resolve) => {
    child.once("exit", resolve);
  });

  if (exitCode !== 0) {
    throw new Error(`cargo teleport tool smoke failed with exit code ${exitCode}`);
  }
}

try {
  await main();
} finally {
  if (!process.env.BUDDY_DB_PATH) {
    await rm(tempRoot, { recursive: true, force: true });
  }
}
