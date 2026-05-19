import type { BuddyState, BuddyStats as BuddyStatsShape } from "../types/state";

const STAT_KEYS: (keyof BuddyStatsShape)[] = [
  "debugging",
  "patience",
  "chaos",
  "wisdom",
  "snark",
];

const MAX_STAT = 100;

function clampPercent(value: number, total: number): number {
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.min(Math.max((value / total) * 100, 0), 100);
}

function statLabel(key: string): string {
  return key[0].toUpperCase() + key.slice(1);
}

export interface BuddyStatsProps {
  buddy: BuddyState;
}

export function BuddyStats({ buddy }: BuddyStatsProps) {
  const xpPercent = clampPercent(buddy.xp, buddy.xpToNext);

  return (
    <section style={styles.root} aria-label="Buddy stats">
      <div style={styles.identityRow}>
        <div style={styles.identityText}>
          <strong style={styles.name} title={buddy.name}>
            {buddy.name}
          </strong>
          <span style={styles.meta} title={`${buddy.rarity} ${buddy.species}`}>
            {buddy.rarity} {buddy.species}
          </span>
        </div>
        <span style={styles.level}>Lv. {buddy.level}</span>
      </div>

      <div style={styles.xpBlock} aria-label={`XP ${buddy.xp} of ${buddy.xpToNext}`}>
        <div style={styles.xpText}>
          <span>XP</span>
          <span>
            {buddy.xp}/{buddy.xpToNext}
          </span>
        </div>
        <div style={styles.track}>
          <div style={{ ...styles.fill, width: `${xpPercent}%` }} />
        </div>
      </div>

      <div style={styles.statsGrid}>
        {STAT_KEYS.map((key) => {
          const value = Math.min(Math.max(Number(buddy.stats[key] ?? 0), 0), MAX_STAT);

          return (
            <div key={key} style={styles.statRow}>
              <span style={styles.statName}>{statLabel(key)}</span>
              <div style={styles.statTrack} aria-hidden="true">
                <div style={{ ...styles.statFill, width: `${value}%` }} />
              </div>
              <span style={styles.statValue}>{value}</span>
            </div>
          );
        })}
      </div>

      {buddy.lastReaction ? (
        <p style={styles.reaction} title={buddy.lastReaction}>
          {buddy.lastReaction}
        </p>
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
    color: "#e2e8f0",
    fontSize: 12,
    lineHeight: 1.35,
    margin: 0,
    maxHeight: 48,
    overflow: "hidden",
    overflowWrap: "anywhere" as const,
  },
};
