use crate::buddy_poll::PollState;
use crate::mascot_state::BuddyMcpState;
use std::sync::{Arc, Mutex};
use tauri::State;
use serde_json::Value;

pub struct BuddyPollHandle(pub Arc<Mutex<PollState>>);

/// Call any buddy tool (buddy_pet, buddy_dream, etc.) from the frontend.
#[tauri::command]
pub fn buddy_tool(
    name: String,
    _args: Option<Value>,
    _state: State<BuddyPollHandle>,
) -> Result<String, String> {
    // Interactive tool calls are stubbed in Plan A v1
    Err(format!("buddy_tool({name}) not yet wired — use buddy_get_state for reads"))
}

/// Get the current cached buddy state synchronously.
#[tauri::command]
pub fn buddy_get_state(state: State<BuddyPollHandle>) -> BuddyMcpState {
    state.0.lock().unwrap().mcp.clone()
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
