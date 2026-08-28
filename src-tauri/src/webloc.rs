/// Read the URL out of a macOS .webloc bookmark file.
pub fn read(path: &str) -> Option<String> {
    let value = plist::Value::from_file(path).ok()?;
    let url = value.as_dictionary()?.get("URL")?.as_string()?;
    Some(url.to_string())
}
