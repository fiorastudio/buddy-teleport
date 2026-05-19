pub mod bridge_process;
pub mod buddy_client;
pub mod buddy_poll;
pub mod buddy_sidecar;
pub mod commands;
pub mod mascot_state;
pub mod mascot_window;
pub mod tray;

use std::path::Path;
use std::sync::{Arc, Mutex};
use tauri::Manager;
use commands::BuddyPollHandle;
use buddy_poll::{start_poll, PollState};

pub fn app_name() -> &'static str {
    "Buddy Desktop"
}

pub fn resolve_buddy_sidecar_path(
    resource_dir: &Path,
    target_triple: &str,
    debug: bool,
    override_path: Option<String>,
) -> String {
    if let Some(path) = override_path.filter(|path| !path.trim().is_empty()) {
        return path;
    }

    if debug {
        resource_dir
            .join("binaries")
            .join(format!("buddy-server-{target_triple}"))
            .to_string_lossy()
            .to_string()
    } else {
        resource_dir
            .join("buddy-server")
            .to_string_lossy()
            .to_string()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let poll_state = Arc::new(Mutex::new(PollState::default()));
    let poll_state_clone = poll_state.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(BuddyPollHandle(poll_state))
        .setup(|app| {
            // Setup tray
            tray::setup_tray(app.handle())?;

            let resource_dir = app.path().resource_dir().expect("resource dir not found");
            let target_triple = tauri::utils::platform::target_triple().unwrap();
            let binary_path = resolve_buddy_sidecar_path(
                &resource_dir,
                &target_triple,
                cfg!(debug_assertions),
                std::env::var("BUDDY_SIDECAR_PATH").ok(),
            );

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
            commands::buddy_teleport_back,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use std::path::Path;

    #[test]
    fn app_name_is_stable() {
        assert_eq!(super::app_name(), "Buddy Desktop");
    }

    #[test]
    fn sidecar_path_can_be_overridden_for_teleport_verification() {
        let path = super::resolve_buddy_sidecar_path(
            Path::new("/app/resources"),
            "aarch64-apple-darwin",
            true,
            Some("/tmp/buddy-wrapper".to_string()),
        );

        assert_eq!(path, "/tmp/buddy-wrapper");
    }

    #[test]
    fn sidecar_path_uses_tauri_resource_binary_by_default() {
        let path = super::resolve_buddy_sidecar_path(
            Path::new("/app/resources"),
            "aarch64-apple-darwin",
            true,
            None,
        );

        assert_eq!(path, "/app/resources/binaries/buddy-server-aarch64-apple-darwin");
    }
}
