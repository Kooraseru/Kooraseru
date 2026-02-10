/**
 * Kooraseru WebAssembly Module
 * This module is optional - theme and language systems use pure JavaScript
 */

let wasm = null;
let wasmReady = false;

// Initialize WASM (optional initialization)
async function init() {
    console.log('Kooraseru WASM module loaded (optional, not required)');
    wasmReady = true;
}

// Placeholder functions if WASM fails to load
function init_theme_system() {
    console.log('WASM init_theme_system called - theme managed by JavaScript');
}

function set_theme(name) {
    console.log('WASM set_theme called with:', name);
    // Theme is managed by pure JavaScript (theme-manager.js)
}

function get_current_theme() {
    console.log('WASM get_current_theme called');
    const theme = document.documentElement.getAttribute('data-theme');
    return theme || 'dark';
}

export { init, init_theme_system, set_theme, get_current_theme };
