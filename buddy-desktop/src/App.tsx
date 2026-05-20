import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { StatusPopup } from "./components/StatusPopup";
import {
  stateFromMascotEvent,
  stateWithInitialBuddy,
  stateWithRefreshedBuddy,
  stateWithReturnedBuddy,
} from "./utils/appState.mjs";
import { buildPermissionDecision } from "./utils/permission.mjs";
import {
  DEFAULT_MASCOT_STATE,
  type MascotState,
} from "./types/state";

export function App() {
  const [state, setState] = useState<MascotState>(DEFAULT_MASCOT_STATE);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    let unlistenMascot: (() => void) | undefined;
    let unlistenOffline: (() => void) | undefined;
    let unlistenTeleportedBack: (() => void) | undefined;

    async function setupListeners() {
      unlistenMascot = await listen<any>("mascot-state-updated", (event) => {
        setState(stateFromMascotEvent(event.payload));
        setPermissionError(null);
      });

      unlistenOffline = await listen<any>("buddy-offline", (event) => {
        setState((current) => ({
          ...current,
          connection: "offline",
          animationState: "sleep",
          errorMessage: (event.payload as any)?.message || "Buddy bridge is offline",
        }));
      });

      unlistenTeleportedBack = await listen<any>("buddy-teleported-back", (event) => {
        setState((current) => stateWithReturnedBuddy(current, event.payload));
      });
      
      // Fetch initial state
      try {
        const initialState = await invoke<any>("buddy_get_state");
        if (initialState) {
          setState((current) => stateWithInitialBuddy(current, initialState));
        }
      } catch (e) {
        console.error("Failed to fetch initial state", e);
      }
    }

    setupListeners();

    return () => {
      if (unlistenMascot) unlistenMascot();
      if (unlistenOffline) unlistenOffline();
      if (unlistenTeleportedBack) unlistenTeleportedBack();
    };
  }, []);

  async function refreshBuddyState(animationState: MascotState["animationState"] = "idle") {
    const refreshedBuddy = await invoke<any>("buddy_get_state");
    setState((current) => stateWithRefreshedBuddy(current, refreshedBuddy, animationState));
  }

  async function handlePetBuddy() {
    try {
      await invoke("buddy_tool", {
        name: "buddy_pet",
        args: {},
      });
      await refreshBuddyState("heart");
      setPermissionError(null);
    } catch (error) {
      setPermissionError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleObserveBuddy() {
    try {
      await invoke("buddy_tool", {
        name: "buddy_observe",
        args: {
          summary: "Buddy checked in from the desktop popup.",
          claims: [],
          edges: [],
        },
      });
      await refreshBuddyState("celebrate");
      setPermissionError(null);
    } catch (error) {
      setPermissionError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handlePermissionDecision(decision: "once" | "deny") {
    try {
      const frame = buildPermissionDecision(state.claudeSession?.pendingPrompt, decision);
      await invoke("ble_respond_permission", {
        id: frame.id,
        decision: frame.decision,
      });
      setPermissionError(null);
    } catch (error) {
      setPermissionError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleTeleportBack() {
    try {
      const returnedBuddy = await invoke<any>("buddy_teleport_back");
      setState((current) =>
        stateWithReturnedBuddy(current, returnedBuddy, "Buddy returned to terminal."),
      );
      setPermissionError(null);
    } catch (error) {
      setPermissionError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <StatusPopup
      state={state}
      onPermissionDecision={handlePermissionDecision}
      onPetBuddy={handlePetBuddy}
      onObserveBuddy={handleObserveBuddy}
      onTeleportBack={handleTeleportBack}
      permissionError={permissionError}
    />
  );
}
