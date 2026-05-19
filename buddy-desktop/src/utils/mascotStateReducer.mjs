import { DEFAULT_MASCOT_STATE } from "./stateDefaults.mjs";

export function reduceMascotState(previous = DEFAULT_MASCOT_STATE, event) {
  switch (event?.type) {
    case "buddy_state":
      return {
        ...previous,
        connection: "online",
        buddy: {
          ...previous.buddy,
          ...event.buddy,
        },
        animationState: computeAnimationState({
          buddyOnline: true,
          buddyLevelUp: Number(event.buddy?.level || 0) > Number(previous.buddy?.level || 0),
          claude: previous.claudeSession,
        }),
      };
    case "claude_heartbeat": {
      const claude = normalizeClaudeHeartbeat(event.heartbeat);
      return {
        ...previous,
        claudeSession: claude,
        animationState: computeAnimationState({
          buddyOnline: previous.connection === "online",
          claude,
        }),
      };
    }
    case "claude_disconnected":
      return {
        ...previous,
        claudeSession: {
          ...(previous.claudeSession || {}),
          connected: false,
        },
        animationState: previous.connection === "online" ? "idle" : "sleep",
      };
    case "permission_approved":
      return {
        ...previous,
        animationState: "heart",
      };
    default:
      return previous;
  }
}

export function normalizeClaudeHeartbeat(heartbeat) {
  return {
    connected: true,
    total: Number(heartbeat?.total || 0),
    running: Number(heartbeat?.running || 0),
    waiting: Number(heartbeat?.waiting || 0),
    msg: String(heartbeat?.msg || ""),
    entries: Array.isArray(heartbeat?.entries) ? heartbeat.entries.map(String) : [],
    tokensToday: Number(heartbeat?.tokens_today || heartbeat?.tokensToday || 0),
    pendingPrompt: heartbeat?.prompt
      ? {
          id: String(heartbeat.prompt.id || ""),
          tool: String(heartbeat.prompt.tool || ""),
          hint: String(heartbeat.prompt.hint || ""),
        }
      : null,
    lastHeartbeatAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

export function computeAnimationState({ buddyOnline = false, buddyLevelUp = false, claude = null } = {}) {
  if (claude?.pendingPrompt || Number(claude?.waiting || 0) > 0) {
    return "attention";
  }
  if (Number(claude?.running || 0) > 0) {
    return "busy";
  }
  if (buddyLevelUp) {
    return "celebrate";
  }
  if (buddyOnline || claude?.connected) {
    return "idle";
  }
  return "sleep";
}
