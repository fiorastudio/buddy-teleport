use tauri::{AppHandle, WebviewUrl, WebviewWindowBuilder};

/// Spawn the floating buddy mascot window.
pub fn create_mascot_window(app: &AppHandle) -> Result<(), String> {
    create_mascot_window_crossplatform(app)
}

fn create_mascot_window_crossplatform(app: &AppHandle) -> Result<(), String> {
    WebviewWindowBuilder::new(
        app,
        "mascot",
        WebviewUrl::App("index.html?window=mascot&companion=buddy".into()),
    )
    .title("buddy")
    .inner_size(240.0, 400.0)
    .build()
    .map_err(|e| e.to_string())?;
    Ok(())
}
