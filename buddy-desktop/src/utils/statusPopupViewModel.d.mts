import type { ClaudeSessionState, MascotState } from "../types/state";

export interface StatusPopupViewModel {
  title: string;
  connectionLabel: MascotState["connection"];
  isOffline: boolean;
  showClaudePanel: boolean;
  showPermissionPrompt: boolean;
  showBuddyActions: boolean;
  showTeleportBack: boolean;
  pendingPrompt: ClaudeSessionState["pendingPrompt"];
}

export function buildStatusPopupViewModel(state?: MascotState | null): StatusPopupViewModel;
