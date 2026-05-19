import { BuddyStats } from "./BuddyStats";
import { CharacterDisplay } from "./CharacterDisplay";
import { ApproveOverlay } from "./ApproveOverlay";
import {
  DEFAULT_MASCOT_STATE,
  MOCK_MASCOT_STATE,
  type MascotState,
} from "../types/state";
import { buildStatusPopupViewModel } from "../utils/statusPopupViewModel.mjs";

export interface StatusPopupProps {
  state?: MascotState | null;
  onPermissionDecision?: (decision: "once" | "deny") => void;
  onPetBuddy?: () => void;
  onObserveBuddy?: () => void;
  onTeleportBack?: () => void;
  permissionError?: string | null;
}

export function StatusPopup({
  state = DEFAULT_MASCOT_STATE,
  onPermissionDecision = () => {},
  onPetBuddy = () => {},
  onObserveBuddy = () => {},
  onTeleportBack = () => {},
  permissionError = null,
}: StatusPopupProps) {
  const mascotState = state ?? DEFAULT_MASCOT_STATE;
  const { buddy, claudeSession, connection, animationState, errorMessage } = mascotState;
  const view = buildStatusPopupViewModel(mascotState);

  return (
    <main style={styles.popup} aria-label="Buddy status popup">
      <header style={styles.header}>
        <div style={styles.titleBlock}>
          <span style={styles.eyebrow}>Buddy Desktop</span>
          <h1 style={styles.title}>{view.title}</h1>
        </div>
        <span style={view.isOffline ? styles.offlineBadge : styles.onlineBadge}>
          {view.connectionLabel}
        </span>
      </header>

      <CharacterDisplay
        buddy={buddy}
        animationState={animationState}
        connection={connection}
      />

      <BuddyStats buddy={buddy} />

      {view.showBuddyActions ? (
        <div style={styles.actionRow} aria-label="Buddy actions">
          <button
            type="button"
            style={styles.actionButton}
            onClick={onPetBuddy}
            title="Pet Buddy"
          >
            Pet
          </button>
          <button
            type="button"
            style={styles.actionButton}
            onClick={onObserveBuddy}
            title="Record a desktop check-in"
          >
            Observe
          </button>
          {view.showTeleportBack ? (
            <button
              type="button"
              style={styles.teleportBackButton}
              onClick={onTeleportBack}
              title="Return Buddy to the terminal"
            >
              Return
            </button>
          ) : null}
        </div>
      ) : null}

      {errorMessage ? (
        <p style={styles.error} title={errorMessage}>
          {errorMessage}
        </p>
      ) : null}

      {view.showPermissionPrompt && view.pendingPrompt ? (
        <ApproveOverlay
          prompt={view.pendingPrompt}
          onDecision={onPermissionDecision}
          errorMessage={permissionError}
        />
      ) : null}

      {view.showClaudePanel && claudeSession ? (
        <section style={styles.claudePanel} aria-label="Claude session">
          <div style={styles.claudeStatus}>{claudeSession.status}</div>
          {claudeSession.projectName ? (
            <div style={styles.claudeText} title={claudeSession.projectName}>
              {claudeSession.projectName}
            </div>
          ) : null}
          {claudeSession.lastPromptSummary ? (
            <p style={styles.claudeSummary} title={claudeSession.lastPromptSummary}>
              {claudeSession.lastPromptSummary}
            </p>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

export { DEFAULT_MASCOT_STATE, MOCK_MASCOT_STATE };

const badgeBase = {
  borderRadius: 999,
  fontSize: 11,
  lineHeight: 1,
  maxWidth: 104,
  overflow: "hidden",
  padding: "6px 8px",
  textOverflow: "ellipsis",
  textTransform: "capitalize" as const,
  whiteSpace: "nowrap" as const,
};

const styles = {
  popup: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 8,
    boxSizing: "border-box" as const,
    color: "#e2e8f0",
    display: "grid",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    gap: 14,
    maxWidth: 340,
    minWidth: 260,
    overflow: "hidden",
    padding: 14,
    width: "min(340px, 100vw)",
  },
  header: {
    alignItems: "start",
    display: "grid",
    gap: 10,
    gridTemplateColumns: "minmax(0, 1fr) auto",
    minWidth: 0,
  },
  titleBlock: {
    display: "grid",
    gap: 2,
    minWidth: 0,
  },
  eyebrow: {
    color: "#94a3b8",
    fontSize: 11,
    letterSpacing: 0,
    lineHeight: 1.2,
  },
  title: {
    color: "#f8fafc",
    fontSize: 18,
    lineHeight: 1.15,
    margin: 0,
    overflowWrap: "anywhere" as const,
  },
  onlineBadge: {
    ...badgeBase,
    background: "#052e16",
    border: "1px solid #166534",
    color: "#bbf7d0",
  },
  offlineBadge: {
    ...badgeBase,
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#cbd5e1",
  },
  error: {
    background: "#450a0a",
    border: "1px solid #7f1d1d",
    borderRadius: 6,
    color: "#fecaca",
    fontSize: 12,
    lineHeight: 1.35,
    margin: 0,
    maxHeight: 52,
    overflow: "hidden",
    overflowWrap: "anywhere" as const,
    padding: 8,
  },
  claudePanel: {
    background: "#111827",
    border: "1px solid #273449",
    borderRadius: 6,
    display: "grid",
    gap: 4,
    minWidth: 0,
    padding: 8,
  },
  claudeStatus: {
    color: "#bfdbfe",
    fontSize: 11,
    textTransform: "capitalize" as const,
  },
  claudeText: {
    color: "#f8fafc",
    fontSize: 12,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  claudeSummary: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 1.35,
    margin: 0,
    maxHeight: 48,
    overflow: "hidden",
    overflowWrap: "anywhere" as const,
  },
  actionRow: {
    display: "grid",
    gap: 8,
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    minWidth: 0,
  },
  actionButton: {
    background: "#1f2937",
    border: "1px solid #334155",
    borderRadius: 6,
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    minWidth: 0,
    overflow: "hidden",
    padding: "8px 10px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  teleportBackButton: {
    background: "#172554",
    border: "1px solid #1d4ed8",
    borderRadius: 6,
    color: "#dbeafe",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    minWidth: 0,
    overflow: "hidden",
    padding: "8px 10px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
};
