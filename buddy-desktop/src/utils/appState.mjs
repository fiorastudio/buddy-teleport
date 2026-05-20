import { DEFAULT_BUDDY_STATE, DEFAULT_MASCOT_STATE } from "./stateDefaults.mjs";

export function connectionFromBuddyPayload(buddy, fallback = "offline") {
  if (buddy?.mood === "teleported") {
    return "online";
  }

  if (buddy?.mood === "sleeping") {
    return "offline";
  }

  return fallback;
}

export function stateFromMascotEvent(payload = {}) {
  return {
    ...DEFAULT_MASCOT_STATE,
    ...payload,
    buddy: {
      ...DEFAULT_BUDDY_STATE,
      ...(payload?.buddy || {}),
    },
  };
}

export function stateWithInitialBuddy(current = DEFAULT_MASCOT_STATE, buddy) {
  if (!buddy) {
    return current;
  }

  const connection = connectionFromBuddyPayload(buddy);
  return {
    ...current,
    buddy: {
      ...DEFAULT_BUDDY_STATE,
      ...buddy,
    },
    connection,
    animationState: connection === "online" ? "idle" : "sleep",
  };
}

export function stateWithRefreshedBuddy(
  current = DEFAULT_MASCOT_STATE,
  buddy,
  animationState = "idle",
) {
  return {
    ...current,
    buddy: {
      ...DEFAULT_BUDDY_STATE,
      ...(buddy || {}),
    },
    connection: connectionFromBuddyPayload(buddy, "online"),
    animationState,
    errorMessage: null,
  };
}

export function stateWithReturnedBuddy(
  current = DEFAULT_MASCOT_STATE,
  payload = {},
  errorMessage,
) {
  const isMascotPayload = Boolean(payload?.buddy);
  const buddyPayload = isMascotPayload ? payload.buddy : payload;

  return {
    ...current,
    ...(isMascotPayload ? payload : {}),
    buddy: {
      ...DEFAULT_BUDDY_STATE,
      ...(buddyPayload || current.buddy),
    },
    connection: "offline",
    animationState: "sleep",
    errorMessage:
      errorMessage === undefined ? payload?.errorMessage ?? current.errorMessage : errorMessage,
  };
}
