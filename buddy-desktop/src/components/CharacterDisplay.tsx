import type { AnimationState, BuddyState, ConnectionState } from "../types/state";
import { buildBuddyIdentityView } from "../utils/buddyIdentityView.mjs";
import { buddyVisualModel } from "../utils/stateHelpers.mjs";

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
  const isOffline = connection === "offline";
  const visual = buddyVisualModel(buddy, connection, animationState);
  const identityView = buildBuddyIdentityView(buddy);

  return (
    <section style={styles.root} aria-label="Character display">
      <div
        style={{
          ...styles.frame,
          background: `radial-gradient(circle at 50% 18%, ${visual.surface}, #020617 72%)`,
          borderColor: visual.accent,
        }}
        className={`buddy-avatar buddy-avatar-${visual.expression}`}
        data-animation-state={animationState}
      >
        <div style={{ ...styles.orbit, borderColor: visual.accent }} aria-hidden="true" />
        {identityView.spriteFrames.length > 0 ? (
          <div className="buddy-sprite" style={{ ...styles.sprite, color: visual.accent }}>
            {identityView.spriteFrames.map((frame, index) => (
              <pre
                key={index}
                className="buddy-sprite-frame"
                aria-hidden={index === 0 ? undefined : "true"}
              >
                {frame.join("\n")}
              </pre>
            ))}
          </div>
        ) : (
          <div style={styles.body} aria-hidden="true">
            <div style={{ ...styles.head, borderColor: visual.accent }}>
              <span style={styles.eye} />
              <span style={styles.eye} />
            </div>
            <div style={{ ...styles.core, background: visual.accent }}>
              {buddy.name.slice(0, 1).toUpperCase() || "B"}
            </div>
          </div>
        )}
      </div>

      <div style={styles.traitRow}>
        <span style={{ ...styles.traitPill, borderColor: visual.accent, color: visual.accent }}>
          {identityView.topStat.label}
        </span>
        <span style={styles.traitText} title={identityView.meta}>
          {identityView.meta}
        </span>
      </div>

      <div style={styles.captionRow}>
        <span style={isOffline ? styles.offlineDot : styles.onlineDot} aria-hidden="true" />
        <span style={styles.caption} title={`${buddy.mood} - ${visual.expression}`}>
          {isOffline ? "Offline - sleeping" : `${buddy.mood} - ${visual.expression}`}
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
    minHeight: 132,
    overflow: "hidden",
    padding: 12,
    position: "relative" as const,
  },
  orbit: {
    border: "1px solid",
    borderRadius: "50%",
    height: 86,
    opacity: 0.28,
    position: "absolute" as const,
    transform: "rotate(-10deg) skewX(-18deg)",
    width: 128,
  },
  sprite: {
    display: "grid",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize: 16,
    fontWeight: 800,
    minHeight: 68,
    minWidth: 116,
    lineHeight: 1.05,
    margin: 0,
    maxWidth: "100%",
    overflow: "hidden",
    placeItems: "center",
    position: "relative" as const,
    textAlign: "center" as const,
    textShadow: "0 0 16px currentColor",
    whiteSpace: "pre" as const,
  },
  body: {
    alignItems: "center",
    display: "grid",
    gap: 6,
    justifyItems: "center",
    position: "relative" as const,
  },
  head: {
    alignItems: "center",
    background: "#f8fafc",
    border: "3px solid",
    borderRadius: "48% 48% 44% 44%",
    display: "flex",
    gap: 12,
    height: 48,
    justifyContent: "center",
    width: 58,
  },
  eye: {
    background: "#020617",
    borderRadius: "50%",
    height: 8,
    width: 8,
  },
  core: {
    alignItems: "center",
    border: "2px solid rgba(255,255,255,0.72)",
    borderRadius: "50%",
    color: "#020617",
    display: "flex",
    fontSize: 15,
    fontWeight: 800,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  traitRow: {
    alignItems: "center",
    display: "grid",
    gap: 8,
    gridTemplateColumns: "auto minmax(0, 1fr)",
    minWidth: 0,
  },
  traitPill: {
    border: "1px solid",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
    lineHeight: 1,
    padding: "5px 7px",
    textTransform: "uppercase" as const,
  },
  traitText: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
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
