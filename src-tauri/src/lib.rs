mod squircle;
mod store;
mod traydrop;
mod webloc;

use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::image::Image;
use tauri::menu::{Menu, MenuBuilder, MenuEvent, MenuItemBuilder, SubmenuBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, WebviewWindow, WindowEvent};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_opener::OpenerExt;

use store::{credentials, history, preferences, Credentials, Entry, Preferences};

const MENUBAR: &[u8] = include_bytes!("../../logos/menu.png");
const MENUBAR_ONE: &[u8] = include_bytes!("../../logos/menu-one.png");
const MENUBAR_TWO: &[u8] = include_bytes!("../../logos/menu-two.png");

/// Blur is ignored for this long after the window opens, so that showing it
/// does not immediately close it again.
const BLUR_GRACE: Duration = Duration::from_millis(300);

#[derive(Default)]
struct Opened(Mutex<Option<Instant>>);

const TRAY_ID: &str = "nts";
const WINDOW: &str = "main";

fn window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window(WINDOW)
}

fn tray(app: &AppHandle) -> Option<TrayIcon> {
    app.tray_by_id(TRAY_ID)
}

/// Menubar icons are supplied oversized. Scale them to the menubar height the
/// way the Electron app did, at 2x so they stay sharp on retina displays.
const MENUBAR_HEIGHT: u32 = 18;

fn icon(bytes: &[u8]) -> Image<'static> {
    let source = image::load_from_memory(bytes).expect("bad menubar icon");
    let height = MENUBAR_HEIGHT * 2;
    let width = (height as f32 * source.width() as f32 / source.height() as f32).round() as u32;
    let scaled = source
        .resize_exact(width, height, image::imageops::FilterType::Lanczos3)
        .to_rgba8();

    Image::new_owned(scaled.into_raw(), width, height)
}

/// set_icon drops the template flag, so it has to be set again every time.
fn set_tray_icon(tray: &TrayIcon, bytes: &[u8]) {
    let _ = tray.set_icon(Some(icon(bytes)));
    let _ = tray.set_icon_as_template(true);
}

// Window

fn is_open(app: &AppHandle) -> bool {
    window(app).and_then(|w| w.is_visible().ok()).unwrap_or(false)
}

fn show_window(app: &AppHandle) {
    let Some(window) = window(app) else { return };
    let _ = app.emit("open", ());

    if let (Some(tray), Ok(size)) = (tray(app), window.outer_size()) {
        if let Ok(Some(rect)) = tray.rect() {
            let position = rect.position.to_physical::<f64>(1.0);
            let bounds = rect.size.to_physical::<f64>(1.0);
            let x = position.x + bounds.width / 2.0 - size.width as f64 / 2.0;
            let y = position.y + bounds.height + 8.0;
            let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
        }
    }

    let _ = window.show();
    let _ = window.set_focus();

    if let Some(opened) = app.try_state::<Opened>() {
        *opened.0.lock().unwrap() = Some(Instant::now());
    }
}

fn hide_window(app: &AppHandle) {
    let _ = app.emit("close", ());
    if let Some(window) = window(app) {
        let _ = window.hide();
    }
    if let Some(opened) = app.try_state::<Opened>() {
        *opened.0.lock().unwrap() = None;
    }
}

/// Close on blur, but only once the window has been open past the grace
/// period. Matches the delayed one-shot blur handler the Electron app used.
fn handle_blur(app: &AppHandle) {
    let Some(opened) = app.try_state::<Opened>() else {
        return;
    };
    let since = *opened.0.lock().unwrap();
    let Some(since) = since else { return };
    if since.elapsed() < BLUR_GRACE {
        return;
    }
    if window(app).is_some_and(|window| window.is_devtools_open()) {
        return;
    }
    hide_window(app)
}

fn toggle(app: &AppHandle) {
    if is_open(app) {
        hide_window(app)
    } else {
        show_window(app)
    }
}

