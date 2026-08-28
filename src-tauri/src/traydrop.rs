//! Drag and drop onto the menubar icon.
//!
//! Neither tauri nor the tray-icon crate exposes the NSStatusItem, so the
//! button is found by walking the status bar window. AppKit looks up the view
//! hierarchy for a registered drag destination, so registering the button
//! leaves tao's own click handling untouched.

use std::sync::OnceLock;

use objc2::rc::Retained;
use objc2::runtime::{AnyClass, AnyObject, Bool, ClassBuilder, Sel};
use objc2::{msg_send, sel, Message};
use objc2_app_kit::{NSApplication, NSView};
use objc2_foundation::{MainThreadMarker, NSArray, NSString};
use tauri::AppHandle;

static APP: OnceLock<AppHandle> = OnceLock::new();

const NONE: usize = 0;
const COPY: usize = 1;

const FILE_URL: &str = "public.file-url";
const PLAIN_TEXT: &str = "public.utf8-plain-text";

type Handler = fn(&AppHandle, &str);
static ON_FILE: OnceLock<Handler> = OnceLock::new();
static ON_URL: OnceLock<Handler> = OnceLock::new();

pub fn install(app: &AppHandle, on_file: Handler, on_url: Handler) {
    let Some(mtm) = MainThreadMarker::new() else {
        return;
    };
    let _ = APP.set(app.clone());
    let _ = ON_FILE.set(on_file);
    let _ = ON_URL.set(on_url);

    let Some(button) = find_status_button(mtm) else {
        return;
    };

    unsafe {
        let types = NSArray::from_retained_slice(&[
            NSString::from_str(FILE_URL),
            NSString::from_str(PLAIN_TEXT),
        ]);
        let _: () = msg_send![&*button, registerForDraggedTypes: &*types];

        if let Some(class) = drop_class(button.class()) {
            objc2::ffi::object_setClass(
                Retained::as_ptr(&button) as *mut AnyObject as *mut _,
                class as *const AnyClass as *mut _,
            );
        }
    }
}

fn find_status_button(mtm: MainThreadMarker) -> Option<Retained<NSView>> {
    let app = NSApplication::sharedApplication(mtm);
    for window in app.windows().iter() {
        if window.class().name().to_bytes() != b"NSStatusBarWindow" {
            continue;
        }
        if let Some(view) = window.contentView() {
            if let Some(found) = find_button(&view) {
                return Some(found);
            }
        }
    }
    None
}

fn find_button(view: &NSView) -> Option<Retained<NSView>> {
    if view.class().name().to_bytes() == b"NSStatusBarButton" {
        return Some(view.retain());
    }
    for sub in view.subviews().iter() {
        if let Some(found) = find_button(&sub) {
            return Some(found);
        }
    }
    None
}

/// Subclass the button so only our instance gains the drag methods.
fn drop_class(superclass: &AnyClass) -> Option<&'static AnyClass> {
    static CLASS: OnceLock<usize> = OnceLock::new();

    if let Some(ptr) = CLASS.get() {
        return Some(unsafe { &*(*ptr as *const AnyClass) });
    }

    let mut builder = ClassBuilder::new(c"NTSDropButton", superclass)?;
    unsafe {
        builder.add_method(
            sel!(draggingEntered:),
            dragging_entered as extern "C" fn(_, _, _) -> _,
        );
        builder.add_method(
            sel!(prepareForDragOperation:),
            prepare_for_drag as extern "C" fn(_, _, _) -> _,
        );
        builder.add_method(
            sel!(performDragOperation:),
            perform_drag as extern "C" fn(_, _, _) -> _,
        );
    }
    let class = builder.register();
    let _ = CLASS.set(class as *const AnyClass as usize);
    Some(class)
}

extern "C" fn dragging_entered(_this: &AnyObject, _cmd: Sel, _sender: *mut AnyObject) -> usize {
    if read_drop(_sender).is_some() {
        COPY
    } else {
        NONE
    }
}

extern "C" fn prepare_for_drag(_this: &AnyObject, _cmd: Sel, _sender: *mut AnyObject) -> Bool {
    Bool::YES
}

extern "C" fn perform_drag(_this: &AnyObject, _cmd: Sel, sender: *mut AnyObject) -> Bool {
    let Some(drop) = read_drop(sender) else {
        return Bool::NO;
    };
    let Some(app) = APP.get() else {
        return Bool::NO;
    };

    match drop {
        Drop::File(path) => {
            if let Some(handler) = ON_FILE.get() {
                handler(app, &path)
            }
        }
        Drop::Url(url) => {
            if let Some(handler) = ON_URL.get() {
                handler(app, &url)
            }
        }
    }
    Bool::YES
}

enum Drop {
    File(String),
    Url(String),
}

/// Read a file path or a plain string off the drag pasteboard.
fn read_drop(sender: *mut AnyObject) -> Option<Drop> {
    if sender.is_null() {
        return None;
    }

    unsafe {
        let pasteboard: *mut AnyObject = msg_send![&*sender, draggingPasteboard];
        if pasteboard.is_null() {
            return None;
        }

        let file_type = NSString::from_str(FILE_URL);
        let file: *mut NSString = msg_send![&*pasteboard, stringForType: &*file_type];
        if !file.is_null() {
            let value = (*file).to_string();
            if let Some(path) = value.strip_prefix("file://") {
                let decoded = percent_decode(path);
                return Some(Drop::File(decoded));
            }
            return Some(Drop::File(value));
        }

        let text_type = NSString::from_str(PLAIN_TEXT);
        let text: *mut NSString = msg_send![&*pasteboard, stringForType: &*text_type];
        if !text.is_null() {
            return Some(Drop::Url((*text).to_string().trim().to_string()));
        }
    }

    None
}

fn percent_decode(value: &str) -> String {
    let bytes = value.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index] == b'%' && index + 2 < bytes.len() {
            if let Ok(byte) = u8::from_str_radix(&value[index + 1..index + 3], 16) {
                out.push(byte);
                index += 3;
                continue;
            }
        }
        out.push(bytes[index]);
        index += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}
