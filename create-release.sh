#!/bin/bash

# Matrix Digital Rain - Local Release Script
# This script creates a release package that can be run locally
# without needing to push to GitHub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Matrix Digital Rain - Local Release Creator${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if VERSION file exists
if [ ! -f "VERSION" ]; then
    echo -e "${RED}❌ VERSION file not found${NC}"
    echo "Creating VERSION file with default version 1.0.0"
    echo "1.0.0" > VERSION
fi

# Read current version
CURRENT_VERSION=$(cat VERSION | tr -d '[:space:]')
echo -e "${YELLOW}Current version:${NC} $CURRENT_VERSION"
echo ""

# Ask for new version
read -p "Enter new version (or press Enter to use $CURRENT_VERSION): " NEW_VERSION

if [ -z "$NEW_VERSION" ]; then
    NEW_VERSION=$CURRENT_VERSION
    echo -e "${YELLOW}Using current version:${NC} $NEW_VERSION"
else
    echo -e "${GREEN}New version:${NC} $NEW_VERSION"
    echo "$NEW_VERSION" > VERSION
fi

echo ""
echo -e "${BLUE}Creating release package...${NC}"

# Create release directory
RELEASE_DIR="release-package"
if [ -d "$RELEASE_DIR" ]; then
    rm -rf "$RELEASE_DIR"
fi
mkdir -p "$RELEASE_DIR"

# Copy essential files
echo "  📄 Copying web application files..."
cp index.html "$RELEASE_DIR/"
cp service-worker.js "$RELEASE_DIR/"
cp manifest.webmanifest "$RELEASE_DIR/"
cp icon-192.png "$RELEASE_DIR/"
cp icon-512.png "$RELEASE_DIR/"
cp README.md "$RELEASE_DIR/"
cp LICENSE "$RELEASE_DIR/" 2>/dev/null || echo "  ⚠️  LICENSE file not found (skipping)"
cp VERSION "$RELEASE_DIR/"

# Copy directories
echo "  📁 Copying JavaScript modules..."
cp -r js "$RELEASE_DIR/"

echo "  📁 Copying libraries..."
cp -r lib "$RELEASE_DIR/"

echo "  📁 Copying assets (fonts, textures)..."
cp -r assets "$RELEASE_DIR/"

echo "  📁 Copying shaders..."
cp -r shaders "$RELEASE_DIR/"

# Create archive
ARCHIVE_NAME="matrix-$NEW_VERSION.zip"
echo ""
echo -e "${BLUE}Creating archive: $ARCHIVE_NAME${NC}"

cd "$RELEASE_DIR"
zip -r "../$ARCHIVE_NAME" . > /dev/null
cd ..

# Calculate checksum
echo -e "${BLUE}Calculating checksum...${NC}"
if command -v sha256sum &> /dev/null; then
    sha256sum "$ARCHIVE_NAME" > "$ARCHIVE_NAME.sha256"
    CHECKSUM=$(cat "$ARCHIVE_NAME.sha256" | cut -d' ' -f1)
elif command -v shasum &> /dev/null; then
    shasum -a 256 "$ARCHIVE_NAME" > "$ARCHIVE_NAME.sha256"
    CHECKSUM=$(cat "$ARCHIVE_NAME.sha256" | cut -d' ' -f1)
else
    echo -e "${YELLOW}⚠️  sha256sum not available, skipping checksum${NC}"
    CHECKSUM="N/A"
fi

# Get file size
FILE_SIZE=$(ls -lh "$ARCHIVE_NAME" | awk '{print $5}')

# Clean up release directory
rm -rf "$RELEASE_DIR"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Release package created successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📦 Package:${NC}      $ARCHIVE_NAME"
echo -e "${BLUE}📏 Size:${NC}         $FILE_SIZE"
echo -e "${BLUE}🔐 SHA-256:${NC}      $CHECKSUM"
echo ""
echo -e "${YELLOW}Installation Instructions:${NC}"
echo "  1. Extract the archive:"
echo "     unzip $ARCHIVE_NAME"
echo ""
echo "  2. Start an HTTP server (choose one):"
echo "     • Python:  python3 -m http.server 8000"
echo "     • Node.js: npx http-server -p 8000"
echo "     • PHP:     php -S localhost:8000"
echo ""
echo "  3. Open in your browser:"
echo "     http://localhost:8000"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