fn set_playing(app: &AppHandle, channel: Option<u8>) {
    let Some(tray) = tray(app) else { return };
    let bytes = match channel {
        Some(1) => MENUBAR_ONE,
        Some(2) => MENUBAR_TWO,
        _ => MENUBAR,
    };
    set_tray_icon(&tray, bytes);
}

// Archive shows

fn open_url(app: &AppHandle, url: &str) {
    if !url.starts_with("https://www.nts.live/shows/") {
        notify(app, "Please use a valid NTS show URL");
        return;
    }
    let _ = app.emit("open-url", url);
    show_window(app);
}

fn open_file(app: &AppHandle, path: &str) {
    if !path.ends_with(".webloc") {
        notify(app, "NTS Desktop can only open .webloc files");
        return;
    }
    match webloc::read(path) {
        Some(url) => open_url(app, &url),
        None => notify(app, "Could not read that .webloc file"),
    }
}

fn browse(app: &AppHandle) {
    let handle = app.clone();
    app.dialog()
        .file()
        .add_filter("links", &["webloc"])
        .set_title("Select a link to an archive show")
        .pick_file(move |path| {
            if let Some(path) = path {
                open_file(&handle, &path.to_string());
            }
        });
}

fn notify(app: &AppHandle, message: &str) {
    use tauri_plugin_notification::NotificationExt;
    let _ = app.notification().builder().body(message).show();
}

fn browse_to(app: &AppHandle, url: &str) {
    let _ = app.opener().open_url(url, None::<&str>);
}

// Menu

fn build_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let entries = history::read();

    let mut recent = SubmenuBuilder::new(app, "Recently Listened Archive Shows");
    for (index, entry) in entries.iter().enumerate() {
        recent = recent.item(
            &MenuItemBuilder::with_id(format!("history:{index}"), &entry.name).build(app)?,
        );
    }
    let recent = recent
        .separator()
        .item(
            &MenuItemBuilder::with_id("history:clear", "Clear")
                .enabled(!entries.is_empty())
                .build(app)?,
        )
        .build()?;

    let session = if credentials::has() {
        MenuItemBuilder::with_id("logout", "Log out").build(app)?
    } else {
        MenuItemBuilder::with_id("login", "Log in to get live tracks...").build(app)?
    };

    MenuBuilder::new(app)
        .item(&MenuItemBuilder::with_id("about", "About NTS Desktop").build(app)?)
        .item(
            &MenuItemBuilder::with_id("show", "Show NTS Desktop")
                .accelerator("Control+N")
                .build(app)?,
        )
        .separator()
        .item(&MenuItemBuilder::with_id("schedule", "Open Schedule...").build(app)?)
        .item(&MenuItemBuilder::with_id("favourites", "Open Favourites...").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("browse", "Load Archive Show...").build(app)?)
        .item(&recent)
        .separator()
        .item(&session)
        .separator()
        .item(&MenuItemBuilder::with_id("devtools", "Developer Tools").build(app)?)
        .item(&MenuItemBuilder::with_id("reload", "Reload NTS Desktop").build(app)?)
        .quit()
        .build()
}

fn refresh_menu(app: &AppHandle) {
    if let (Some(tray), Ok(menu)) = (tray(app), build_menu(app)) {
        let _ = tray.set_menu(Some(menu));
    }
}

fn handle_menu(app: &AppHandle, event: MenuEvent) {
    let id = event.id().0.as_str();

    if let Some(index) = id.strip_prefix("history:") {
        if index == "clear" {
            history::clear();
            refresh_menu(app);
            return;
        }
        if let Some(entry) = index.parse::<usize>().ok().and_then(|i| history::read().into_iter().nth(i)) {
            open_url(app, &entry.url);
        }
        return;
    }

    match id {
        "about" => browse_to(app, "https://github.com/romeovs/nts-desktop"),
        "show" => show_window(app),
        "schedule" => browse_to(app, "https://www.nts.live/schedule"),
        "favourites" => browse_to(app, "https://www.nts.live/my-nts/favourites/shows"),
        "browse" => browse(app),
        "login" => {
            let _ = app.emit("login", ());
            show_window(app);
        }
        "logout" => {
            credentials::clear();
            let _ = app.emit("logout", ());
            refresh_menu(app);
        }
        "devtools" => {
            if let Some(window) = window(app) {
                if window.is_devtools_open() {
                    window.close_devtools()
                } else {
                    show_window(app);
                    window.open_devtools()
                }
            }
        }
        "reload" => {
            if let Some(window) = window(app) {
                let _ = window.eval("window.location.reload()");
            }
        }
        _ => {}
    }
}

