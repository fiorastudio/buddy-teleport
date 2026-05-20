import { buddySpriteFrames, compactText, percent, statRows } from "./stateHelpers.mjs";

export function buildBuddyIdentityView(buddy = {}) {
  const name = compactText(buddy.name, "Buddy");
  const rarity = compactText(buddy.rarity, "common");
  const species = compactText(buddy.species, "Buddy");
  const level = Number.isFinite(buddy.level) ? buddy.level : 0;
  const xp = Number.isFinite(buddy.xp) ? buddy.xp : 0;
  const xpToNext = Number.isFinite(buddy.xpToNext) ? buddy.xpToNext : 0;
  const stats = statRows(buddy.stats);
  const topStat = stats.reduce((best, current) => (current.value > best.value ? current : best), stats[0]);

  return {
    name,
    meta: `${rarity} ${species}`,
    levelLabel: `Lv. ${level}`,
    xpAriaLabel: `XP ${xp} of ${xpToNext}`,
    xpLabel: `${xp}/${xpToNext}`,
    xpPercent: percent(xp, xpToNext),
    stats,
    topStat,
    spriteFrames: buddySpriteFrames(buddy.asciiArt),
    reaction: compactText(buddy.lastReaction, ""),
  };
}
