# Setting Up Downloads for Your Website

Your website is now configured with automatic download links! Here's how it all works and what you need to do.

## How It Works

### 1. **Smart OS Detection**
The website automatically detects what operating system your visitor is using:
- **macOS users** → See "Download for macOS (Apple Silicon)" or "Download for macOS (Intel)"
- **Linux users** → See "Download for Linux"
- **Windows users** → See fallback to macOS (since Windows isn't supported yet)

### 2. **Download Links**
All download links point to your GitHub releases:
```
https://github.com/PrisacariuRobert/AuraShell/releases/latest/download/[filename]
```

This means:
- Files are hosted on GitHub (free!)
- Always downloads the latest version automatically
- No need to update website when you release new versions (just keep the same filenames)

## Getting Your First Downloads Ready

### Step 1: Wait for GitHub Actions to Complete

The build you triggered is currently running at:
```
https://github.com/PrisacariuRobert/AuraShell/actions
```

Wait about 10-15 minutes for all builds to finish.

### Step 2: Download the Artifacts

1. Go to **Actions** tab on GitHub
2. Click the latest **"Release Build"** workflow
3. Scroll to **Artifacts** section
4. Download all three artifacts:
   - `aurashell-macos-latest---target aarch64-apple-darwin`
   - `aurashell-macos-latest---target x86_64-apple-darwin`
   - `aurashell-ubuntu-22.04-default`

### Step 3: Extract the Installers

Extract each ZIP file and find the installers:

**macOS Apple Silicon:**
```
bundle/dmg/AuraShell_0.1.0_aarch64.dmg
```

**macOS Intel:**
```
bundle/dmg/AuraShell_0.1.0_x64.dmg
```

**Linux:**
```
bundle/deb/aura-shell_0.1.0_amd64.deb
bundle/appimage/aura-shell_0.1.0_amd64.AppImage
```

### Step 4: Create GitHub Release

1. Go to your repository → **Releases** → Click the **draft release** created by the workflow
2. You'll see it's already created with the tag `v0.1.0`
3. The release is in **draft** mode

**Upload the files:**
1. Click **Edit** on the draft release
2. Drag and drop these files into the release:
   - `AuraShell_0.1.0_aarch64.dmg`
   - `AuraShell_0.1.0_x64.dmg`
   - `aura-shell_0.1.0_amd64.deb`
   - `aura-shell_0.1.0_amd64.AppImage`

3. Edit the release notes (optional)
4. Click **Publish release**

### Step 5: Test Your Website Downloads

Once published, visit your website and click any download button. The files will download directly from GitHub!

## File Naming is Important!

The website expects these exact filenames:
- `AuraShell_0.1.0_aarch64.dmg` (macOS Apple Silicon)
- `AuraShell_0.1.0_x64.dmg` (macOS Intel)
- `aura-shell_0.1.0_amd64.deb` (Linux Debian)
- `aura-shell_0.1.0_amd64.AppImage` (Linux Universal)

If you change version numbers, update these in:
- [website/index.html](website/index.html) - The download links
- [website/script.js](website/script.js) - The auto-detect URLs

## For Future Releases

When you release `v0.2.0`, the GitHub Actions workflow will create these files automatically. Then:

1. **Option A: Keep Same Filenames (Recommended)**
   - Rename the new files to `AuraShell_0.1.0_*` in the release
   - Website continues to work without changes
   - The `/releases/latest/download/` URL always serves newest version

2. **Option B: Update Version Numbers**
   - Update filenames in `website/index.html` and `website/script.js`
   - Commit and deploy website changes
   - More accurate versioning

## Website Deployment

Your website (`website/` folder) needs to be hosted somewhere. Popular options:

### GitHub Pages (Free)
1. Go to repository **Settings** → **Pages**
2. Select **Deploy from a branch**
3. Choose **main** branch, **/ (root)** folder
4. Wait a few minutes
5. Your site will be at `https://prisacariurobert.github.io/AuraShell/website/`

### Netlify/Vercel (Free)
1. Sign up at netlify.com or vercel.com
2. Import your GitHub repository
3. Set build directory to `website/`
4. Deploy!

### Custom Domain
Once deployed, you can add a custom domain like `aurashell.com` in the hosting provider's settings.

## Testing Locally

To test your website locally:

```bash
cd website
python3 -m http.server 8000
```

Then visit: `http://localhost:8000`

## Download Link Format

All links use this format:
```
https://github.com/[username]/[repo]/releases/latest/download/[filename]
```

This is great because:
- Always points to latest release
- No CDN needed
- Free bandwidth from GitHub
- Reliable hosting

## Summary

✅ **Website is ready** with smart OS detection
✅ **Download links configured** for all platforms
✅ **GitHub Actions workflow** builds everything automatically
⏳ **Next step:** Wait for builds, then publish the GitHub release

Once you publish the release on GitHub, all the download buttons on your website will work automatically!
