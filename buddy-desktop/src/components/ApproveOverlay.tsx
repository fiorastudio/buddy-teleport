import type { ClaudeSessionState } from "../types/state";

export interface ApproveOverlayProps {
  prompt: NonNullable<ClaudeSessionState["pendingPrompt"]>;
  onDecision: (decision: "once" | "deny") => void;
  errorMessage?: string | null;
}

export function ApproveOverlay({ prompt, onDecision, errorMessage }: ApproveOverlayProps) {
  return (
    <section style={styles.overlay} aria-label="Permission prompt">
      <div style={styles.tool}>{prompt.tool || "Tool request"}</div>
      <p style={styles.hint} title={prompt.hint}>{prompt.hint}</p>
      {errorMessage ? <p style={styles.error}>{errorMessage}</p> : null}
      <div style={styles.actions}>
        <button style={styles.approve} onClick={() => onDecision("once")}>Approve once</button>
        <button style={styles.deny} onClick={() => onDecision("deny")}>Deny</button>
      </div>
    </section>
  );
}

const styles = {
  overlay: {
    background: "#172554",
    border: "1px solid #2563eb",
    borderRadius: 8,
    display: "grid",
    gap: 8,
    padding: 10,
  },
  tool: {
    color: "#dbeafe",
    fontSize: 13,
    fontWeight: 700,
    overflowWrap: "anywhere" as const,
  },
  hint: {
    color: "#bfdbfe",
    fontSize: 12,
    lineHeight: 1.35,
    margin: 0,
    maxHeight: 52,
    overflow: "hidden",
    overflowWrap: "anywhere" as const,
  },
  error: {
    color: "#fecaca",
    fontSize: 12,
    margin: 0,
  },
  actions: {
    display: "grid",
    gap: 8,
    gridTemplateColumns: "1fr 1fr",
  },
  approve: {
    background: "#22c55e",
    border: "none",
    borderRadius: 6,
    color: "#052e16",
    cursor: "pointer",
    fontWeight: 700,
    padding: "8px 10px",
  },
  deny: {
    background: "#450a0a",
    border: "1px solid #7f1d1d",
    borderRadius: 6,
    color: "#fecaca",
    cursor: "pointer",
    padding: "8px 10px",
  },
};
