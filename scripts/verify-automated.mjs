import { spawn } from "node:child_process";

const root = new URL("../", import.meta.url);

const checks = [
  {
    name: "frontend typecheck",
    command: "npm",
    args: ["--prefix", "buddy-desktop", "run", "typecheck"],
  },
  {
    name: "frontend, bridge, BLE, and smoke tests",
    command: "npm",
    args: ["--prefix", "buddy-desktop", "test"],
  },
  {
    name: "frontend production build",
    command: "npm",
    args: ["--prefix", "buddy-desktop", "run", "build"],
  },
  {
    name: "Rust backend tests",
    command: "cargo",
    args: ["test"],
    cwd: new URL("buddy-desktop/src-tauri/", root),
  },
  {
    name: "documentation boundary checks",
    command: "npm",
    args: ["run", "docs:check"],
  },
  {
    name: "live Buddy popup-action smoke",
    command: "npm",
    args: ["run", "smoke:popup-actions"],
  },
  {
    name: "live teleport runtime smoke",
    command: "npm",
    args: ["run", "smoke:teleport-runtime"],
  },
  {
    name: "whitespace diff check",
    command: "git",
    args: ["diff", "--check"],
  },
];

function runCheck(check) {
  return new Promise((resolve, reject) => {
    console.log(`\n==> ${check.name}`);
    const child = spawn(check.command, check.args, {
      cwd: check.cwd ? check.cwd : root,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${check.name} failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}`,
        ),
      );
    });
  });
}

for (const check of checks) {
  await runCheck(check);
}

console.log("\nautomated verification passed");
