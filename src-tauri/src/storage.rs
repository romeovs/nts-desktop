use std::fs;
use std::path::PathBuf;

use serde::de::DeserializeOwned;
use serde::Serialize;
use tauri::{AppHandle, Manager};

pub fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    #[cfg(target_os = "macos")]
    {
        let home = app.path().home_dir().map_err(|err| err.to_string())?;
        Ok(home.join("Library/Application Support/ntser"))
    }
    #[cfg(not(target_os = "macos"))]
    {
        app.path().app_data_dir().map_err(|err| err.to_string())
    }
}

fn file(app: &AppHandle, name: &str) -> Result<PathBuf, String> {
    let dir = data_dir(app)?;
    fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    Ok(dir.join(name))
}

pub fn read_json<T: DeserializeOwned>(
    app: &AppHandle,
    name: &str,
    fallback: T,
) -> Result<T, String> {
    let path = file(app, name)?;
    match fs::read_to_string(path) {
        Ok(content) => serde_json::from_str(&content).map_err(|err| err.to_string()),
        Err(_) => Ok(fallback),
    }
}

pub fn write_json<T: Serialize>(app: &AppHandle, name: &str, value: &T) -> Result<(), String> {
    let path = file(app, name)?;
    let content = serde_json::to_string(value).map_err(|err| err.to_string())?;
    fs::write(path, content).map_err(|err| err.to_string())
}

pub fn remove(app: &AppHandle, name: &str) -> Result<(), String> {
    let path = file(app, name)?;
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}
