#!/bin/bash

# Kooraseru Build and Deployment Script
# Builds WebAssembly module and prepares both English and Japanese distributions

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Kooraseru Build Script${NC}"
echo -e "${BLUE}========================================${NC}"

# Step 1: Build WebAssembly Module
echo -e "\n${YELLOW}[1/4]${NC} Building WebAssembly module..."
wasm-pack build --target web --release

echo -e "${GREEN}✓ WebAssembly module built successfully${NC}"

# Step 2: Copy Wasm files to public directory
echo -e "\n${YELLOW}[2/4]${NC} Copying WebAssembly files to public directory..."
cp pkg/kooraseru.js public/
cp pkg/kooraseru_bg.wasm public/
if [ -f pkg/kooraseru.d.ts ]; then
    cp pkg/kooraseru.d.ts public/
fi

echo -e "${GREEN}✓ WebAssembly files copied${NC}"

# Step 3: Verify build structure
echo -e "\n${YELLOW}[3/4]${NC} Verifying build structure..."
if [ ! -f public/index.html ]; then
    echo -e "${RED}✗ Missing public/index.html${NC}"
    exit 1
fi

if [ ! -f public/jp/index.html ]; then
    echo -e "${RED}✗ Missing public/jp/index.html${NC}"
    exit 1
fi

if [ ! -f public/kooraseru.js ]; then
    echo -e "${RED}✗ Missing public/kooraseru.js${NC}"
    exit 1
fi

if [ ! -f public/.github/resources/stylesheet.css ]; then
    echo -e "${RED}✗ Missing public/.github/resources/stylesheet.css${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build structure verified${NC}"

# Step 4: Summary
echo -e "\n${YELLOW}[4/4]${NC} Build complete!"
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Build Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "English Version:  kooraseru.com (public/)"
echo -e "Japanese Version: jp.kooraseru.com (public/jp/)"
echo -e ""
echo -e "To serve locally:"
echo -e "  ${BLUE}python -m http.server 8000 --directory public${NC}"
echo -e ""
echo -e "Then visit:"
echo -e "  English:  http://localhost:8000"
echo -e "  Japanese: http://localhost:8000/jp/"
echo -e ""
echo -e "Next steps:"
echo -e "  1. Test the site locally"
echo -e "  2. Deploy public/ to kooraseru.com"
echo -e "  3. Deploy public/jp/ to jp.kooraseru.com"
echo -e "${GREEN}========================================${NC}"
