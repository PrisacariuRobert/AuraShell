#!/bin/bash
# AuraShell Installation Script
# This script downloads and installs AuraShell on macOS

set -e

echo "🚀 Installing AuraShell..."
echo ""

# Detect architecture
ARCH=$(uname -m)
RELEASE_TAG="0.1.3"
FILE_VERSION="0.1.0"

if [ "$ARCH" = "arm64" ]; then
    echo "✓ Detected Apple Silicon (ARM64)"
    DMG_NAME="AuraShell_${FILE_VERSION}_aarch64.dmg"
else
    echo "✓ Detected Intel (x86_64)"
    DMG_NAME="AuraShell_${FILE_VERSION}_x64.dmg"
fi

DMG_URL="https://github.com/PrisacariuRobert/AuraShell/releases/download/v${RELEASE_TAG}/${DMG_NAME}"

# Download DMG
echo ""
echo "📥 Downloading AuraShell from GitHub..."
if ! curl -L -o /tmp/AuraShell.dmg "$DMG_URL" 2>/dev/null; then
    echo "❌ Error: Failed to download AuraShell"
    echo "Please check your internet connection and try again"
    exit 1
fi

echo "✓ Download complete"

# Remove quarantine attribute from DMG
echo ""
echo "🔓 Removing quarantine attribute..."
xattr -cr /tmp/AuraShell.dmg 2>/dev/null || true

# Mount DMG
echo "💿 Mounting installer..."
if ! hdiutil attach /tmp/AuraShell.dmg -nobrowse -quiet; then
    echo "❌ Error: Failed to mount DMG"
    rm /tmp/AuraShell.dmg
    exit 1
fi

# Wait a moment for the mount to complete
sleep 1

# Copy to Applications
echo "📦 Installing to /Applications..."
if [ -d "/Applications/AuraShell.app" ]; then
    echo "⚠️  AuraShell is already installed. Removing old version..."
    rm -rf /Applications/AuraShell.app
fi

if ! cp -R "/Volumes/AuraShell/AuraShell.app" /Applications/; then
    echo "❌ Error: Failed to copy app to Applications"
    hdiutil detach "/Volumes/AuraShell" -quiet 2>/dev/null || true
    rm /tmp/AuraShell.dmg
    exit 1
fi

echo "✓ Installation complete"

# Unmount DMG
echo "🧹 Cleaning up..."
hdiutil detach "/Volumes/AuraShell" -quiet 2>/dev/null || true

# Remove quarantine from app
xattr -cr /Applications/AuraShell.app 2>/dev/null || true

# Cleanup temp file
rm /tmp/AuraShell.dmg

echo ""
echo "✅ AuraShell has been successfully installed!"
echo ""
echo "🎉 You can now:"
echo "   • Launch AuraShell from your Applications folder"
echo "   • Or run: open -a AuraShell"
echo ""
echo "📝 Note: On first launch, macOS may ask you to confirm opening the app."
echo "   Just click 'Open' when prompted."
echo ""
echo "💡 Need help? Visit: https://github.com/PrisacariuRobert/AuraShell"
echo ""
