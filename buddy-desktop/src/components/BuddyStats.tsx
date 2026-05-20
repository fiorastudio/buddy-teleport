import type { BuddyState } from "../types/state";
import type { BuddyStatRow } from "../utils/buddyIdentityView.mjs";
import { buildBuddyIdentityView } from "../utils/buddyIdentityView.mjs";

export interface BuddyStatsProps {
  buddy: BuddyState;
}

export function BuddyStats({ buddy }: BuddyStatsProps) {
  const view = buildBuddyIdentityView(buddy);

  return (
    <section style={styles.root} aria-label="Buddy stats">
      <div style={styles.identityRow}>
        <div style={styles.identityText}>
          <strong style={styles.name} title={view.name}>
            {view.name}
          </strong>
          <span style={styles.meta} title={view.meta}>
            {view.meta}
          </span>
        </div>
        <span style={styles.level}>{view.levelLabel}</span>
      </div>

      <div style={styles.xpBlock} aria-label={view.xpAriaLabel}>
        <div style={styles.xpText}>
          <span>XP</span>
          <span>{view.xpLabel}</span>
        </div>
        <div style={styles.track}>
          <div style={{ ...styles.fill, width: `${view.xpPercent}%` }} />
        </div>
      </div>

      <div style={styles.statsGrid}>
        {view.stats.map((stat: BuddyStatRow) => (
          <div key={stat.key} style={styles.statRow}>
            <span style={styles.statName}>{stat.label}</span>
            <div style={styles.statTrack} aria-hidden="true">
              <div style={{ ...styles.statFill, width: `${stat.value}%` }} />
            </div>
            <span style={styles.statValue}>{stat.value}</span>
          </div>
        ))}
      </div>

      {view.reaction ? (
        <div style={styles.reaction} aria-label="Latest Buddy reaction">
          <span style={styles.reactionLabel}>Latest reaction</span>
          <p style={styles.reactionText} title={view.reaction}>
            {view.reaction}
          </p>
        </div>
      ) : null}
    </section>
  );
}

const styles = {
  root: {
    display: "grid",
    gap: 10,
    minWidth: 0,
  },
  identityRow: {
    alignItems: "start",
    display: "grid",
    gap: 8,
    gridTemplateColumns: "minmax(0, 1fr) auto",
  },
  identityText: {
    display: "grid",
    gap: 2,
    minWidth: 0,
  },
  name: {
    color: "#f8fafc",
    fontSize: 16,
    lineHeight: 1.2,
    overflowWrap: "anywhere" as const,
  },
  meta: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 1.3,
    overflowWrap: "anywhere" as const,
    textTransform: "capitalize" as const,
  },
  level: {
    background: "#1f2937",
    border: "1px solid #334155",
    borderRadius: 6,
    color: "#e2e8f0",
    fontSize: 12,
    lineHeight: 1,
    padding: "5px 7px",
    whiteSpace: "nowrap" as const,
  },
  xpBlock: {
    display: "grid",
    gap: 4,
  },
  xpText: {
    color: "#cbd5e1",
    display: "flex",
    fontSize: 11,
    justifyContent: "space-between",
  },
  track: {
    background: "#111827",
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
  },
  fill: {
    background: "#38bdf8",
    borderRadius: 999,
    height: "100%",
  },
  statsGrid: {
    display: "grid",
    gap: 6,
  },
  statRow: {
    alignItems: "center",
    display: "grid",
    gap: 8,
    gridTemplateColumns: "70px minmax(56px, 1fr) 28px",
    minWidth: 0,
  },
  statName: {
    color: "#cbd5e1",
    fontSize: 11,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  statTrack: {
    background: "#111827",
    borderRadius: 999,
    height: 5,
    overflow: "hidden",
  },
  statFill: {
    background: "#a3e635",
    borderRadius: 999,
    height: "100%",
  },
  statValue: {
    color: "#94a3b8",
    fontVariantNumeric: "tabular-nums" as const,
    fontSize: 11,
    textAlign: "right" as const,
  },
  reaction: {
    background: "#f8fafc",
    borderRadius: 8,
    color: "#111827",
    display: "grid",
    gap: 5,
    lineHeight: 1.35,
    margin: 0,
    overflowWrap: "anywhere" as const,
    padding: "9px 10px",
  },
  reactionLabel: {
    color: "#475569",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase" as const,
  },
  reactionText: {
    fontSize: 12,
    margin: 0,
    overflowWrap: "anywhere" as const,
  },
};
