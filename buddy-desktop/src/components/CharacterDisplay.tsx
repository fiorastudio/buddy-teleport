import type { AnimationState, BuddyState, ConnectionState } from "../types/state";

export interface CharacterDisplayProps {
  buddy: BuddyState;
  animationState: AnimationState;
  connection: ConnectionState;
}

export function CharacterDisplay({
  buddy,
  animationState,
  connection,
}: CharacterDisplayProps) {
  const art = buddy.asciiArt.length > 0 ? buddy.asciiArt : ["(-.-)"];
  const isOffline = connection === "offline";

  return (
    <section style={styles.root} aria-label="Character display">
      <div style={styles.frame} data-animation-state={animationState}>
        <pre style={styles.art}>{art.join("\n")}</pre>
      </div>
      <div style={styles.captionRow}>
        <span style={isOffline ? styles.offlineDot : styles.onlineDot} aria-hidden="true" />
        <span style={styles.caption} title={`${buddy.mood} - ${animationState}`}>
          {isOffline ? "Offline - sleeping" : `${buddy.mood} - ${animationState}`}
        </span>
      </div>
    </section>
  );
}

const styles = {
  root: {
    display: "grid",
    gap: 8,
    minWidth: 0,
  },
  frame: {
    alignItems: "center",
    background: "#020617",
    border: "1px solid #1e293b",
    borderRadius: 8,
    display: "flex",
    justifyContent: "center",
    minHeight: 112,
    overflow: "hidden",
    padding: 12,
  },
  art: {
    color: "#f8fafc",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize: 13,
    lineHeight: 1.15,
    margin: 0,
    maxWidth: "100%",
    overflow: "hidden",
    overflowWrap: "anywhere" as const,
    textAlign: "center" as const,
    whiteSpace: "pre-wrap" as const,
  },
  captionRow: {
    alignItems: "center",
    display: "flex",
    gap: 6,
    minWidth: 0,
  },
  onlineDot: {
    background: "#22c55e",
    borderRadius: 999,
    flex: "0 0 auto",
    height: 8,
    width: 8,
  },
  offlineDot: {
    background: "#64748b",
    borderRadius: 999,
    flex: "0 0 auto",
    height: 8,
    width: 8,
  },
  caption: {
    color: "#94a3b8",
    fontSize: 12,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
};
