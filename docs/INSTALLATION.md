# AuraShell Installation Guide

This comprehensive guide covers all installation methods for AuraShell across different platforms.

## Table of Contents

- [macOS Installation](#macos-installation)
  - [Method 1: Automated Script](#method-1-automated-script-recommended)
  - [Method 2: Homebrew](#method-2-homebrew)
  - [Method 3: Manual DMG](#method-3-manual-dmg-installation)
  - [macOS Troubleshooting](#macos-troubleshooting)
- [Linux Installation](#linux-installation)
- [Windows Installation](#windows-installation)
- [Building from Source](#building-from-source)

---

## macOS Installation

### Method 1: Automated Script (Recommended)

The automated installation script is the easiest way to install AuraShell on macOS.

**Installation:**

```bash
curl -fsSL https://raw.githubusercontent.com/PrisacariuRobert/AuraShell/main/install.sh | bash
```

**What this does:**
1. Detects your Mac architecture (Apple Silicon or Intel)
2. Downloads the appropriate DMG file from GitHub Releases
3. Removes the quarantine attribute
4. Mounts the DMG
5. Copies AuraShell.app to /Applications
6. Cleans up temporary files

**After installation:**
- Launch from Applications folder: `open -a AuraShell`
- Or use Spotlight: Press `Cmd+Space`, type "AuraShell"

---

### Method 2: Homebrew

If you use [Homebrew](https://brew.sh), you can install AuraShell as a cask.

**First-time setup:**

```bash
# Add the AuraShell tap
brew tap PrisacariuRobert/aurashell

# Install AuraShell
brew install --cask aurashell
```

**Future updates:**

```bash
# Update Homebrew
brew update

# Upgrade AuraShell
brew upgrade --cask aurashell
```

**Uninstall:**

```bash
brew uninstall --cask aurashell
brew untap PrisacariuRobert/aurashell
```

---

### Method 3: Manual DMG Installation

For users who prefer manual installation or want full control over the process.

**Step 1: Download**

Download the appropriate DMG for your Mac:

- **Apple Silicon (M1/M2/M3)**:
  ```bash
  curl -L -O https://github.com/PrisacariuRobert/AuraShell/releases/latest/download/AuraShell_0.1.0_aarch64.dmg
  ```

- **Intel**:
  ```bash
  curl -L -O https://github.com/PrisacariuRobert/AuraShell/releases/latest/download/AuraShell_0.1.0_x64.dmg
  ```

Or download directly from [GitHub Releases](https://github.com/PrisacariuRobert/AuraShell/releases/latest).

**Step 2: Install**

1. Double-click the downloaded DMG file
2. Drag **AuraShell.app** to your **Applications** folder
3. Eject the DMG

**Step 3: First Launch**

macOS will block the app from opening normally because it's not code-signed. You have two options:

**Option A: Right-Click Method (Safe, Recommended)**

1. Open **Finder** → Go to **Applications** folder
2. **Right-click** (or Control+click) on **AuraShell.app**
3. Select **"Open"** from the context menu
4. Click **"Open"** in the security dialog that appears
5. The app will launch

This only needs to be done once. Future launches can be done normally.

**Option B: Terminal Method**

Remove the quarantine attribute:

```bash
xattr -cr /Applications/AuraShell.app
```

Then launch normally from Applications or with:

```bash
open -a AuraShell
```

---

### macOS Troubleshooting

#### Problem: "AuraShell is damaged and can't be opened"

**Cause:** macOS Gatekeeper blocks apps that aren't notarized by Apple.

**Solution 1: Right-click method**
1. Go to **Applications** folder
2. **Right-click** on AuraShell.app
3. Select **"Open"**
4. Click **"Open"** in the dialog

**Solution 2: Remove quarantine**
```bash
xattr -cr /Applications/AuraShell.app
```

**Solution 3: Reinstall with script**
```bash
curl -fsSL https://raw.githubusercontent.com/PrisacariuRobert/AuraShell/main/install.sh | bash
```
The script automatically handles the quarantine attribute.

---

#### Problem: "AuraShell can't be opened because Apple cannot check it for malicious software"

**Cause:** Same as above - Gatekeeper protection.

**Solution:** Use the right-click → Open method (see above).

---

#### Problem: App opens but won't stay in Dock

**Solution:**
1. Open AuraShell
2. Right-click the Dock icon
3. Options → Keep in Dock

---

#### Problem: "You do not have permission to open the application"

**Cause:** File permissions issue.

**Solution:**
```bash
sudo chown -R $(whoami) /Applications/AuraShell.app
chmod +x /Applications/AuraShell.app/Contents/MacOS/AuraShell
```

---

#### Why isn't AuraShell code-signed?

AuraShell is a free, open-source project. Apple's Developer Program costs $99/year for code signing and notarization. To keep AuraShell completely free and accessible, we use alternative distribution methods.

**Security:** You can:
- Verify the source code on [GitHub](https://github.com/PrisacariuRobert/AuraShell)
- Build from source yourself (see [BUILD.md](../BUILD.md))
- Check file hashes against releases

---

## Linux Installation

### Debian/Ubuntu (.deb package)

**Install:**

```bash
# Download
wget https://github.com/PrisacariuRobert/AuraShell/releases/latest/download/aura-shell_0.1.0_amd64.deb

# Install
sudo dpkg -i aura-shell_0.1.0_amd64.deb

# Fix dependencies if needed
sudo apt-get install -f
```

**Uninstall:**

```bash
sudo apt-get remove aura-shell
```

---

### Universal Linux (AppImage)

**Install:**

```bash
# Download
wget https://github.com/PrisacariuRobert/AuraShell/releases/latest/download/aura-shell_0.1.0_amd64.AppImage

# Make executable
chmod +x aura-shell_0.1.0_amd64.AppImage

# Run
./aura-shell_0.1.0_amd64.AppImage
```

**Optional: Add to Applications Menu**

```bash
# Move to user bin
mkdir -p ~/.local/bin
mv aura-shell_0.1.0_amd64.AppImage ~/.local/bin/aurashell

# Create desktop entry
cat > ~/.local/share/applications/aurashell.desktop <<EOF
[Desktop Entry]
Name=AuraShell
Exec=$HOME/.local/bin/aurashell
Type=Application
Categories=System;TerminalEmulator;
Terminal=false
EOF

# Update desktop database
update-desktop-database ~/.local/share/applications
```

---

### Fedora/RHEL (.rpm package)

**Install:**

```bash
# Download
wget https://github.com/PrisacariuRobert/AuraShell/releases/latest/download/aura-shell-0.1.0-1.x86_64.rpm

# Install
sudo rpm -i aura-shell-0.1.0-1.x86_64.rpm

# Or with dnf
sudo dnf install ./aura-shell-0.1.0-1.x86_64.rpm
```

**Uninstall:**

```bash
sudo dnf remove aura-shell
```

---

### Linux Troubleshooting

#### Problem: "Permission denied"

**Solution:**
```bash
chmod +x aura-shell_0.1.0_amd64.AppImage
```

#### Problem: AppImage won't run

**Cause:** Missing FUSE.

**Solution (Ubuntu/Debian):**
```bash
sudo apt-get install fuse libfuse2
```

**Solution (Fedora):**
```bash
sudo dnf install fuse fuse-libs
```

#### Problem: Missing dependencies (.deb)

**Solution:**
```bash
sudo apt-get install -f
```

---

## Windows Installation

### Method 1: Installer (Recommended)

**Install:**

1. Download [AuraShell_0.1.0_x64-setup.exe](https://github.com/PrisacariuRobert/AuraShell/releases/latest)
2. Double-click the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

**Uninstall:**

- Settings → Apps → AuraShell → Uninstall
- Or use "Add or Remove Programs"

---

### Method 2: Portable (MSI)

**Install:**

1. Download the MSI installer
2. Double-click to run
3. Choose installation location

---

### Windows Troubleshooting

#### Problem: "Windows protected your PC"

**Solution:**
1. Click "More info"
2. Click "Run anyway"

This is normal for unsigned Windows applications.

#### Problem: Won't start after installation

**Solution:**
Check Windows Defender or antivirus - they may have quarantined the app.

---

## Building from Source

For developers or users who want to build AuraShell themselves:

See [BUILD.md](../BUILD.md) for detailed build instructions.

**Quick start:**

```bash
# Clone repository
git clone https://github.com/PrisacariuRobert/AuraShell.git
cd AuraShell

# Install dependencies
npm install

# Run development build
npm run tauri dev

# Build production app
npm run tauri build
```

---

## Verifying Downloads

For security-conscious users, you can verify download integrity:

**Check file hash (macOS/Linux):**

```bash
# Download checksum file
wget https://github.com/PrisacariuRobert/AuraShell/releases/latest/download/checksums.txt

# Verify (example for macOS ARM)
sha256sum -c checksums.txt --ignore-missing
```

---

## Getting Help

- **GitHub Issues**: [Report problems](https://github.com/PrisacariuRobert/AuraShell/issues)
- **Documentation**: [Read the docs](https://github.com/PrisacariuRobert/AuraShell/tree/main/docs)
- **Build Guide**: [BUILD.md](../BUILD.md)

---

## Next Steps

After installation:

1. Launch AuraShell
2. Explore the features
3. Check the documentation
4. Join the community
5. Contribute on GitHub!

Thank you for using AuraShell!
