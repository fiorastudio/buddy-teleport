import { useEffect, useState } from "react";
import { StatusPopup } from "./components/StatusPopup";
import { buildPermissionDecision } from "./utils/permission.mjs";
import {
  DEFAULT_MASCOT_STATE,
  MOCK_MASCOT_STATE,
  type MascotState,
} from "./types/state";

export function App() {
  const [state, setState] = useState<MascotState>(MOCK_MASCOT_STATE);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    const onMascotState = (event: Event) => {
      const customEvent = event as CustomEvent<MascotState>;
      setState({
        ...DEFAULT_MASCOT_STATE,
        ...customEvent.detail,
      });
      setPermissionError(null);
    };

    const onBridgeOffline = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      setState((current) => ({
        ...current,
        connection: "offline",
        animationState: "sleep",
        errorMessage: customEvent.detail?.message || "Buddy bridge is offline",
      }));
    };

    window.addEventListener("mascot-state-updated", onMascotState);
    window.addEventListener("bridge-offline", onBridgeOffline);

    return () => {
      window.removeEventListener("mascot-state-updated", onMascotState);
      window.removeEventListener("bridge-offline", onBridgeOffline);
    };
  }, []);

  function handlePermissionDecision(decision: "once" | "deny") {
    try {
      const payload = buildPermissionDecision(state.claudeSession?.pendingPrompt, decision);
      window.dispatchEvent(new CustomEvent("buddy-permission-decision", { detail: payload }));
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
