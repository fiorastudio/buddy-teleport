use crate::mascot_state::{AnimationState, BuddyMcpState, compute_animation_state, frontend_buddy_payload};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub struct PollState {
    pub mcp: BuddyMcpState,
    pub prev_level: u32,
    pub binary_path: Option<String>,
    pub teleported_to_desktop: bool,
}

impl Default for PollState {
    fn default() -> Self {
        Self {
            mcp: BuddyMcpState::default(),
            prev_level: 1,
            binary_path: None,
            teleported_to_desktop: true,
        }
    }
}

/// Start the polling background task. Spawns a Tokio task that calls buddy_status every 2s.
pub fn start_poll(
    binary_path: String,
    shared_state: Arc<Mutex<PollState>>,
    app: AppHandle,
) {
    tauri::async_runtime::spawn(async move {
        let mut backoff_secs = 1u64;
        {
            let mut state = shared_state.lock().unwrap();
            state.binary_path = Some(binary_path.clone());
            state.teleported_to_desktop = true;
        }

        loop {
            if !shared_state.lock().unwrap().teleported_to_desktop {
                tokio::time::sleep(Duration::from_secs(2)).await;
                continue;
            }

            match run_buddy_session(&binary_path, &shared_state, &app).await {
                Ok(()) => { backoff_secs = 1; }
                Err(e) => {
                    eprintln!("[buddy_poll] session error: {e}. Retrying in {backoff_secs}s");
                    {
                        let mut state = shared_state.lock().unwrap();
                        state.mcp.online = false;
                        state.mcp.last_reaction = None;
                    }
                    let _ = app.emit("buddy-offline", ());
                    tokio::time::sleep(Duration::from_secs(backoff_secs)).await;
                    backoff_secs = (backoff_secs * 2).min(30);
                }
            }
        }
    });
}

async fn run_buddy_session(
    binary_path: &str,
    shared_state: &Arc<Mutex<PollState>>,
    app: &AppHandle,
) -> Result<(), String> {
    use crate::buddy_sidecar::BuddySidecar;
    use crate::buddy_client::BuddyClient;

    let sidecar = BuddySidecar::spawn(binary_path)?;
    let mut client = BuddyClient::new(sidecar);
    client.initialize()?;

    let mut consecutive_errors = 0u32;

    loop {
        tokio::time::sleep(Duration::from_secs(2)).await;

        match client.get_status() {
            Ok(new_state) => {
                consecutive_errors = 0;
                let prev_level = {
                    let state = shared_state.lock().unwrap();
                    state.prev_level
                };
                let anim = compute_animation_state(&new_state, prev_level);
                {
                    let mut state = shared_state.lock().unwrap();
                    state.prev_level = state.mcp.level;
                    state.mcp = new_state.clone();
                }
                emit_mascot_event(app, &new_state, &anim);
            }
            Err(e) => {
                consecutive_errors += 1;
                eprintln!("[buddy_poll] status error ({consecutive_errors}): {e}");
                if consecutive_errors >= 3 {
                    return Err(format!("3 consecutive errors: {e}"));
                }
            }
        }
    }
}

fn emit_mascot_event(app: &AppHandle, mcp: &BuddyMcpState, anim: &AnimationState) {
    use serde_json::json;
    let payload = json!({
        "connection": "online",
        "buddy": frontend_buddy_payload(mcp),
        "animationState": anim,
        "errorMessage": null,
    });
    let _ = app.emit("mascot-state-updated", payload);
}

#[cfg(test)]
mod tests {
    use crate::mascot_state::{BuddyMcpState, AnimationState, compute_animation_state};

    #[test]
    fn test_animation_state_sleep_when_offline() {
        let mcp = BuddyMcpState { online: false, ..BuddyMcpState::default() };
        assert_eq!(compute_animation_state(&mcp, 1), AnimationState::Sleep);
    }

    #[test]
    fn test_animation_state_idle_when_online_no_level_up() {
        let mcp = BuddyMcpState { online: true, level: 1, ..BuddyMcpState::default() };
        assert_eq!(compute_animation_state(&mcp, 1), AnimationState::Idle);
    }

    #[test]
    fn test_animation_state_celebrate_on_level_up() {
        let mcp = BuddyMcpState { online: true, level: 2, ..BuddyMcpState::default() };
        assert_eq!(compute_animation_state(&mcp, 1), AnimationState::Celebrate);
    }
}
