# Kooraseru Build and Deployment Script (Windows)
# Builds WebAssembly module and prepares both English and Japanese distributions

$ErrorActionPreference = "Stop"

# Colors using Write-Host
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Blue }
function Write-Step { Write-Host $args -ForegroundColor Yellow }

Write-Info "========================================"
Write-Info "Kooraseru Build Script"
Write-Info "========================================"

# Step 1: Build WebAssembly Module
Write-Step "`n[1/4] Building WebAssembly module..."
try {
    wasm-pack build --target web --release
    Write-Success "✓ WebAssembly module built successfully"
} catch {
    Write-Host "✗ Failed to build WebAssembly module" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 2: Copy Wasm files to public directory
Write-Step "`n[2/4] Copying WebAssembly files to public directory..."
try {
    Copy-Item -Path "pkg/kooraseru.js" -Destination "public/" -Force
    Copy-Item -Path "pkg/kooraseru_bg.wasm" -Destination "public/" -Force
    
    if (Test-Path "pkg/kooraseru.d.ts") {
        Copy-Item -Path "pkg/kooraseru.d.ts" -Destination "public/" -Force
    }
    
    Write-Success "✓ WebAssembly files copied"
} catch {
    Write-Host "✗ Failed to copy WebAssembly files" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 3: Verify build structure
Write-Step "`n[3/4] Verifying build structure..."
$requiredFiles = @(
    "public/index.html",
    "public/jp/index.html",
    "public/kooraseru.js",
    "public/.github/resources/stylesheet.css",
    "public/.github/resources/themes.css",
    "public/.github/resources/topbar.css",
    "public/js/theme-helper.js"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "✗ Missing $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    exit 1
}

Write-Success "✓ Build structure verified"

# Step 4: Summary
Write-Step "`n[4/4] Build complete!"
Write-Info "`n========================================"
Write-Success "Build Summary"
Write-Info "========================================"
Write-Host "English Version:  kooraseru.com (public/)"
Write-Host "Japanese Version: jp.kooraseru.com (public/jp/)"
Write-Host ""
Write-Host "To serve locally:"
Write-Host "  python -m http.server 8000 --directory public" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then visit:"
Write-Host "  English:  http://localhost:8000"
Write-Host "  Japanese: http://localhost:8000/jp/"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Test the site locally"
Write-Host "  2. Deploy public/ to kooraseru.com"
Write-Host "  3. Deploy public/jp/ to jp.kooraseru.com"
Write-Info "========================================"
