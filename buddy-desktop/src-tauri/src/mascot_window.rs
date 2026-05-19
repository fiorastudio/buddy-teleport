use tauri::{AppHandle, Manager, WebviewWindowBuilder, WebviewUrl};

/// Spawn the floating buddy mascot window.
/// On macOS: uses NSPanel + WKWebView for a transparent always-on-top panel.
/// On other platforms: uses a standard Tauri window with frameless + transparent + alwaysOnTop.
pub fn create_mascot_window(app: &AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        create_mascot_window_macos(app)
    }
    #[cfg(not(target_os = "macos"))]
    {
        create_mascot_window_crossplatform(app)
    }
}

#[cfg(not(target_os = "macos"))]
fn create_mascot_window_crossplatform(app: &AppHandle) -> Result<(), String> {
    WebviewWindowBuilder::new(app, "mascot", WebviewUrl::App("index.html?window=mascot&companion=buddy".into()))
        .title("buddy")
        .inner_size(240.0, 400.0)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(target_os = "macos")]
fn create_mascot_window_macos(app: &AppHandle) -> Result<(), String> {
    use objc2_app_kit::{NSPanel, NSWindowStyleMask, NSWindowCollectionBehavior, NSBackingStoreType, NSColor, NSScreen, NSWindowLevel, NSFloatingWindowLevel};
    use objc2_foundation::{NSRect, NSPoint, NSSize, NSString, NSURL, NSURLRequest};
    use objc2_web_kit::{WKWebView, WKWebViewConfiguration};
    use objc2::rc::Retained;
    use objc2::ClassType;

    // Determine the URL to load
    let url_string = if cfg!(debug_assertions) {
        "http://localhost:1420/?window=mascot&companion=buddy".to_string()
    } else {
        // In prod, use the crossplatform window for simplicity for now
        return create_mascot_window_crossplatform(app);
    };

    unsafe {
        // Get screen dimensions for initial position (bottom-right)
        let screen_frame = NSScreen::mainScreen()
            .map(|s| s.frame())
            .unwrap_or(NSRect::new(NSPoint::new(0.0, 0.0), NSSize::new(1440.0, 900.0)));

        let width = 240.0_f64;
        let height = 400.0_f64;
        let x = screen_frame.size.width - width - 20.0;
        let y = 60.0;

        let frame = NSRect::new(NSPoint::new(x, y), NSSize::new(width, height));

        // NSPanel: floating window that doesn't steal focus
        let style_mask = NSWindowStyleMask::Titled
            | NSWindowStyleMask::Closable
            | NSWindowStyleMask::FullSizeContentView;

        let panel = NSPanel::alloc();
        let panel = NSPanel::initWithContentRect_styleMask_backing_defer(
            panel,
            frame,
            style_mask,
            NSBackingStoreType::NSBackingStoreBuffered,
            false,
        );

        panel.setTitlebarAppearsTransparent(true);
        panel.setMovableByWindowBackground(true);
        panel.setBackgroundColor(&NSColor::clearColor());
        panel.setOpaque(false);
        panel.setHasShadow(false);
        panel.setLevel(NSWindowLevel(NSFloatingWindowLevel.0 + 1));
        panel.setCollectionBehavior(
            NSWindowCollectionBehavior::CanJoinAllSpaces
                | NSWindowCollectionBehavior::Stationary
        );

        // WKWebView filling the panel
        let config = WKWebViewConfiguration::new();
        let webview = WKWebView::initWithFrame_configuration(
            WKWebView::alloc(),
            frame,
            &config,
        );
        webview.setOpaque(false);
        webview.setBackgroundColor(&NSColor::clearColor());

        let ns_url = NSURL::URLWithString(&NSString::from_str(&url_string)).ok_or("invalid URL")?;
        let request = NSURLRequest::requestWithURL(&ns_url);
        webview.loadRequest(&request);

        panel.setContentView(Some(&*webview));
        panel.makeKeyAndOrderFront(None);

        // Store reference so it isn't dropped
        app.manage(PanelHolder { _panel: panel, _webview: webview });
    }
    Ok(())
}

#[cfg(target_os = "macos")]
struct PanelHolder {
    _panel: Retained<objc2_app_kit::NSPanel>,
    _webview: Retained<objc2_web_kit::WKWebView>,
}

#[cfg(target_os = "macos")]
unsafe impl Send for PanelHolder {}
#[cfg(target_os = "macos")]
unsafe impl Sync for PanelHolder {}
