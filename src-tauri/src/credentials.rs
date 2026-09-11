use serde::{Deserialize, Serialize};

const SERVICE: &str = "org.observepeople.ntser";
const ACCOUNT: &str = "nts-login";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Credentials {
    pub email: String,
    pub password: String,
}

fn from_env() -> Option<Credentials> {
    let email = std::env::var("NTS_EMAIL").ok()?;
    let password = std::env::var("NTS_PASSWORD").ok()?;
    if email.is_empty() || password.is_empty() {
        return None;
    }
    Some(Credentials { email, password })
}

fn entry() -> Result<keyring::Entry, String> {
    keyring::Entry::new(SERVICE, ACCOUNT).map_err(|err| err.to_string())
}

pub fn read() -> Result<Option<Credentials>, String> {
    if let Some(creds) = from_env() {
        return Ok(Some(creds));
    }

    match entry()?.get_password() {
        Ok(json) => serde_json::from_str(&json).map_err(|err| err.to_string()),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(err) => Err(err.to_string()),
    }
}

pub fn write(credentials: &Credentials) -> Result<(), String> {
    let json = serde_json::to_string(credentials).map_err(|err| err.to_string())?;
    entry()?.set_password(&json).map_err(|err| err.to_string())
}

pub fn clear() -> Result<(), String> {
    match entry()?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}

pub fn has() -> bool {
    read().ok().flatten().is_some()
}
