export const MAX_STAT_VALUE = 100;

export function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

export function percent(value, total) {
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return clampNumber((value / total) * 100, 0, 100);
}

export function statRows(stats) {
  return ["debugging", "patience", "chaos", "wisdom", "snark"].map((key) => ({
    key,
    label: key[0].toUpperCase() + key.slice(1),
    value: clampNumber(Number(stats?.[key] ?? 0), 0, MAX_STAT_VALUE),
  }));
}

export function dominantStat(stats) {
  return statRows(stats).reduce((winner, row) => (row.value > winner.value ? row : winner));
}

export function buddyVisualModel(buddy = {}, connection = "offline", animationState = "sleep") {
  const stat = dominantStat(buddy.stats);
  const palette = {
    debugging: { accent: "#38bdf8", surface: "#0f2f45" },
    patience: { accent: "#22c55e", surface: "#12351f" },
    chaos: { accent: "#f97316", surface: "#43220d" },
    wisdom: { accent: "#a78bfa", surface: "#2e245f" },
    snark: { accent: "#facc15", surface: "#3a3008" },
  }[stat.key] || { accent: "#38bdf8", surface: "#0f2f45" };

  return {
    accent: palette.accent,
    surface: palette.surface,
    expression: connection === "offline" ? "sleep" : animationState,
    topStat: stat,
  };
}

export function compactText(value, fallback = "Unknown") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

export function isOfflineState(state) {
  return !state || state.connection === "offline";
}
