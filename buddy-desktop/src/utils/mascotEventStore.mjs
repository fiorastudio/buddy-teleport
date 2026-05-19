import { DEFAULT_MASCOT_STATE } from "./stateDefaults.mjs";

export function createMascotEventStore(initialState = DEFAULT_MASCOT_STATE) {
  let state = initialState;
  const listeners = new Set();

  function notify() {
    for (const listener of listeners) {
      listener(state);
    }
  }

  return {
    getState() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    handleEvent(eventName, payload) {
      if (eventName === "mascot-state-updated") {
        state = {
          ...DEFAULT_MASCOT_STATE,
          ...payload,
          buddy: {
            ...DEFAULT_MASCOT_STATE.buddy,
            ...(payload?.buddy || {}),
          },
        };
        notify();
        return;
      }

      if (eventName === "buddy-offline" || eventName === "bridge-offline") {
        state = {
          ...state,
          connection: "offline",
          animationState: "sleep",
          errorMessage: payload?.message || null,
        };
        notify();
      }
    },
  };
}
