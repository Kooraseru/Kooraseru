use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn init_theme_system() {
    let theme = get_preferred_theme();
    apply_theme(&theme);
}

#[wasm_bindgen]
pub fn set_theme(theme_name: &str) -> bool {
    apply_theme(theme_name);
    save_theme_preference(theme_name);
    true
}

#[wasm_bindgen]
pub fn get_current_theme() -> String {
    get_preferred_theme()
}

fn get_preferred_theme() -> String {
    // Check for saved cookie preference
    if let Some(saved_theme) = get_theme_cookie() {
        return saved_theme;
    }
    
    "dark".to_string()
}

fn apply_theme(theme: &str) {
    if let Some(window) = web_sys::window() {
        if let Some(document) = window.document() {
            if let Some(root) = document.document_element() {
                let _ = root.set_attribute("data-theme", theme);
            }
        }
    }
}

fn get_theme_cookie() -> Option<String> {
    if let Some(window) = web_sys::window() {
        if let Ok(cookie_string) = window.document().and_then(|d| d.cookie().ok()) {
            for cookie in cookie_string.split(';') {
                let cookie = cookie.trim();
                if cookie.starts_with("theme=") {
                    return Some(cookie[6..].to_string());
                }
            }
        }
    }
    None
}

fn save_theme_preference(theme: &str) {
    if let Some(window) = web_sys::window() {
        if let Some(doc) = window.document() {
            let cookie = format!("theme={}; path=/; max-age=31536000", theme);
            let _ = doc.set_cookie(&cookie);
        }
    }
}
