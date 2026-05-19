use crate::buddy_poll::PollState;
use crate::mascot_state::frontend_buddy_payload;
use std::sync::{Arc, Mutex};
use tauri::{Emitter, State};
use serde_json::Value;

pub struct BuddyPollHandle(pub Arc<Mutex<PollState>>);

/// Call any buddy tool (buddy_pet, buddy_dream, etc.) from the frontend.
#[tauri::command]
pub fn buddy_tool(
    name: String,
    args: Option<Value>,
    state: State<BuddyPollHandle>,
) -> Result<String, String> {
    let binary_path = state
        .0
        .lock()
        .unwrap()
        .binary_path
        .clone()
        .ok_or("Buddy sidecar path is not ready yet")?;

    let (result, refreshed_state) = call_buddy_tool_once(&binary_path, &name, args.unwrap_or(Value::Object(Default::default())))?;
    {
        let mut poll_state = state.0.lock().unwrap();
        poll_state.prev_level = poll_state.mcp.level;
        poll_state.mcp = refreshed_state;
    }

    Ok(result.to_string())
}

#[tauri::command]
pub fn buddy_teleport_back(
    state: State<BuddyPollHandle>,
    app: tauri::AppHandle,
) -> Result<Value, String> {
    let binary_path = state
        .0
        .lock()
        .unwrap()
        .binary_path
        .clone()
        .ok_or("Buddy sidecar path is not ready yet")?;

    let (_result, refreshed_state) = call_buddy_tool_once(
        &binary_path,
        "buddy_observe",
        serde_json::json!({
            "summary": "Buddy teleported back from the desktop app to the terminal.",
            "claims": [],
            "edges": []
        }),
    )?;

    let payload = frontend_buddy_payload(&refreshed_state);
    {
        let mut poll_state = state.0.lock().unwrap();
        poll_state.prev_level = poll_state.mcp.level;
        poll_state.mcp = refreshed_state;
        poll_state.mcp.online = false;
        poll_state.teleported_to_desktop = false;
    }

    let _ = app.emit("buddy-teleported-back", serde_json::json!({
        "connection": "offline",
        "animationState": "sleep",
        "buddy": payload,
        "errorMessage": "Buddy returned to terminal."
    }));

    Ok(payload)
}

/// Get the current cached buddy state synchronously.
#[tauri::command]
pub fn buddy_get_state(state: State<BuddyPollHandle>) -> Value {
    frontend_buddy_payload(&state.0.lock().unwrap().mcp)
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

pub fn call_buddy_tool_once(binary_path: &str, name: &str, args: Value) -> Result<(Value, crate::mascot_state::BuddyMcpState), String> {
    if !is_supported_buddy_tool(name) {
        return Err(format!("unsupported Buddy teleport tool: {name}"));
    }

    let sidecar = crate::buddy_sidecar::BuddySidecar::spawn(binary_path)?;
    let mut client = crate::buddy_client::BuddyClient::new(sidecar);
    client.initialize()?;
    let result = client.call_tool(name, args)?;
    let refreshed_state = client.get_status()?;

    Ok((result, refreshed_state))
}

pub fn is_supported_buddy_tool(name: &str) -> bool {
    matches!(
        name,
        "buddy_status"
            | "buddy_pet"
            | "buddy_observe"
            | "buddy_dream"
            | "buddy_remember"
            | "buddy_mode"
            | "buddy_reasoning_status"
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mascot_state::{BuddyMcpState, BuddyStats};

    #[test]
    fn only_safe_teleport_tools_are_exposed() {
        assert!(is_supported_buddy_tool("buddy_pet"));
        assert!(is_supported_buddy_tool("buddy_observe"));
        assert!(is_supported_buddy_tool("buddy_status"));
        assert!(!is_supported_buddy_tool("buddy_hatch"));
        assert!(!is_supported_buddy_tool("buddy_respawn"));
        assert!(!is_supported_buddy_tool("permission"));
    }

    #[test]
    fn cached_state_command_payload_preserves_identity_fields() {
        let state = BuddyMcpState {
            name: "Ada".into(),
            species: "VOID CAT".into(),
            rarity: "RARE".into(),
            level: 3,
            xp: 4,
            xp_to_next: 28,
            personality: "Loyal to the terminal session.".into(),
            stats: BuddyStats { wisdom: 88, ..BuddyStats::default() },
            online: true,
            ..BuddyMcpState::default()
        };

        let payload = frontend_buddy_payload(&state);

        assert_eq!(payload["name"], "Ada");
        assert_eq!(payload["species"], "VOID CAT");
        assert_eq!(payload["personality"], "Loyal to the terminal session.");
        assert_eq!(payload["stats"]["wisdom"], 88);
    }

    #[test]
    fn teleport_back_can_disable_desktop_polling_state() {
        let mut state = PollState::default();
        assert!(state.teleported_to_desktop);
        state.teleported_to_desktop = false;
        state.mcp.online = false;

        assert!(!state.teleported_to_desktop);
        assert!(!state.mcp.online);
    }
}
