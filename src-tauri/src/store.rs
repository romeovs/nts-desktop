use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

/// The Electron userData directory. Kept so preferences and history survive
/// the port.
fn data_dir() -> PathBuf {
    dirs::data_dir()
        .expect("no data directory")
        .join("nts-desktop")
}

fn read_json<T: for<'a> Deserialize<'a>>(name: &str) -> Option<T> {
    let content = fs::read_to_string(data_dir().join(name)).ok()?;
    serde_json::from_str(&content).ok()
}

fn write_json<T: Serialize>(name: &str, value: &T) {
    let dir = data_dir();
    if fs::create_dir_all(&dir).is_err() {
        return;
    }
    if let Ok(content) = serde_json::to_string(value) {
        let _ = fs::write(dir.join(name), content);
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Preferences {
    pub volume: f64,
}

impl Default for Preferences {
    fn default() -> Self {
        Self { volume: 0.8 }
    }
}

pub mod preferences {
    use super::{read_json, write_json, Preferences};

    pub fn read() -> Preferences {
        read_json("preferences.json").unwrap_or_default()
    }

    pub fn write(preferences: &Preferences) {
        write_json("preferences.json", preferences)
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Entry {
    pub name: String,
    pub url: String,
}

pub mod history {
    use super::{data_dir, read_json, write_json, Entry};

    pub fn read() -> Vec<Entry> {
        read_json("history.json").unwrap_or_default()
    }

    pub fn add(entry: Entry) {
        let mut history = read();
        history.insert(0, entry);

        let mut seen: Vec<String> = Vec::new();
        history.retain(|entry| {
            if seen.contains(&entry.url) {
                return false;
            }
            seen.push(entry.url.clone());
            true
        });

        write_json("history.json", &history)
    }

    pub fn clear() {
        let _ = std::fs::remove_file(data_dir().join("history.json"));
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Credentials {
    pub email: String,
    pub password: String,
}

pub mod credentials {
    use super::Credentials;

    const SERVICE: &str = "nts-desktop";
    const USER: &str = "credentials";

    fn entry() -> Option<keyring::Entry> {
        keyring::Entry::new(SERVICE, USER).ok()
    }

    pub fn read() -> Option<Credentials> {
        let content = entry()?.get_password().ok()?;
        serde_json::from_str(&content).ok()
    }

    pub fn write(credentials: &Credentials) {
        let Some(entry) = entry() else { return };
        if let Ok(content) = serde_json::to_string(credentials) {
            let _ = entry.set_password(&content);
        }
    }

    pub fn clear() {
        if let Some(entry) = entry() {
            let _ = entry.delete_credential();
        }
    }

    pub fn has() -> bool {
        read().is_some()
    }
}
