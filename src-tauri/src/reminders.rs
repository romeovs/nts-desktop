use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

use chrono::DateTime;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::storage;

const FILE: &str = "reminders.json";
const LIMIT_MS: i64 = 2_147_483_647;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reminder {
    pub channel: u8,
    pub name: String,
    pub starts: String,
}

pub struct Reminders {
    pending: HashMap<String, Reminder>,
    cancels: HashMap<String, Arc<AtomicBool>>,
}

impl Default for Reminders {
    fn default() -> Self {
        Self {
            pending: HashMap::new(),
            cancels: HashMap::new(),
        }
    }
}

fn key(reminder: &Reminder) -> String {
    format!("{}:{}", reminder.channel, reminder.starts)
}

fn delay_ms(reminder: &Reminder) -> Result<i64, String> {
    let start = DateTime::parse_from_rfc3339(&reminder.starts).map_err(|err| err.to_string())?;
    Ok(start.timestamp_millis() - chrono::Utc::now().timestamp_millis())
}

impl Reminders {
    pub fn list(&self) -> Vec<String> {
        self.pending.keys().cloned().collect()
    }

    pub fn restore(&mut self, app: &AppHandle) -> Result<(), String> {
        let stored: Vec<Reminder> = storage::read_json(app, FILE, Vec::new())?;
        for reminder in stored {
            self.arm(app, reminder);
        }
        self.save(app)
    }

    pub fn toggle(&mut self, app: &AppHandle, reminder: Reminder) -> Result<bool, String> {
        let id = key(&reminder);
        if self.pending.contains_key(&id) {
            self.cancel(&id);
            self.save(app)?;
            return Ok(false);
        }

        let delay = delay_ms(&reminder)?;
        if delay <= 0 {
            return Err("that show has already started".into());
        }
        if delay > LIMIT_MS {
            return Err("that show is too far off".into());
        }

        self.arm(app, reminder);
        self.save(app)?;
        Ok(true)
    }

    fn arm(&mut self, app: &AppHandle, reminder: Reminder) -> bool {
        let Ok(delay) = delay_ms(&reminder) else {
            return false;
        };
        if delay <= 0 || delay > LIMIT_MS {
            return false;
        }

        let id = key(&reminder);
        self.cancel(&id);
        self.pending.insert(id.clone(), reminder.clone());

        let cancel = Arc::new(AtomicBool::new(false));
        self.cancels.insert(id.clone(), cancel.clone());
        let app = app.clone();
        thread::spawn(move || {
            thread::sleep(Duration::from_millis(delay as u64));
            if cancel.load(Ordering::SeqCst) {
                return;
            }
            fire(&app, reminder);
        });
        true
    }

    fn cancel(&mut self, id: &str) {
        self.pending.remove(id);
        if let Some(flag) = self.cancels.remove(id) {
            flag.store(true, Ordering::SeqCst);
        }
    }

    fn save(&self, app: &AppHandle) -> Result<(), String> {
        let values: Vec<Reminder> = self.pending.values().cloned().collect();
        storage::write_json(app, FILE, &values)
    }
}

fn fire(app: &AppHandle, reminder: Reminder) {
    let id = key(&reminder);
    let list = {
        let Some(state) = app.try_state::<std::sync::Mutex<Reminders>>() else {
            return;
        };
        let Ok(mut reminders) = state.lock() else {
            return;
        };
        reminders.pending.remove(&id);
        reminders.cancels.remove(&id);
        let _ = reminders.save(app);
        reminders.list()
    };

    let _ = app.emit("reminders", list);
    let _ = app
        .notification()
        .builder()
        .title(format!("NTS {} is on", reminder.channel))
        .body(&reminder.name)
        .show();
}