// Commands, called from the client over invoke

#[tauri::command]
fn close(app: AppHandle) {
    hide_window(&app)
}

#[tauri::command]
fn playing(app: AppHandle, payload: Option<serde_json::Value>) {
    let channel = payload.and_then(|v| v.as_u64()).map(|c| c as u8);
    set_playing(&app, channel)
}

#[tauri::command]
fn tracklist(app: AppHandle, payload: serde_json::Value) {
    let channel = payload.as_u64().unwrap_or(1);
    browse_to(
        &app,
        &format!("https://www.nts.live/live-tracklist/{channel}"),
    )
}

#[tauri::command]
fn chat(app: AppHandle, payload: serde_json::Value) {
    let url = if payload.as_u64() == Some(1) {
        "https://discord.com/channels/909834111592591421/933364043459227708"
    } else {
        "https://discord.com/channels/909834111592591421/935528991501209600"
    };
    browse_to(&app, url)
}

#[tauri::command]
fn my_nts(app: AppHandle) {
    browse_to(&app, "https://www.nts.live/my-nts/favourites/shows")
}

#[tauri::command]
fn explore(app: AppHandle) {
    browse_to(&app, "https://www.nts.live/explore")
}

#[tauri::command]
fn set_preferences(payload: Preferences) {
    preferences::write(&payload)
}

#[tauri::command]
fn store_credentials(app: AppHandle, payload: Credentials) {
    credentials::write(&payload);
    refresh_menu(&app)
}

#[tauri::command]
fn add_history(app: AppHandle, payload: Entry) {
    history::add(payload);
    refresh_menu(&app)
}

#[tauri::command]
fn init(app: AppHandle) {
    let _ = app.emit("preferences", preferences::read());
    let _ = app.emit("credentials", credentials::read());
}

pub fn run() {
    let shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyN);

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            close,
            playing,
            tracklist,
            chat,
            my_nts,
            explore,
            set_preferences,
            store_credentials,
            add_history,
            init
        ])
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        toggle(app);
                    }
                })
                .build(),
        )
        .manage(Opened::default())
        .setup(move |app| {
            let handle = app.handle().clone();

            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            TrayIconBuilder::with_id(TRAY_ID)
                .icon(icon(MENUBAR))
                .icon_as_template(true)
                .show_menu_on_left_click(false)
                .menu(&build_menu(&handle)?)
                .on_tray_icon_event(|tray, event| {
                    let app = tray.app_handle();
                    if let TrayIconEvent::Click {
                        button,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        match button {
                            MouseButton::Left => toggle(app),
                            MouseButton::Right => hide_window(app),
                            _ => {}
                        }
                    }
                })
                .on_menu_event(handle_menu)
                .build(app)?;

            app.global_shortcut().register(shortcut)?;
            traydrop::install(&handle, open_file, open_url);

            if let Some(window) = window(&handle) {
                squircle::apply(&window);

                let closer = handle.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::Focused(false) = event {
                        handle_blur(&closer);
                    }
                });
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building NTS Desktop")
        .run(|app, event| {
            if let tauri::RunEvent::Opened { urls } = event {
                for url in urls {
                    match url.scheme() {
                        "file" => {
                            if let Ok(path) = url.to_file_path() {
                                open_file(app, &path.to_string_lossy());
                            }
                        }
                        _ => open_url(app, url.as_str()),
                    }
                }
            }
        });
}
