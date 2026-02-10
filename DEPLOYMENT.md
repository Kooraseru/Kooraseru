# Deployment Guide

This document describes how to deploy the Kooraseru website to the different subdomains.

## Overview

Kooraseru uses two main distributions:

1. **English (Default)**: `kooraseru.com` and `en.kooraseru.com`
2. **Japanese**: `jp.kooraseru.com`

Both share the same WebAssembly module and CSS files but have different HTML and localization strings.

## Directory Structure for Deployment

### Production Deployment

```
kooraseru.com/
├── index.html
├── kooraseru.js
├── kooraseru_bg.wasm
├── js/
│   └── theme-helper.js
└── .github/resources/
    ├── stylesheet.css
    ├── themes.css
    ├── topbar.css
    └── kooraseru.ico

jp.kooraseru.com/
├── index.html
├── (symlink or copy kooraseru.js)
├── (symlink or copy kooraseru_bg.wasm)
├── js/
│   └── (symlink or copy theme-helper.js)
└── .github/resources/
    ├── (symlink or copy stylesheet.css)
    ├── (symlink or copy themes.css)
    ├── (symlink or copy topbar.css)
    └── (symlink or copy kooraseru.ico)
```

> **Note on Symlinks**: Using symlinks for shared files (JS, CSS, icons) reduces storage and keeps 
> all versions in sync automatically. Ensure your hosting provider supports symlinks.

## Build Process

### 1. Build Locally

Run the build script appropriate for your OS:

**Linux/macOS:**
```bash
chmod +x build.sh
./build.sh
```

**Windows:**
```powershell
.\build.ps1
```

This will:
1. Compile the Rust code to WebAssembly
2. Copy generated files to `public/`
3. Verify all required files exist
4. Output deployment instructions

### 2. Test Locally

```bash
# Serve the public directory locally
python -m http.server 8000 --directory public
```

Visit:
- English: `http://localhost:8000`
- Japanese: `http://localhost:8000/jp/`

Test:
- [ ] Theme toggle works
- [ ] Theme persists after refresh (check Application > Cookies)
- [ ] Light and dark themes apply correctly
- [ ] Language links work
- [ ] Icons display properly
- [ ] Fonts load correctly (Google Sans)

## Deployment Methods

### Option 1: GitHub Pages (Free)

If using GitHub Pages for `kooraseru.com`:

1. Push the `public/` directory to `gh-pages` branch
2. Enable GitHub Pages in repository settings
3. Point custom domain to GitHub Pages

For `jp.kooraseru.com`:
- Create a separate repository or use a subdirectory
- Configure DNS for the subdomain

### Option 2: Traditional Web Hosting

#### Upload files via FTP/SFTP

1. **For kooraseru.com:**
   ```
   FTP to kooraseru.com root
   Upload all files from public/
   ```

2. **For jp.kooraseru.com:**
   ```
   FTP to jp.kooraseru.com root
   Upload all files from public/jp/
   ```

#### Using rsync (Linux/macOS)

```bash
# English version
rsync -avz --delete public/ user@kooraseru.com:/var/www/html/

# Japanese version
rsync -avz --delete public/jp/ user@jp.kooraseru.com:/var/www/html/
```

### Option 3: Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM nginx:alpine

# Copy English version
COPY public/ /usr/share/nginx/html/

