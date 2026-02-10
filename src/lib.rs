use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn init_theme_system() {
    // Load and apply the user's preferred theme
    // This is handled by JavaScript for cookie management
    // Wasm just ensures DOM is ready
}

#[wasm_bindgen]
pub fn set_theme(theme_name: &str) -> bool {
    // Apply theme to DOM
    apply_theme(theme_name);
    // Cookie saving is handled by JavaScript (ThemeHelper)
    true
}

#[wasm_bindgen]
pub fn get_current_theme() -> String {
    // Get current theme from DOM attribute
    if let Some(window) = web_sys::window() {
        if let Some(document) = window.document() {
            if let Some(root) = document.document_element() {
                if let Some(theme) = root.get_attribute("data-theme") {
                    return theme;
                }
            }
        }
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
