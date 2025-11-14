# Homebrew Tap for AuraShell

This directory contains the Homebrew Cask formula for AuraShell.

## Setup Instructions

To create the Homebrew tap repository:

### 1. Create a new GitHub repository

1. Go to https://github.com/new
2. Repository name: **`homebrew-aurashell`** (must start with "homebrew-")
3. Description: "Homebrew tap for AuraShell"
4. Make it Public
5. Don't initialize with README (we'll add our own)
6. Click "Create repository"

### 2. Push the tap contents

```bash
# Navigate to this directory
cd homebrew-tap

# Initialize git repository
git init
git add .
git commit -m "Initial commit: Add AuraShell cask formula"

# Add remote and push
git remote add origin https://github.com/PrisacariuRobert/homebrew-aurashell.git
git branch -M main
git push -u origin main
```

### 3. Test the installation

Once the repository is live:

```bash
# Add the tap
brew tap PrisacariuRobert/aurashell

# Install AuraShell
brew install --cask aurashell
```

## Updating the Formula

When you release a new version of AuraShell:

1. Update the `version` in `Casks/aurashell.rb`
2. Commit and push the changes:

```bash
cd homebrew-tap
git add Casks/aurashell.rb
git commit -m "Update to version X.X.X"
git push
```

3. Users can update with:

```bash
brew update
brew upgrade --cask aurashell
```

## Automating Updates

You can automate formula updates in your release workflow by adding a step that:

1. Clones the homebrew-aurashell repository
2. Updates the version number in the cask formula
3. Commits and pushes the changes

Example workflow step:

```yaml
- name: Update Homebrew Cask
  if: matrix.platform == 'macos-latest'
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    # Clone the tap repository
    git clone https://github.com/PrisacariuRobert/homebrew-aurashell.git /tmp/homebrew-aurashell
    cd /tmp/homebrew-aurashell

    # Update version in cask formula
    sed -i '' 's/version ".*"/version "${{ github.ref_name }}"/g' Casks/aurashell.rb

    # Commit and push
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    git add Casks/aurashell.rb
    git commit -m "Update to ${{ github.ref_name }}"
    git push
```

## Formula Structure

The cask formula (`Casks/aurashell.rb`) contains:

- **version**: Current version number
- **arch**: Architecture detection (Apple Silicon vs Intel)
- **url**: Download URL from GitHub Releases
- **name**: Application name
- **desc**: Short description
- **homepage**: Project homepage
- **app**: App bundle to install
- **zap**: Files to remove on uninstall

## Testing Locally

To test changes before pushing:

```bash
# Install from local tap
brew install --cask /path/to/homebrew-tap/Casks/aurashell.rb

# Uninstall
brew uninstall --cask aurashell
```

## User Installation

After the tap is set up, users can install AuraShell with:

```bash
brew tap PrisacariuRobert/aurashell
brew install --cask aurashell
```

## Troubleshooting

### Formula not found

Make sure the repository name starts with `homebrew-` and is public.

### Update not working

Users need to run `brew update` before `brew upgrade --cask aurashell`.

### Checksum errors

If users get checksum errors, the DMG file might have changed. You may need to add SHA256 checksums to the formula.

## More Information

- [Homebrew Cask Documentation](https://docs.brew.sh/Cask-Cookbook)
- [Creating a Tap](https://docs.brew.sh/How-to-Create-and-Maintain-a-Tap)
