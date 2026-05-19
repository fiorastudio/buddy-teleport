"use strict";

const { spawn } = require("node:child_process");

function launchBuddyProcess({ command, args = [], cwd, env, stdio = ["pipe", "pipe", "pipe"] }) {
  if (!command) {
    throw new Error("launchBuddyProcess requires a command");
  }

  const child = spawn(command, args, {
    cwd,
    env: env ? { ...process.env, ...env } : process.env,
    stdio,
  });

  return {
    child,
    input: child.stdin,
    output: child.stdout,
    errorOutput: child.stderr,
    pid: child.pid,
    stop(signal = "SIGTERM") {
      if (!child.killed) {
        child.kill(signal);
      }
    },
  };
}

function createBuddyProcessLauncher(defaults = {}) {
  return function launch(overrides = {}) {
    return launchBuddyProcess({ ...defaults, ...overrides });
  };
}

module.exports = {
  createBuddyProcessLauncher,
  launchBuddyProcess,
};
