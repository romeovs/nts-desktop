//! macOS draws its own window corners as a continuous curve, the squircle,
//! rather than a circular arc. CSS cannot express that on the WebKit versions
//! this app supports, so the corner is applied to the window layer instead.

use objc2::msg_send;
use objc2_app_kit::NSWindow;
use objc2_foundation::NSString;
use tauri::WebviewWindow;

const CORNER_RADIUS: f64 = 10.0;

pub fn apply(window: &WebviewWindow) {
    let Ok(handle) = window.ns_window() else {
        return;
    };

    unsafe {
        let ns_window = &*(handle as *const NSWindow);
        let Some(view) = ns_window.contentView() else {
            return;
        };

        view.setWantsLayer(true);
        let Some(layer) = view.layer() else {
            return;
        };

        layer.setCornerRadius(CORNER_RADIUS);
        layer.setMasksToBounds(true);

        // kCACornerCurveContinuous. Not exposed by the bindings, and the
        // typedef is a plain string.
        let continuous = NSString::from_str("continuous");
        let _: () = msg_send![&*layer, setCornerCurve: &*continuous];
    }
}
