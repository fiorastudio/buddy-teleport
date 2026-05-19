pub mod bridge_process;
pub mod buddy_client;
pub mod buddy_poll;
pub mod buddy_sidecar;
pub mod commands;
pub mod mascot_state;
pub mod mascot_window;
pub mod tray;

use std::sync::{Arc, Mutex};
use tauri::Manager;
use commands::BuddyPollHandle;
use buddy_poll::{start_poll, PollState};

pub fn app_name() -> &'static str {
    "Buddy Desktop"
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let poll_state = Arc::new(Mutex::new(PollState::default()));
    let poll_state_clone = poll_state.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(BuddyPollHandle(poll_state))
        .setup(|app| {
            // In development, find the binary in src-tauri/binaries/
            let binary_path = if cfg!(debug_assertions) {
                app.path().resource_dir()
                    .expect("resource dir not found")
                    .join("binaries")
                    .join("buddy-server-aarch64-apple-darwin")
                    .to_string_lossy()
                    .to_string()
            } else {
                app.path().resource_dir()
                    .expect("resource dir not found")
                    .join("buddy-server")
                    .to_string_lossy()
                    .to_string()
            };

            let app_handle = app.handle().clone();
            start_poll(binary_path, poll_state_clone, app_handle);
            
            mascot_window::create_mascot_window(&app.handle())
                .unwrap_or_else(|e| eprintln!("mascot window error: {e}"));
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::buddy_tool,
            commands::buddy_get_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
