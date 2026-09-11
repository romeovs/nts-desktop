use std::path::Path;

pub fn url_from_webloc(path: &Path) -> Result<String, String> {
    if path.extension().and_then(|ext| ext.to_str()) != Some("webloc") {
        return Err("NTSer can only open .webloc files".into());
    }

    let value = plist::Value::from_file(path).map_err(|err| err.to_string())?;
    url_from_plist(value).ok_or_else(|| "NTSer can only open .webloc files".into())
}

pub fn url_from_opened(url: &str) -> Result<String, String> {
    if url.starts_with("https://www.nts.live/shows/") {
        return Ok(url.to_string());
    }

    let path = url.strip_prefix("file://").unwrap_or(url);
    url_from_webloc(Path::new(path))
}

fn url_from_plist(value: plist::Value) -> Option<String> {
    match value {
        plist::Value::Dictionary(dict) => dict
            .get("URL")
            .and_then(|item| item.as_string())
            .map(str::to_string),
        plist::Value::Array(items) => items.into_iter().find_map(url_from_plist),
        _ => None,
    }
}
