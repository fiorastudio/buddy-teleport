import type { BuddyState, ConnectionState } from "../types/state";

export function connectionFromBuddyPayload(
  buddy?: Partial<BuddyState> | null,
  fallback?: ConnectionState,
): ConnectionState;
