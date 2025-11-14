# AuraShell

An AI-Powered Terminal built with Tauri, React, and TypeScript.

## Installation

### macOS

Choose one of the following installation methods:

#### Option 1: Automated Install Script (Recommended)

The easiest way to install AuraShell is using our installation script:

```bash
curl -fsSL https://raw.githubusercontent.com/PrisacariuRobert/AuraShell/main/install.sh | bash
```

This script will automatically:
- Detect your Mac architecture (Apple Silicon or Intel)
- Download the appropriate version
- Remove quarantine attributes
- Install to your Applications folder

#### Option 2: Homebrew (For Homebrew Users)

If you have [Homebrew](https://brew.sh) installed:

```bash
brew tap PrisacariuRobert/aurashell
brew install --cask aurashell
```

#### Option 3: Manual Installation

1. Download the latest DMG file for your architecture:
   - **Apple Silicon (M1/M2/M3)**: [AuraShell_0.1.0_aarch64.dmg](https://github.com/PrisacariuRobert/AuraShell/releases/latest/download/AuraShell_0.1.0_aarch64.dmg)
   - **Intel**: [AuraShell_0.1.0_x64.dmg](https://github.com/PrisacariuRobert/AuraShell/releases/latest/download/AuraShell_0.1.0_x64.dmg)

2. Open the DMG file

3. Drag AuraShell.app to your Applications folder

4. **First launch only**: Right-click (or Control-click) on AuraShell.app and select "Open", then click "Open" again in the security dialog

### Linux

#### Debian/Ubuntu

Download and install the `.deb` package:

```bash
wget https://github.com/PrisacariuRobert/AuraShell/releases/latest/download/aura-shell_0.1.0_amd64.deb
sudo dpkg -i aura-shell_0.1.0_amd64.deb
```

#### Universal (AppImage)

Download and run the AppImage:

```bash
wget https://github.com/PrisacariuRobert/AuraShell/releases/latest/download/aura-shell_0.1.0_amd64.AppImage
chmod +x aura-shell_0.1.0_amd64.AppImage
./aura-shell_0.1.0_amd64.AppImage
```

### Windows

Download the installer:

1. Download [AuraShell_0.1.0_x64-setup.exe](https://github.com/PrisacariuRobert/AuraShell/releases/latest)
2. Run the installer
3. Follow the installation wizard

## Troubleshooting

### macOS: "AuraShell is damaged and can't be opened"

This is a macOS security feature called Gatekeeper. Since AuraShell is open-source and free, we don't pay Apple's $99/year code-signing fee.

**Solution 1: Use the right-click method**
1. Go to your Applications folder
2. **Right-click** (or Control-click) on AuraShell.app
3. Select **"Open"** from the menu
4. Click **"Open"** in the security dialog
5. This only needs to be done once

**Solution 2: Remove quarantine attribute (Advanced)**
```bash
xattr -cr /Applications/AuraShell.app
```

Then launch the app normally.

### macOS: "AuraShell can't be opened because Apple cannot check it for malicious software"

Same solution as above - use the right-click → Open method.

### Linux: Permission denied

Make the file executable:

```bash
chmod +x AuraShell_0.1.0_amd64.AppImage
```

## Features

- AI-Powered Terminal Experience
- Modern, intuitive interface built with React
- Cross-platform support (macOS, Linux, Windows)
- Built with Tauri for performance and security

## Development

See [BUILD.md](BUILD.md) for detailed build instructions.

### Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Add your license information here]

## Support

- **Issues**: [GitHub Issues](https://github.com/PrisacariuRobert/AuraShell/issues)
- **Documentation**: [docs/](docs/)
- **Releases**: [GitHub Releases](https://github.com/PrisacariuRobert/AuraShell/releases)

## Why isn't AuraShell code-signed?

AuraShell is completely free and open-source. Apple's Developer Program costs $99/year for code signing and notarization. To keep the project sustainable and accessible to everyone, we've chosen free distribution methods instead.

You can verify the source code yourself and build from source if you prefer. See [BUILD.md](BUILD.md) for instructions.
