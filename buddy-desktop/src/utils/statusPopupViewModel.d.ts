import type { MascotState } from "../types/state";

export interface StatusPopupViewModel {
  title: string;
  connectionLabel: string;
  isOffline: boolean;
  showClaudePanel: boolean;
  showPermissionPrompt: boolean;
  showTeleportBack: boolean;
  pendingPrompt: NonNullable<NonNullable<MascotState["claudeSession"]>["pendingPrompt"]> | null;
}

export function buildStatusPopupViewModel(state?: MascotState | null): StatusPopupViewModel;
