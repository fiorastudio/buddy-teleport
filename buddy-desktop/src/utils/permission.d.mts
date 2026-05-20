import type { ClaudeSessionState } from "../types/state";

export type PermissionDecision = "once" | "deny";

export interface PermissionDecisionCommand {
  cmd: "permission";
  id: string;
  decision: PermissionDecision;
}

export function buildPermissionDecision(
  prompt: ClaudeSessionState["pendingPrompt"],
  decision: PermissionDecision,
): PermissionDecisionCommand;

export function promptSummary(prompt?: ClaudeSessionState["pendingPrompt"]): string;
