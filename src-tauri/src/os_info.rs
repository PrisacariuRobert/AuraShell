use serde::Serialize;
use std::process::Command;

#[derive(Debug, Clone, Serialize)]
pub struct OsInfo {
    pub os_type: String,
    pub os_name: String,
    pub package_manager: String,
    pub shell: String,
}

impl OsInfo {
    pub fn detect() -> Self {
        let os_type = Self::detect_os_type();
        let os_name = Self::detect_os_name(&os_type);
        let package_manager = Self::detect_package_manager(&os_type);
        let shell = Self::detect_shell();

        OsInfo {
            os_type,
            os_name,
            package_manager,
            shell,
        }
    }

    fn detect_os_type() -> String {
        if cfg!(target_os = "macos") {
            "macOS".to_string()
        } else if cfg!(target_os = "linux") {
            "Linux".to_string()
        } else if cfg!(target_os = "windows") {
            "Windows".to_string()
        } else {
            "Unknown".to_string()
        }
    }

    fn detect_os_name(os_type: &str) -> String {
        match os_type {
            "macOS" => {
                // Try to get macOS version
                if let Ok(output) = Command::new("sw_vers")
                    .arg("-productVersion")
                    .output()
                {
                    if output.status.success() {
                        let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                        return format!("macOS {}", version);
                    }
                }
                "macOS".to_string()
            }
            "Linux" => {
                // Try to detect Linux distribution
                if let Ok(output) = Command::new("sh")
                    .arg("-c")
                    .arg("cat /etc/os-release | grep '^NAME=' | cut -d'=' -f2 | tr -d '\"'")
                    .output()
                {
                    if output.status.success() {
                        let distro = String::from_utf8_lossy(&output.stdout).trim().to_string();
                        if !distro.is_empty() {
                            return distro;
                        }
                    }
                }
                "Linux".to_string()
            }
            "Windows" => {
                // Try to get Windows version
                if let Ok(output) = Command::new("cmd")
                    .args(&["/C", "ver"])
                    .output()
                {
                    if output.status.success() {
                        let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                        if version.contains("Windows") {
                            return version;
                        }
                    }
                }
                "Windows".to_string()
            }
            _ => "Unknown".to_string(),
        }
    }

    fn detect_package_manager(os_type: &str) -> String {
        match os_type {
            "macOS" => {
                // Check if brew is installed
                if Command::new("which")
                    .arg("brew")
                    .output()
                    .map(|o| o.status.success())
                    .unwrap_or(false)
                {
                    return "brew".to_string();
                }
                "brew".to_string() // Default to brew even if not installed
            }
            "Linux" => {
                // Check for various Linux package managers
                if Self::command_exists("apt") {
                    "apt".to_string()
                } else if Self::command_exists("dnf") {
                    "dnf".to_string()
                } else if Self::command_exists("yum") {
                    "yum".to_string()
                } else if Self::command_exists("pacman") {
                    "pacman".to_string()
                } else if Self::command_exists("zypper") {
                    "zypper".to_string()
                } else {
                    "apt".to_string() // Default to apt
                }
            }
            "Windows" => {
                // Check for Windows package managers
                if Self::command_exists("winget") {
                    "winget".to_string()
                } else if Self::command_exists("choco") {
                    "choco".to_string()
                } else {
                    "winget".to_string() // Default to winget
                }
            }
            _ => "unknown".to_string(),
        }
    }

    fn detect_shell() -> String {
        // Try to get shell from SHELL environment variable
        if let Ok(shell) = std::env::var("SHELL") {
            if let Some(shell_name) = shell.split('/').last() {
                return shell_name.to_string();
            }
        }

        // Fallback based on OS
        if cfg!(target_os = "windows") {
            if Self::command_exists("pwsh") {
                "PowerShell".to_string()
            } else {
                "cmd".to_string()
            }
        } else if cfg!(target_os = "macos") {
            "zsh".to_string() // Default for modern macOS
        } else {
            "bash".to_string() // Default for Linux
        }
    }

    fn command_exists(cmd: &str) -> bool {
        #[cfg(unix)]
        {
            Command::new("which")
                .arg(cmd)
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false)
        }

        #[cfg(windows)]
        {
            Command::new("where")
                .arg(cmd)
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false)
        }
    }

    pub fn format_for_prompt(&self) -> String {
        format!(
            "Operating System: {}\nPrimary Package Manager: {}\nShell: {}",
            self.os_name, self.package_manager, self.shell
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_os_detection() {
        let os_info = OsInfo::detect();
        assert!(!os_info.os_type.is_empty());
        assert!(!os_info.package_manager.is_empty());
        assert!(!os_info.shell.is_empty());
    }
}
