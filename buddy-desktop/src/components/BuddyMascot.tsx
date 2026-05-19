import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { MascotState } from "../types/state";
import { BuddyStats } from "./BuddyStats";
import { CharacterDisplay } from "./CharacterDisplay";
import { DEFAULT_BUDDY_STATE, DEFAULT_MASCOT_STATE } from "../types/state";

export function BuddyMascot() {
  const [state, setState] = useState<MascotState>(DEFAULT_MASCOT_STATE);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let unlistenMascot: (() => void) | undefined;
    let unlistenOffline: (() => void) | undefined;

    async function setupListeners() {
      unlistenMascot = await listen<MascotState>("mascot-state-updated", (event) => {
        setState({
          ...DEFAULT_MASCOT_STATE,
          ...event.payload,
          buddy: {
            ...DEFAULT_BUDDY_STATE,
            ...(event.payload?.buddy || {}),
          },
        });
        setOffline(false);
      });
      unlistenOffline = await listen("buddy-offline", () => {
        setOffline(true);
      });
    }

    setupListeners();

    return () => {
      if (unlistenMascot) unlistenMascot();
      if (unlistenOffline) unlistenOffline();
    };
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      background: "rgba(0,0,0,0.7)",
      borderRadius: 12,
      padding: 8,
      minWidth: 200,
      userSelect: "none",
      color: "#fff",
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {offline && (
        <div style={{ color: "#888", fontSize: 10, marginBottom: 4 }}>
          buddy is sleeping...
        </div>
      )}
      <CharacterDisplay
        buddy={state.buddy}
        animationState={state.animationState}
        connection={state.connection}
      />
      <div style={{ fontSize: 14, fontWeight: "bold", marginTop: 4 }}>
        {state.buddy.name}
      </div>
      <div style={{ fontSize: 10, color: "#aaa" }}>
        Lv.{state.buddy.level} {state.buddy.species}
      </div>
      <BuddyStats buddy={state.buddy} />
    </div>
  );
}
