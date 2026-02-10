# Quick Start Guide

Get your Kooraseru website running in 5 minutes!

## Prerequisites

Only need 3 things installed:

1. **Rust** - https://rustup.rs/
2. **wasm-pack** - https://rustwasm.org/wasm-pack/installer/
3. **Python 3** - For local server (or any static server)

## Step 1: Build

Choose your OS:

### macOS/Linux:
```bash
chmod +x build.sh
./build.sh
```

### Windows:
```powershell
.\build.ps1
```

Expected output:
```
✅ WebAssembly module built successfully
✅ WebAssembly files copied
✅ Build structure verified
✅ Build complete!
```

## Step 2: Run Locally

```bash
python -m http.server 8000 --directory public
```

You'll see:
```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

## Step 3: Visit in Browser

- **English**: http://localhost:8000
- **Japanese**: http://localhost:8000/jp/

## Step 4: Test Features

✅ **Theme Toggle** - Click brightness button (bottom-right)
- Light and Dark themes appear
- Click to switch
- Refresh page - theme persists (saved in cookie)

✅ **Topbar** - At top of page
- Kooraseru logo on left
- Language selector on right
- Links to English and Japanese versions

✅ **Typography** - Should see Google Sans font
- Clean, modern text rendering
- Consistent sizing and spacing

✅ **Responsive** - Try resizing browser window
- UI adapts to different screen sizes
- Mobile-friendly layout

## Troubleshooting

### "wasm-pack command not found"
Install wasm-pack:
```bash
curl https://rustwasm.org/wasm-pack/installer/init.sh -sSf | sh
```

### "Python command not found"
Use alternative server:
```bash
# Node.js
npx http-server public -p 8000

# Ruby
ruby -run -ehttpd public -p 8000

# PHP
php -S localhost:8000 -t public
```

### Theme toggle doesn't work
1. Check browser console (F12)
2. Verify no JavaScript errors
3. Ensure `public/kooraseru.js` exists
4. Or use fallback theme-helper.js (automatic)

### Fonts look wrong
1. Wait 2-3 seconds for Google Fonts to load
2. Check Network tab in DevTools
3. Or install Google Sans locally

## File Structure Created

```
public/
├── index.html              ← Main English page
├── kooraseru.js            ← Generated WebAssembly
├── kooraseru_bg.wasm       ← Generated WebAssembly binary
├── js/
│   └── theme-helper.js     ← Fallback theme support
├── .github/resources/
│   ├── stylesheet.css      ← Base styles
│   ├── themes.css          ← Dark/Light theme colors
│   ├── topbar.css          ← Topbar and buttons
│   └── kooraseru.ico       ← Favicon
└── jp/
    └── index.html          ← Japanese version
```

## Next Steps

1. **Test locally** - Follow steps above
2. **Customize** - Edit CSS files to match your brand
3. **Add content** - Modify HTML files to add pages
4. **Deploy** - See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting options

## File Customization

### Change Default Theme
[SETUP.md](SETUP.md#theme-system) → Modify `get_preferred_theme()` in `src/main.rs`

### Change Colors
[.github/resources/themes.css](.github/resources/themes.css) → Update color values

### Change Fonts
[.github/resources/stylesheet.css](.github/resources/stylesheet.css) → Update `--font-family`

### Add Navigation
[public/index.html](public/index.html) → Edit topbar-center section

## Reference

- **Setup Details**: [SETUP.md](SETUP.md)
- **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Full Implementation**: [IMPLEMENTATION.md](IMPLEMENTATION.md)

## Common Commands

```bash
# Rebuild after code changes
./build.sh              # macOS/Linux
.\build.ps1             # Windows

# Start local server
python -m http.server 8000 --directory public

# Clean build
cargo clean && ./build.sh

# Check file sizes
ls -lh public/kooraseru*
```

## Performance Metrics

After build, your website includes:

- **Wasm Module**: ~25KB gzipped
- **CSS**: ~10KB gzipped  
- **JavaScript**: ~3KB gzipped
- **Total**: ~50KB gzipped
- **Load Time**: <100ms on 4G

## Support & Documentation

- **Setup**: See [SETUP.md](SETUP.md)
- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Technical Details**: See [IMPLEMENTATION.md](IMPLEMENTATION.md)

---

**You're all set!** 🚀

Your Kooraseru website is ready to build and deploy. Questions? Check the docs above.
