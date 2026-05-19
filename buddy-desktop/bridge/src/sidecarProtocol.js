"use strict";

const EVENT_TYPES = new Set(["buddy_state", "bridge_offline", "tool_result", "tool_error"]);

function formatSidecarEvent(type, payload = {}) {
  if (!EVENT_TYPES.has(type)) {
    throw new Error(`unsupported sidecar event type: ${type}`);
  }
  return `${JSON.stringify({ type, ...payload })}\n`;
}

function formatBuddyStateEvent(state) {
  return formatSidecarEvent("buddy_state", { buddy: state });
}

function formatBridgeOfflineEvent(message) {
  return formatSidecarEvent("bridge_offline", { message: String(message || "Buddy bridge is offline") });
}

function parseSidecarCommand(line) {
  let parsed;
  try {
    parsed = JSON.parse(String(line));
  } catch {
    return { ok: false, error: { code: "invalid_json", message: "Sidecar command is not valid JSON" } };
  }

  if (parsed?.cmd !== "call_tool") {
    return { ok: false, error: { code: "unsupported_command", message: `Unsupported sidecar command: ${parsed?.cmd || ""}` } };
  }

  if (typeof parsed.name !== "string" || parsed.name.length === 0) {
    return { ok: false, error: { code: "missing_tool_name", message: "Sidecar call_tool command requires a tool name" } };
  }

  return {
    ok: true,
    command: {
      cmd: "call_tool",
      requestId: parsed.requestId ? String(parsed.requestId) : null,
      name: parsed.name,
      args: parsed.args && typeof parsed.args === "object" ? parsed.args : {},
    },
  };
}

module.exports = {
  formatBridgeOfflineEvent,
  formatBuddyStateEvent,
  formatSidecarEvent,
  parseSidecarCommand,
};
