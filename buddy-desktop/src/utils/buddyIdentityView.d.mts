import type { BuddyState, BuddyStats } from "../types/state";

export interface BuddyStatRow {
  key: keyof BuddyStats;
  label: string;
  value: number;
}

export interface BuddyIdentityView {
  name: string;
  meta: string;
  levelLabel: string;
  xpAriaLabel: string;
  xpLabel: string;
  xpPercent: number;
  stats: BuddyStatRow[];
  topStat: BuddyStatRow;
  spriteFrames: string[][];
  reaction: string;
}

export function buildBuddyIdentityView(buddy?: Partial<BuddyState>): BuddyIdentityView;