# Copy Japanese version
RUN mkdir -p /usr/share/nginx/html/jp
COPY public/jp/* /usr/share/nginx/html/jp/

# Optional: Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

Build and run:
```bash
docker build -t kooraseru:latest .
docker run -p 80:80 kooraseru:latest
```

### Option 4: Cloud Hosting (AWS S3, Cloudflare)

#### AWS S3

1. Create two S3 buckets: `kooraseru.com` and `jp.kooraseru.com`
2. Enable static website hosting on each
3. Upload files:
   ```bash
   aws s3 sync public/ s3://kooraseru.com/
   aws s3 sync public/jp/ s3://jp.kooraseru.com/
   ```
4. Configure CloudFront for HTTPS
5. Point DNS CNAME to CloudFront distribution

#### Cloudflare Pages

1. Connect GitHub repository
2. Set build command: `./build.sh` (or `.\build.ps1` on Windows)
3. Set publish directory: `public`
4. Deploy
5. Set up subdomain routing for Japanese version

## DNS Configuration

### For kooraseru.com

```dns
# Main domain points to your host
kooraseru.com.     A       <your-server-ip>
www.kooraseru.com. CNAME   kooraseru.com.

# en.kooraseru.com redirects to main
en.kooraseru.com.  CNAME   kooraseru.com.
```

### For jp.kooraseru.com

```dns
# Japanese subdomain
jp.kooraseru.com.  A       <your-server-ip>
                   # OR if using different server:
                   CNAME   <your-jp-server>
```

## Web Server Configuration

### Nginx

Create `nginx.conf`:

```nginx
# English version (kooraseru.com & en.kooraseru.com)
server {
    listen 80;
    server_name kooraseru.com en.kooraseru.com;
    root /var/www/kooraseru;
    
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }
    
    location ~* \.(js|css|wasm|ico)$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}

# Japanese version (jp.kooraseru.com)
server {
    listen 80;
    server_name jp.kooraseru.com;
    root /var/www/kooraseru-jp;
    
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }
    
    location ~* \.(js|css|wasm|ico)$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### Apache

Create `.htaccess` in each subdomain root:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Route all requests to index.html for SPA
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.html [L,QSA]
    
    # Cache settings
    <FilesMatch "\.(js|css|wasm|ico|json)$">
        Header set Cache-Control "public, max-age=31536000"
    </FilesMatch>
</IfModule>
```

## SSL/HTTPS Setup

Use Let's Encrypt with Certbot:

```bash
# Install certbot
sudo apt-get install certbot certbot-nginx

# Generate certificates for all domains
sudo certbot certonly --nginx \
    -d kooraseru.com \
    -d en.kooraseru.com \
    -d www.kooraseru.com \
    -d jp.kooraseru.com

# Auto-renew
sudo certbot renew --dry-run
```

## Shared Assets Strategy

To minimize storage and ensure consistency:

### Option 1: Symlinks (Recommended)

```bash
# In jp.kooraseru.com directory:
ln -s ../kooraseru.com/kooraseru.js ./
ln -s ../kooraseru.com/kooraseru_bg.wasm ./
ln -s ../kooraseru.com/js ./
ln -s ../kooraseru.com/.github ./.github
```

### Option 2: Copy at Build Time

Update build script to handle deployment:

```bash
# Build WebAssembly
wasm-pack build --target web --release

# Deploy English
rsync -av public/ /var/www/kooraseru.com/

# Deploy Japanese (with shared assets)
rsync -av public/jp/ /var/www/jp.kooraseru.com/
rsync -av public/kooraseru* /var/www/jp.kooraseru.com/
rsync -av public/js /var/www/jp.kooraseru.com/
rsync -av public/.github /var/www/jp.kooraseru.com/
```

## Verification Checklist

After deployment:

- [ ] English version loads (both kooraseru.com and en.kooraseru.com)
- [ ] Japanese version loads on jp.kooraseru.com
- [ ] HTTPS works on all domains
- [ ] Theme toggle functions
- [ ] Theme persists across page reloads
- [ ] Light and dark themes display correctly
- [ ] Google Sans font loads correctly
- [ ] WebAssembly module loads (check DevTools Console)
- [ ] All images/icons display
- [ ] Responsive design works on mobile
- [ ] Language switcher navigates correctly
- [ ] No 404 errors in console

## Performance Monitoring

Monitor after deployment:

```bash
# Lighthouse testing
lighthouse https://kooraseru.com
lighthouse https://jp.kooraseru.com

# Check load times
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://kooraseru.com
```

## Troubleshooting

### WebAssembly not loading

1. Check browser console for errors
2. Verify `kooraseru.js` and `kooraseru_bg.wasm` exist
3. Check MIME type: `.wasm` should be `application/wasm`

Nginx fix:
```nginx
types {
    application/wasm wasm;
}
```

### Theme toggle not working

1. Check if `ThemeHelper` is defined
2. Verify cookies are enabled
3. Check browser console for JavaScript errors
4. Ensure `theme-helper.js` loaded before main script

### Fonts not loading

1. Check Google Fonts link in HTML
2. Verify no CSP blocking font loading
3. Check network tab for font requests

Add to headers:
```
Access-Control-Allow-Origin: *
```

## Updating Content

To update the site:

1. Make changes locally
2. Run build script
3. Test locally
4. Deploy with rsync/FTP/git
5. Clear CDN cache if using one

## Rollback Plan

Keep previous versions:

```bash
# Backup before new deployment
tar czf kooraseru-$(date +%s).tar.gz /var/www/kooraseru.com/
tar czf kooraseru-jp-$(date +%s).tar.gz /var/www/jp.kooraseru.com/

# Restore if needed
tar xzf kooraseru-<timestamp>.tar.gz -C /var/www/
```

## Support

For deployment issues:
- Check web server logs
- Review browser DevTools Network and Console tabs
- Verify file permissions (should be 644 for files, 755 for directories)
- Test with different browsers
