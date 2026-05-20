use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager};

pub const QUIT_MENU_ID: &str = "quit";
pub const STATUS_POPUP_WINDOW_LABEL: &str = "status-popup";

pub fn setup_tray(app: &AppHandle) -> Result<(), tauri::Error> {
    let quit_i = MenuItem::with_id(app, QUIT_MENU_ID, "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&quit_i])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(move |app, event| {
            if should_quit_for_menu_id(event.id.as_ref()) {
                app.exit(0);
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::Click { .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window(STATUS_POPUP_WINDOW_LABEL) {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

pub fn should_quit_for_menu_id(menu_id: &str) -> bool {
    menu_id == QUIT_MENU_ID
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tray_click_targets_configured_status_popup_window() {
        assert_eq!(STATUS_POPUP_WINDOW_LABEL, "status-popup");
    }

    #[test]
    fn quit_menu_id_is_the_only_quit_trigger() {
        assert!(should_quit_for_menu_id("quit"));
        assert!(!should_quit_for_menu_id("status-popup"));
        assert!(!should_quit_for_menu_id(""));
    }
}
