#!/usr/bin/env node
"use strict";

const readline = require("node:readline");
const {
  McpJsonRpcClient,
  callBuddyTool,
  formatBridgeOfflineEvent,
  formatBuddyStateEvent,
  launchBuddyProcess,
  normalizeBuddyState,
  parseSidecarCommand,
} = require("./index");

async function main(env = process.env, io = process) {
  const command = env.BUDDY_MCP_COMMAND || "node";
  const args = env.BUDDY_MCP_ARGS ? JSON.parse(env.BUDDY_MCP_ARGS) : defaultBuddyArgs(env);

  let child;
  try {
    child = launchBuddyProcess({ command, args, env });
  } catch (error) {
    io.stdout.write(formatBridgeOfflineEvent(error.message));
    return 1;
  }

  const client = new McpJsonRpcClient({
    input: child.input,
    output: child.output,
    timeoutMs: Number(env.BUDDY_MCP_TIMEOUT_MS || 5000),
  });

  child.child.on("exit", (code, signal) => {
    io.stdout.write(formatBridgeOfflineEvent(`Buddy MCP exited: ${code ?? signal ?? "unknown"}`));
  });

  try {
    await client.initialize();
    const status = await client.callTool("buddy_status", {});
    const normalized = normalizeBuddyState(status);
    if (normalized.ok) {
      io.stdout.write(formatBuddyStateEvent(normalized.state));
    } else {
      io.stdout.write(formatBridgeOfflineEvent(normalized.error.message));
    }
  } catch (error) {
    io.stdout.write(formatBridgeOfflineEvent(error.message));
  }

  const rl = readline.createInterface({ input: io.stdin });
  rl.on("line", async (line) => {
    const command = parseSidecarCommand(line);
    if (!command.ok) {
      io.stdout.write(formatBridgeOfflineEvent(command.error.message));
      return;
    }

    const result = await callBuddyTool(client, command.command.name, command.command.args);
    io.stdout.write(formatSidecarToolResult(command.command.requestId, result));
  });

  return 0;
}

function defaultBuddyArgs(env) {
  if (!env.BUDDY_MCP_ENTRY) {
    throw new Error("BUDDY_MCP_ENTRY or BUDDY_MCP_ARGS is required");
  }
  return [env.BUDDY_MCP_ENTRY];
}

function formatSidecarToolResult(requestId, result) {
  return `${JSON.stringify({
    type: result.ok ? "tool_result" : "tool_error",
    requestId,
    ...result,
  })}\n`;
}

if (require.main === module) {
  main().then((code) => {
    if (code) process.exitCode = code;
  });
}

module.exports = {
  defaultBuddyArgs,
  formatSidecarToolResult,
  main,
};
