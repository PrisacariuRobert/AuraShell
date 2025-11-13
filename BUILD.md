# Building AuraShell

This guide explains how to build AuraShell for macOS and Linux.

## Prerequisites

### All Platforms
- Node.js (v16 or later)
- npm
- Rust (latest stable version)

### macOS
- Xcode Command Line Tools: `xcode-select --install`

### Linux (Debian/Ubuntu)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

### Linux (Fedora/RHEL)
```bash
sudo dnf install webkit2gtk4.1-devel \
  openssl-devel \
  curl \
  wget \
  file \
  libappindicator-gtk3-devel \
  librsvg2-devel
```

### Linux (Arch)
```bash
sudo pacman -S webkit2gtk-4.1 \
  base-devel \
  curl \
  wget \
  file \
  openssl \
  appmenu-gtk-module \
  gtk3 \
  libappindicator-gtk3 \
  librsvg \
  libvips
```

## Building

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Application

#### For macOS
```bash
npm run tauri build
```

This will create:
- `.app` bundle at: `src-tauri/target/release/bundle/macos/AuraShell.app`
- `.dmg` installer at: `src-tauri/target/release/bundle/dmg/AuraShell_0.1.0_aarch64.dmg`

#### For Linux
```bash
npm run tauri build
```

This will create (depending on your distro):
- `.deb` package at: `src-tauri/target/release/bundle/deb/aura-shell_0.1.0_amd64.deb`
- `.AppImage` at: `src-tauri/target/release/bundle/appimage/aura-shell_0.1.0_amd64.AppImage`
- `.rpm` package at: `src-tauri/target/release/bundle/rpm/aura-shell-0.1.0-1.x86_64.rpm`

## Development Build

To run in development mode:
```bash
npm run tauri dev
```

## Output Locations

All build artifacts are located in `src-tauri/target/release/bundle/`:

- **macOS**:
  - `macos/AuraShell.app` - Application bundle
  - `dmg/AuraShell_0.1.0_aarch64.dmg` - DMG installer

- **Linux**:
  - `deb/` - Debian packages
  - `appimage/` - AppImage files
  - `rpm/` - RPM packages (on RHEL-based systems)

## Cross-Platform Building

Note: Cross-compilation between macOS and Linux is not officially supported by Tauri. To build for a specific platform, you need to build on that platform.

### Using GitHub Actions (Recommended)

For automated builds on multiple platforms, consider setting up GitHub Actions with the Tauri workflow:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, ubuntu-latest]

    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies (Ubuntu)
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev

      - name: Install frontend dependencies
        run: npm install

      - name: Build
        run: npm run tauri build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.platform }}
          path: src-tauri/target/release/bundle/
```

## Troubleshooting

### macOS: "App is damaged and can't be opened"
**Note**: As of the latest releases, AuraShell is properly code-signed and notarized. Users should be able to install directly without security warnings.

If you still encounter this issue:
1. Ensure you downloaded from the official GitHub releases
2. Check that the file wasn't corrupted during download
3. Try re-downloading the DMG file

**For Maintainers**: Code signing is configured in the CI/CD pipeline. See the "Code Signing Configuration" section below for setup details.

### Linux: Permission denied for .AppImage
```bash
chmod +x AuraShell_0.1.0_amd64.AppImage
./AuraShell_0.1.0_amd64.AppImage
```

### Build fails with missing dependencies
Make sure all system dependencies are installed. Re-run the platform-specific installation commands above.

## Distribution

### macOS
- Distribute the `.dmg` file from `src-tauri/target/release/bundle/dmg/`
- For App Store distribution, you'll need to sign and notarize the app

### Linux
- **Debian/Ubuntu**: Distribute the `.deb` file
- **Universal Linux**: Distribute the `.AppImage` file (works on most distributions)
- **RHEL/Fedora**: Distribute the `.rpm` file

## File Sizes

Approximate sizes:
- macOS DMG: ~5-10 MB
- Linux AppImage: ~15-20 MB
- Linux .deb: ~5-10 MB

## Code Signing Configuration (Maintainers)

### macOS Code Signing and Notarization

AuraShell releases are automatically code-signed and notarized during the GitHub Actions build process.

#### Required GitHub Secrets

The following secrets must be configured in the repository settings:

- `APPLE_CERTIFICATE` - Base64-encoded .p12 Developer ID Application certificate
- `APPLE_CERTIFICATE_PASSWORD` - Password for the .p12 certificate
- `APPLE_ID` - Apple ID email address
- `APPLE_PASSWORD` - App-specific password for notarization
- `APPLE_TEAM_ID` - Apple Developer Team ID
- `KEYCHAIN_PASSWORD` - Random password for temporary CI keychain

#### Setting Up Code Signing

1. **Generate Developer ID Certificate**:
   - Enroll in Apple Developer Program ($99/year)
   - Create a Developer ID Application certificate at developer.apple.com
   - Export as .p12 file from Keychain Access
   - Convert to base64: `base64 -i certificate.p12 | pbcopy`

2. **Create App-Specific Password**:
   - Go to appleid.apple.com → Sign In
   - Generate app-specific password for "AuraShell Notarization"

3. **Configure GitHub Secrets**:
   - Add all required secrets to repository settings
   - Secrets are automatically used by the release workflow

#### Configuration Files

- **Tauri Config**: `src-tauri/tauri.conf.json` - Contains macOS bundle settings
- **CI Workflow**: `.github/workflows/release.yml` - Passes secrets to tauri-action

The `tauri-apps/tauri-action` automatically handles:
- Certificate import to keychain
- Code signing during build
- Notarization submission to Apple
- Stapling notarization ticket to DMG

#### Verifying Code Signature

To verify a signed DMG locally:
```bash
# Check code signature
codesign -dv --verbose=4 /path/to/AuraShell.app

# Check notarization
spctl -a -vv -t install /path/to/AuraShell.app

# Check DMG signature
codesign -dv /path/to/AuraShell.dmg
```
