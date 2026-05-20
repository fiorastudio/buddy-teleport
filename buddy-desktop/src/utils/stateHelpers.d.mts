import type {
  AnimationState,
  BuddyState,
  BuddyStats,
  ConnectionState,
  MascotState,
} from "../types/state";

export const MAX_STAT_VALUE: 100;

export interface BuddyStatRow {
  key: keyof BuddyStats;
  label: string;
  value: number;
}

export interface BuddyVisualModel {
  accent: string;
  surface: string;
  expression: AnimationState;
  topStat: BuddyStatRow;
}

export function clampNumber(value: number, min: number, max: number): number;
export function percent(value: number, total: number): number;
export function statRows(stats?: Partial<BuddyStats> | null): BuddyStatRow[];
export function dominantStat(stats?: Partial<BuddyStats> | null): BuddyStatRow;
export function buddyVisualModel(
  buddy?: Partial<BuddyState>,
  connection?: ConnectionState,
  animationState?: AnimationState,
): BuddyVisualModel;
export function buddySpriteFrames(asciiArt?: string[]): string[][];
export function compactText(value: unknown, fallback?: string): string;
export function isOfflineState(state?: Pick<MascotState, "connection"> | null): boolean;
