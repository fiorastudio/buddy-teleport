import { DEFAULT_MASCOT_STATE } from "./stateDefaults.mjs";

export function buildStatusPopupViewModel(state = DEFAULT_MASCOT_STATE) {
  const mascotState = state || DEFAULT_MASCOT_STATE;
  const claude = mascotState.claudeSession || null;
  const pendingPrompt = claude?.pendingPrompt || null;
  const isOffline = mascotState.connection === "offline";

  return {
    title: isOffline ? "Quiet mode" : "Status",
    connectionLabel: mascotState.connection,
    isOffline,
    showClaudePanel: Boolean(claude && claude.status !== "inactive"),
    showPermissionPrompt: Boolean(pendingPrompt?.id),
    showBuddyActions: !isOffline,
    showTeleportBack: !isOffline,
    pendingPrompt,
  };
}
