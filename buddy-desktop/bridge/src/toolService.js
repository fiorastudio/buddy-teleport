"use strict";

const { normalizeBuddyState } = require("./stateMapper");

const SUPPORTED_TOOLS = new Set([
  "buddy_status",
  "buddy_pet",
  "buddy_dream",
  "buddy_hatch",
  "buddy_mode",
  "buddy_observe",
  "buddy_remember",
  "buddy_respawn",
  "buddy_mute",
  "buddy_unmute",
  "buddy_forget",
  "buddy_reasoning_status",
  "buddy_share",
]);

async function callBuddyTool(client, name, args = {}, options = {}) {
  if (!SUPPORTED_TOOLS.has(name)) {
    return {
      ok: false,
      error: {
        code: "unsupported_tool",
        message: `Unsupported Buddy tool: ${name}`,
      },
    };
  }

  try {
    const result = await client.callTool(name, args || {});
    const response = { ok: true, result };

    if (options.refreshState !== false && name !== "buddy_status") {
      const status = await client.callTool("buddy_status", {});
      response.state = normalizeBuddyState(status);
    } else if (name === "buddy_status") {
      response.state = normalizeBuddyState(result);
    }

    return response;
  } catch (error) {
    return {
      ok: false,
      error: {
        code: error.code || "tool_call_failed",
        message: error.message || String(error),
      },
    };
  }
}

module.exports = {
  SUPPORTED_TOOLS,
  callBuddyTool,
};
