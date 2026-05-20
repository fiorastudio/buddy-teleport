import type { BuddyState, ConnectionState, MascotState } from "../types/state";

export function connectionFromBuddyPayload(
  buddy?: Partial<BuddyState> | null,
  fallback?: ConnectionState,
): ConnectionState;

export function stateFromMascotEvent(payload?: Partial<MascotState> | null): MascotState;

export function stateWithInitialBuddy(
  current?: MascotState,
  buddy?: Partial<BuddyState> | null,
): MascotState;

export function stateWithRefreshedBuddy(
  current?: MascotState,
  buddy?: Partial<BuddyState> | null,
  animationState?: MascotState["animationState"],
): MascotState;

export function stateWithReturnedBuddy(
  current?: MascotState,
  payload?: Partial<MascotState> | Partial<BuddyState> | null,
  errorMessage?: string | null,
): MascotState;
