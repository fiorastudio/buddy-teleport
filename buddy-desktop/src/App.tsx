import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { StatusPopup } from "./components/StatusPopup";
import {
  DEFAULT_BUDDY_STATE,
  DEFAULT_MASCOT_STATE,
  MOCK_MASCOT_STATE,
  type MascotState,
} from "./types/state";

export function App() {
  const [state, setState] = useState<MascotState>(MOCK_MASCOT_STATE);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    let unlistenMascot: (() => void) | undefined;
    let unlistenOffline: (() => void) | undefined;

    async function setupListeners() {
      unlistenMascot = await listen<any>("mascot-state-updated", (event) => {
        setState({
          ...DEFAULT_MASCOT_STATE,
          ...event.payload,
          buddy: {
            ...DEFAULT_BUDDY_STATE,
            ...(event.payload?.buddy || {}),
          },
        });
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
      
      // Fetch initial state
      try {
        const initialState = await invoke<any>("buddy_get_state");
        if (initialState) {
          setState((current) => ({
            ...current,
            buddy: {
              ...DEFAULT_BUDDY_STATE,
              ...initialState,
            },
            connection: "online",
          }));
        }
      } catch (e) {
        console.error("Failed to fetch initial state", e);
      }
    }

    setupListeners();

    return () => {
      if (unlistenMascot) unlistenMascot();
      if (unlistenOffline) unlistenOffline();
    };
  }, []);

  async function handlePermissionDecision(decision: "once" | "deny") {
    try {
      await invoke("buddy_tool", {
        name: "permission",
        args: {
          id: state.claudeSession?.pendingPrompt?.id,
          decision,
        },
      });
      setPermissionError(null);
    } catch (error) {
      setPermissionError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <StatusPopup
      state={state}
      onPermissionDecision={handlePermissionDecision}
      permissionError={permissionError}
    />
  );
}
