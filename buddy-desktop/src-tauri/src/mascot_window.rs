use tauri::{AppHandle, WebviewUrl, WebviewWindowBuilder};

pub const MASCOT_WINDOW_LABEL: &str = "mascot";
pub const MASCOT_WINDOW_URL: &str = "index.html?window=mascot&companion=buddy";
pub const MASCOT_WINDOW_TITLE: &str = "buddy";
pub const MASCOT_WINDOW_WIDTH: f64 = 240.0;
pub const MASCOT_WINDOW_HEIGHT: f64 = 400.0;

/// Spawn the floating buddy mascot window.
pub fn create_mascot_window(app: &AppHandle) -> Result<(), String> {
    create_mascot_window_crossplatform(app)
}

fn create_mascot_window_crossplatform(app: &AppHandle) -> Result<(), String> {
    WebviewWindowBuilder::new(
        app,
        MASCOT_WINDOW_LABEL,
        WebviewUrl::App(MASCOT_WINDOW_URL.into()),
    )
    .title(MASCOT_WINDOW_TITLE)
    .inner_size(MASCOT_WINDOW_WIDTH, MASCOT_WINDOW_HEIGHT)
    .build()
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mascot_window_uses_dedicated_label_and_route() {
        assert_eq!(MASCOT_WINDOW_LABEL, "mascot");
        assert_ne!(MASCOT_WINDOW_LABEL, crate::tray::STATUS_POPUP_WINDOW_LABEL);
        assert!(MASCOT_WINDOW_URL.contains("window=mascot"));
        assert!(MASCOT_WINDOW_URL.contains("companion=buddy"));
    }

    #[test]
    fn mascot_window_dimensions_are_stable() {
        assert_eq!(MASCOT_WINDOW_TITLE, "buddy");
        assert_eq!(MASCOT_WINDOW_WIDTH, 240.0);
        assert_eq!(MASCOT_WINDOW_HEIGHT, 400.0);
    }
}
