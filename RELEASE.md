# How to Create a Release

This guide explains how to trigger the automated build process that creates downloadable files for macOS and Linux.

## Method 1: Automatic Release (Recommended)

### Step 1: Commit and Push Your Changes
```bash
git add .
git commit -m "Prepare for release"
git push origin main
```

### Step 2: Create and Push a Version Tag
```bash
# Create a new version tag (e.g., v0.1.0)
git tag v0.1.0

# Push the tag to GitHub
git push origin v0.1.0
```

This will automatically:
1. Trigger the GitHub Actions workflow
2. Build for macOS (both Apple Silicon and Intel)
3. Build for Linux (Ubuntu/Debian)
4. Create a draft release on GitHub with all the files
5. Upload build artifacts that you can download

### Step 3: Download the Build Artifacts

After the workflow completes (takes about 10-15 minutes):

1. Go to your GitHub repository
2. Click on **"Actions"** tab
3. Click on the latest **"Release Build"** workflow run
4. Scroll down to **"Artifacts"** section
5. Download all the artifacts:
   - `aurashell-macos-latest---target aarch64-apple-darwin` (macOS Apple Silicon)
   - `aurashell-macos-latest---target x86_64-apple-darwin` (macOS Intel)
   - `aurashell-ubuntu-22.04-default` (Linux)

### Step 4: Extract and Upload to Your Website

Each artifact contains a `bundle/` folder with the installers:

**macOS Apple Silicon:**
- Extract the artifact
- Find: `dmg/AuraShell_0.1.0_aarch64.dmg`

**macOS Intel:**
- Extract the artifact
- Find: `dmg/AuraShell_0.1.0_x64.dmg`

**Linux:**
- Extract the artifact
- Find multiple formats:
  - `deb/aura-shell_0.1.0_amd64.deb` (for Debian/Ubuntu)
  - `appimage/aura-shell_0.1.0_amd64.AppImage` (universal)
  - `rpm/aura-shell-0.1.0-1.x86_64.rpm` (for RHEL/Fedora)

Upload these files to your website's download page!

## Method 2: Manual Trigger

You can also trigger a build manually without creating a tag:

1. Go to your GitHub repository
2. Click on **"Actions"** tab
3. Click on **"Release Build"** workflow
4. Click **"Run workflow"** button
5. Select the branch and click **"Run workflow"**

This is useful for testing builds without creating an official release.

## Publishing the Release

After the workflow completes:

1. Go to **"Releases"** in your GitHub repo
2. You'll see a **draft release** for your tag
3. Edit the release notes if needed
4. Click **"Publish release"** to make it public

The release will include:
- macOS DMG files (Apple Silicon + Intel)
- Linux packages (.deb, .AppImage, .rpm)
- Automatic changelog from commits

## Version Numbering

Follow semantic versioning (semver):
- `v0.1.0` - Initial release
- `v0.1.1` - Bug fixes
- `v0.2.0` - New features
- `v1.0.0` - Major release

## Troubleshooting

### Build fails on macOS
- Check that your code compiles locally first
- Ensure `tauri.conf.json` is properly configured

### Build fails on Linux
- Make sure all dependencies are listed in the workflow
- Test locally with the same Ubuntu version (22.04)

### No artifacts appear
- Check the workflow logs in the Actions tab
- Ensure the build completed successfully
- Artifacts expire after 30 days

## Quick Reference

```bash
# Create a new release
git tag v0.2.0
git push origin v0.2.0

# Delete a tag if you made a mistake
git tag -d v0.2.0                    # Delete locally
git push origin --delete v0.2.0      # Delete on GitHub

# List all tags
git tag -l
```

## File Locations in Artifacts

When you download and extract the artifacts, the installers are located at:

```
aurashell-macos-latest-*/
└── bundle/
    ├── dmg/
    │   └── AuraShell_0.1.0_*.dmg
    └── macos/
        └── AuraShell.app

aurashell-ubuntu-22.04-*/
└── bundle/
    ├── deb/
    │   └── aura-shell_0.1.0_amd64.deb
    ├── appimage/
    │   └── aura-shell_0.1.0_amd64.AppImage
    └── rpm/
        └── aura-shell-0.1.0-1.x86_64.rpm
```

Just extract these files and upload them to your website!
