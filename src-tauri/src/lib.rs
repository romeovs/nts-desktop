mod credentials;
mod reminders;
mod storage;
mod webloc;

use std::sync::Mutex;
use std::thread;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tauri::image::Image;
use tauri::menu::{Menu, MenuBuilder, MenuEvent, SubmenuBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, RunEvent, WebviewWindow, WindowEvent};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_opener::OpenerExt;

use reminders::{Reminder, Reminders};

const TRAY_ID: &str = "main";
const ICON_IDLE: &[u8] = include_bytes!("../../logos/menu.png");
const ICON_ONE: &[u8] = include_bytes!("../../logos/menu-one.png");
const ICON_TWO: &[u8] = include_bytes!("../../logos/menu-two.png");

#[derive(Clone, Serialize, Deserialize)]
struct Preferences {
    volume: f64,
}

impl Default for Preferences {
    fn default() -> Self {
        Self { volume: 0.8 }
    }
}

#[derive(Clone, Serialize, Deserialize)]
struct HistoryEntry {
    name: String,
    url: String,
}

#[derive(Clone, Copy)]
struct TrayPos {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

struct LastTray(Mutex<Option<TrayPos>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = dotenvy::from_filename("../.env");
    let _ = dotenvy::from_filename(".env");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(Mutex::new(Reminders::default()))
        .manage(LastTray(Mutex::new(None)))
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let handle = app.handle().clone();
            app.state::<Mutex<Reminders>>()
                .lock()
                .map_err(|err| err.to_string())?
                .restore(&handle)?;

            build_tray(app.handle())?;
            if let Some(window) = app.get_webview_window("main") {
                let window_for_events = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::Focused(false) = event {
                        let window = window_for_events.clone();
                        thread::spawn(move || {
                            thread::sleep(Duration::from_millis(300));
                            if window.is_focused().unwrap_or(true) {
                                return;
                            }
                            let _ = window.emit("close", ());
                            thread::sleep(Duration::from_millis(10));
                            let _ = window.hide();
                        });
                    }
                });
            }

            app.global_shortcut()
                .on_shortcut("Control+N", |app, _, event| {
                    if event.state == ShortcutState::Pressed {
                        toggle_window(app);
                    }
                })?;

            if let Ok(url) = std::env::var("NTS_OPEN_SHOW") {
                let handle = app.handle().clone();
                thread::spawn(move || {
                    thread::sleep(Duration::from_millis(800));
                    open_show_url(&handle, &url);
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            init,
            hide_window,
            set_playing,
            write_preferences,
            open_link,
            history_add,
            remind,
            reminders_list,
            version,
            credentials_read,
            credentials_write,
            credentials_clear,
        ])
        .build(tauri::generate_context!())
        .expect("failed to start NTSer")
        .run(|app, event| {
            #[cfg(any(target_os = "macos", target_os = "ios"))]
            if let RunEvent::Opened { urls } = &event {
                for url in urls {
                    match webloc::url_from_opened(url.as_str()) {
                        Ok(show) => open_show_url(app, &show),
                        Err(err) => notify_error(app, &err),
                    }
                }
            }
            let _ = event;
        });
}

#[tauri::command]
fn init(app: AppHandle) -> Result<Preferences, String> {
    storage::read_json(&app, "preferences.json", Preferences::default())
}

#[tauri::command]
fn hide_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit("close", ());
        thread::sleep(Duration::from_millis(10));
        window.hide().map_err(|err| err.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn set_playing(app: AppHandle, channel: Option<serde_json::Value>) -> Result<(), String> {
    let bytes = match channel {
        Some(serde_json::Value::Number(n)) if n.as_u64() == Some(1) => ICON_ONE,
        Some(serde_json::Value::Number(n)) if n.as_u64() == Some(2) => ICON_TWO,
        _ => ICON_IDLE,
    };
    let icon = Image::from_bytes(bytes).map_err(|err| err.to_string())?;
    let tray = app
        .tray_by_id(TRAY_ID)
        .ok_or_else(|| "tray is missing".to_string())?;
    tray.set_icon_with_as_template(Some(icon), true)
        .map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
fn write_preferences(app: AppHandle, preferences: Preferences) -> Result<(), String> {
    storage::write_json(&app, "preferences.json", &preferences)
}

#[tauri::command]
fn open_link(app: AppHandle, url: String) -> Result<(), String> {
    if !(url.starts_with("https://") || url.starts_with("music://")) {
        return Err("blocked URL".into());
    }
    app.opener()
        .open_url(&url, None::<&str>)
        .map_err(|err| err.to_string())
}

#[tauri::command]
fn history_add(app: AppHandle, name: String, url: String) -> Result<(), String> {
    let mut history: Vec<HistoryEntry> = storage::read_json(&app, "history.json", Vec::new())?;
    history.insert(
        0,
        HistoryEntry {
            name,
            url: url.clone(),
        },
    );
    history.dedup_by(|a, b| a.url == b.url);
    storage::write_json(&app, "history.json", &history)?;
    rebuild_menu(&app)?;
    Ok(())
}

#[tauri::command]
fn remind(app: AppHandle, reminder: Reminder) -> Result<bool, String> {
    app.state::<Mutex<Reminders>>()
        .lock()
        .map_err(|err| err.to_string())?
        .toggle(&app, reminder)
}

#[tauri::command]
fn reminders_list(app: AppHandle) -> Result<Vec<String>, String> {
    Ok(app
        .state::<Mutex<Reminders>>()
        .lock()
        .map_err(|err| err.to_string())?
        .list())
}

#[tauri::command]
fn version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
fn credentials_read() -> Result<Option<credentials::Credentials>, String> {
    credentials::read()
}

#[tauri::command]
fn credentials_write(app: AppHandle, credentials: credentials::Credentials) -> Result<(), String> {
    credentials::write(&credentials)?;
    rebuild_menu(&app)
}

#[tauri::command]
fn credentials_clear(app: AppHandle) -> Result<(), String> {
    credentials::clear()?;
    rebuild_menu(&app)
}

fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let icon = Image::from_bytes(ICON_IDLE)?;
    let menu = make_menu(app)?;
    let handle = app.clone();
    TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .icon_as_template(true)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| on_menu(app, event))
        .on_tray_icon_event(move |tray, event| {
            on_tray(&handle, tray.app_handle(), event);
        })
        .build(app)?;
    Ok(())
}

