# Kooraseru

A multilingual WebAssembly-powered website platform with theme support and localization.

## Features

- **WebAssembly Core**: Built with Rust and compiled to WebAssembly for efficient performance
- **Multilingual Support**: English (kooraseru.com) and Japanese (jp.kooraseru.com) distributions
- **Dark/Light Themes**: User-selectable themes with cookie-based preferences
- **Modern UI**: Sticky topbar, ribbon navigation, and floating theme toggle button
- **Google Sans Font**: Clean, modern typography using Google Fonts
- **Responsive Design**: Mobile-friendly interface

## Directory Structure

```
.
├── public/
│   └── index.html              # Main HTML file
├── src/
│   └── main.rs                 # Rust/WebAssembly module
├── .github/resources/
│   ├── stylesheet.css          # Base styles
│   ├── themes.css              # Dark and light theme definitions
│   ├── topbar.css              # Topbar, ribbon, and UI component styles
│   ├── kooraseru.ico           # Favicon
│   └── ...
├── Cargo.toml                  # Rust package configuration
└── README.md                   # This file
```

## Language Distribution

### English (Default)
- **Domain**: `en.kooraseru.com` and `kooraseru.com` (default)
- **Source**: Main build output
- **Note**: `en.kooraseru.com` redirects to `kooraseru.com`

### Japanese
- **Domain**: `jp.kooraseru.com`
- **Build**: Separate build with Japanese localization
- **Files**: Translated UI strings and Japanese-specific content

## Setup and Build

### Prerequisites
- Rust (1.70+)
- wasm-pack
- Node.js (for serving)

### Installation

1. Install Rust if not already installed:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. Install wasm-pack:
   ```bash
   curl https://rustwasm.org/wasm-pack/installer/init.sh -sSf | sh
   ```

3. Clone and setup the project:
   ```bash
   git clone https://github.com/Kooraseru/Kooraseru.git
   cd Kooraseru
   ```

### Build WebAssembly

Build the WebAssembly module:

```bash
wasm-pack build --target web --release
```

This generates the `pkg/` directory with:
- `kooraseru.js` - JavaScript bindings
- `kooraseru_bg.wasm` - WebAssembly binary
- `kooraseru.d.ts` - TypeScript definitions

### Serve Locally

Use any static file server to serve the `public/` directory:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server public -p 8000
```

Visit `http://localhost:8000` in your browser.

## Theme System

### Architecture

The theme system uses:
- **Wasm Module**: `src/main.rs` handles theme logic and cookie management
- **CSS Variables**: `themes.css` defines color schemes
- **User Preferences**: Browser cookies store user theme selection (30-day expiry)
- **Fallback**: Defaults to dark theme if no preference is found

### Available Themes

- **Dark**: Professional dark background (#1e1e1e) with accent colors
- **Light**: Clean light background (#ffffff) for better readability

### Adding New Themes

1. Add new CSS variables to `themes.css`:
   ```css
   html[data-theme="custom"] {
       --bg-primary: #...;
       --text-primary: #...;
       /* ... other variables ... */
   }
   ```

2. Add a new theme button in `public/index.html`:
   ```html
   <button class="theme-option" data-theme="custom">Custom Theme</button>
   ```

3. Recompile the Wasm module if adding new functionality

## CSS Architecture

### stylesheet.css
- Base styles and typography
- Layout and spacing scales
- Utility classes
- Uses CSS custom properties for theming

### themes.css
- Theme-specific color definitions
- Supports both dark and light themes
- Easy to extend with new themes

### topbar.css
- Topbar and navigation styling
- Ribbon styling
- Theme toggle button (fixed bottom-right)
- Responsive breakpoints

## WebAssembly API

The Wasm module provides:

```javascript
// Initialize the theme system
init_theme_system()

// Set a specific theme
set_theme(theme_name: str) -> bool

// Get the current theme
get_current_theme() -> str
```

## Localization

### File Structure
```
public/
├── index.html              # English/default version
└── jp/
    └── index.html          # Japanese version
```

### Implementation
- Each language has its own HTML build
- Shared CSS and Wasm modules
- Language selector in topbar
- Direct subdomain routing: `jp.kooraseru.com` serves Japanese version

## Cookie Usage

The site uses cookies for:
- **Theme Preference**: `theme={light|dark}` (30-day expiry)
- **Path**: `/` (site-wide)

## Browser Support

- Chrome/Edge: ✓
- Firefox: ✓
- Safari: ✓
- Mobile Browsers: ✓ (responsive design)

## Development

### Hot Reload
For development with auto-rebuild:

```bash
# Terminal 1: Watch and rebuild Wasm
wasm-pack build --target web --watch

# Terminal 2: Serve static files
python -m http.server 8000 --directory public
```

### Debugging
- Use browser DevTools to inspect the theme toggle
- Check Application > Cookies to view theme preferences
- Console logs available in `src/main.rs` via `web_sys::console::log_*`

## Performance

- **Initial Load**: ~50KB (gzipped)
- **Wasm Module**: ~25KB (gzipped)
- **CSS**: ~10KB (combined, minified)
- **Theme Switch**: <50ms (Wasm + CSS update)

## License

See LICENSE file for details.

## Contributing

Contributions are welcome! Please follow the existing code structure and style.
