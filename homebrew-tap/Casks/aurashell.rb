cask "aurashell" do
  arch arm: "aarch64", intel: "x64"

  version "0.1.0"

  url "https://github.com/PrisacariuRobert/AuraShell/releases/download/v#{version}/AuraShell_#{version}_#{arch}.dmg",
      verified: "github.com/PrisacariuRobert/AuraShell/"
  name "AuraShell"
  desc "AI-Powered Terminal"
  homepage "https://github.com/PrisacariuRobert/AuraShell"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "AuraShell.app"

  zap trash: [
    "~/Library/Application Support/com.aurashell.terminal",
    "~/Library/Caches/com.aurashell.terminal",
    "~/Library/Preferences/com.aurashell.terminal.plist",
    "~/Library/Saved Application State/com.aurashell.terminal.savedState",
  ]
end
