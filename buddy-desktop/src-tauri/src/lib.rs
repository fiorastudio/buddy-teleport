pub mod ble;
pub mod bridge_process;
pub mod buddy_client;
pub mod buddy_poll;
pub mod buddy_sidecar;
pub mod commands;
pub mod mascot_state;
pub mod mascot_window;
pub mod tray;

use buddy_poll::{start_poll, PollState};
use commands::BuddyPollHandle;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use tauri::Manager;

pub fn app_name() -> &'static str {
    "Buddy Desktop"
}

pub fn resolve_buddy_sidecar_path(
    resource_dir: &Path,
    target_triple: &str,
    debug: bool,
    override_path: Option<String>,
    installed_entry_path: Option<String>,
) -> String {
    if let Some(path) = override_path.filter(|path| !path.trim().is_empty()) {
        return path;
    }

    let bundled_path = bundled_buddy_sidecar_path(resource_dir, target_triple, debug);
    if debug {
        if bundled_path.exists() {
            return bundled_path.to_string_lossy().to_string();
        }

        if let Some(path) = installed_entry_path.filter(|path| !path.trim().is_empty()) {
            return path;
        }
    }

    bundled_path.to_string_lossy().to_string()
}

fn bundled_buddy_sidecar_path(resource_dir: &Path, target_triple: &str, debug: bool) -> PathBuf {
    if debug {
        resource_dir
            .join("binaries")
            .join(format!("buddy-server-{target_triple}"))
    } else {
        resource_dir.join("buddy-server")
    }
}

fn default_installed_buddy_entry() -> Option<String> {
    std::env::var("BUDDY_ENTRY")
        .ok()
        .filter(|path| !path.trim().is_empty())
        .filter(|path| Path::new(path).is_file())
        .or_else(|| {
            let home = std::env::var("HOME").ok()?;
            let path = Path::new(&home)
                .join(".buddy")
                .join("server")
                .join("dist")
                .join("server")
                .join("index.js");
            path.is_file().then(|| path.to_string_lossy().to_string())
        })
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
                default_installed_buddy_entry(),
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
            ble::ble_respond_permission,
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
            Some("/tmp/ignored-index.js".to_string()),
        );

        assert_eq!(path, "/tmp/buddy-wrapper");
    }

    #[test]
    fn sidecar_path_uses_existing_tauri_resource_binary_by_default() {
        let temp_dir =
            std::env::temp_dir().join(format!("buddy-sidecar-test-{}", std::process::id()));
        let binary_dir = temp_dir.join("binaries");
        std::fs::create_dir_all(&binary_dir).unwrap();
        std::fs::File::create(binary_dir.join("buddy-server-aarch64-apple-darwin")).unwrap();

        let path = super::resolve_buddy_sidecar_path(
            &temp_dir,
            "aarch64-apple-darwin",
            true,
            None,
            Some("/home/user/.buddy/server/dist/server/index.js".to_string()),
        );

        assert_eq!(
            path,
            temp_dir
                .join("binaries/buddy-server-aarch64-apple-darwin")
                .to_string_lossy()
        );

        let _ = std::fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn debug_sidecar_path_falls_back_to_installed_buddy_entry_for_plain_cargo_run() {
        let path = super::resolve_buddy_sidecar_path(
            Path::new("/app/resources"),
            "aarch64-apple-darwin",
            true,
            None,
            Some("/home/user/.buddy/server/dist/server/index.js".to_string()),
        );

        assert_eq!(path, "/home/user/.buddy/server/dist/server/index.js");
    }

    #[test]
    fn release_sidecar_path_uses_packaged_resource() {
        let path = super::resolve_buddy_sidecar_path(
            Path::new("/app/resources"),
            "aarch64-apple-darwin",
            false,
            None,
            Some("/home/user/.buddy/server/dist/server/index.js".to_string()),
        );

        assert_eq!(path, "/app/resources/buddy-server");
    }
}