fn on_tray(app: &AppHandle, _tray_app: &AppHandle, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        button,
        button_state,
        rect,
        ..
    } = event
    {
        if button_state != MouseButtonState::Up {
            return;
        }
        if let Ok(mut last) = app.state::<LastTray>().0.lock() {
            let scale = app
                .get_webview_window("main")
                .and_then(|window| window.scale_factor().ok())
                .unwrap_or(1.0);
            let pos = rect.position.to_physical::<f64>(scale);
            let size = rect.size.to_physical::<f64>(scale);
            *last = Some(TrayPos {
                x: pos.x,
                y: pos.y,
                width: size.width,
                height: size.height,
            });
        }
        if button == MouseButton::Left {
            toggle_window(app);
        }
    }
}

fn on_menu(app: &AppHandle, event: MenuEvent) {
    let id = event.id().as_ref();
    if let Some(url) = id.strip_prefix("history:") {
        open_show_url(app, url);
        return;
    }

    match id {
        "about" => {
            let _ = app.emit("about", ());
            show_window(app);
        }
        "show" => show_window(app),
        "load-show" => load_show(app),
        "clear-history" => {
            let _ = storage::remove(app, "history.json");
            let _ = rebuild_menu(app);
        }
        "login" => {
            let _ = app.emit("login", ());
            show_window(app);
        }
        "logout" => {
            let _ = credentials::clear();
            let _ = app.emit("logout", ());
            let _ = rebuild_menu(app);
        }
        "reload" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.eval("window.location.reload()");
            }
        }
        "quit" => app.exit(0),
        _ => {}
    }
}

fn rebuild_menu(app: &AppHandle) -> Result<(), String> {
    let menu = make_menu(app).map_err(|err| err.to_string())?;
    app.tray_by_id(TRAY_ID)
        .ok_or_else(|| "tray is missing".to_string())?
        .set_menu(Some(menu))
        .map_err(|err| err.to_string())
}

fn make_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let history: Vec<HistoryEntry> =
        storage::read_json(app, "history.json", Vec::new()).unwrap_or_default();

    let mut recent = SubmenuBuilder::new(app, "Recently Listened Archive Shows");
    for entry in &history {
        recent = recent.text(format!("history:{}", entry.url), &entry.name);
    }
    let recent = recent.separator().text("clear-history", "Clear").build()?;

    let mut menu = MenuBuilder::new(app)
        .text("about", "About NTSer")
        .text("show", "Show NTSer")
        .separator()
        .text("load-show", "Load Archive Show...")
        .item(&recent)
        .separator();

    menu = if credentials::has() {
        menu.text("logout", "Log out")
    } else {
        menu.text("login", "Log in to get live tracks...")
    };

    menu.separator()
        .text("reload", "Reload NTSer")
        .text("quit", "Quit NTSer")
        .build()
}

fn toggle_window(app: &AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    if window.is_visible().unwrap_or(false) {
        let _ = window.emit("close", ());
        thread::sleep(Duration::from_millis(10));
        let _ = window.hide();
    } else {
        show_window(app);
    }
}

fn show_window(app: &AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    position_window(&window, app);
    let _ = window.emit("open", ());
    let _ = window.show();
    let _ = window.set_focus();
}

fn position_window(window: &WebviewWindow, app: &AppHandle) {
    let Ok(size) = window.outer_size() else {
        return;
    };
    let Some(pos) = app
        .state::<LastTray>()
        .0
        .lock()
        .ok()
        .and_then(|guard| *guard)
    else {
        return;
    };

    let x = pos.x + pos.width / 2.0 - f64::from(size.width) / 2.0;
    let y = pos.y + pos.height + 8.0;
    let _ = window.set_position(PhysicalPosition::new(x.round() as i32, y.round() as i32));
}

fn load_show(app: &AppHandle) {
    let pasted = app.clipboard().read_text().unwrap_or_default();
    let trimmed = pasted.trim();
    let suggestion = if trimmed.starts_with("https://www.nts.live/shows/") {
        trimmed
    } else {
        ""
    };
    let _ = app.emit("load-show", suggestion);
    show_window(app);
}

fn open_show_url(app: &AppHandle, url: &str) {
    if !url.starts_with("https://www.nts.live/shows/") {
        notify_error(app, "Please use a valid NTS show URL");
        return;
    }
    let _ = app.emit("open-show-url", url);
    show_window(app);
}

fn notify_error(app: &AppHandle, message: &str) {
    let _ = app.notification().builder().body(message).show();
}
