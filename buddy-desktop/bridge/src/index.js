"use strict";

const { createBuddyProcessLauncher, launchBuddyProcess } = require("./buddyProcess");
const { McpClientError, McpJsonRpcClient, createMcpClient } = require("./mcpClient");
const protocol = require("./protocol");
const sidecarProtocol = require("./sidecarProtocol");
const { normalizeBuddyState, parseStatCard } = require("./stateMapper");
const { SUPPORTED_TOOLS, callBuddyTool } = require("./toolService");

async function getBuddyState(client) {
  const response = await client.callTool("buddy_status", {});
  return normalizeBuddyState(response);
}

module.exports = {
  ...protocol,
  ...sidecarProtocol,
  McpClientError,
  McpJsonRpcClient,
  createBuddyProcessLauncher,
  createMcpClient,
  callBuddyTool,
  getBuddyState,
  launchBuddyProcess,
  normalizeBuddyState,
  parseStatCard,
  SUPPORTED_TOOLS,
};
