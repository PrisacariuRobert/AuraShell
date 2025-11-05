use regex::Regex;
use lazy_static::lazy_static;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct ErrorAnalysis {
    pub error_type: String,
    pub suggestion: String,
    pub auto_fix_command: Option<String>,
}

lazy_static! {
    static ref ERROR_PATTERNS: Vec<(Regex, &'static str, &'static str, Option<&'static str>)> = vec![
        // Command not found errors
        (
            Regex::new(r"(?i)(command not found|is not recognized|no such file or directory):\s*(\S+)").unwrap(),
            "Command Not Found",
            "The command doesn't exist or isn't installed on your system.",
            None
        ),
        (
            Regex::new(r"(?i)zsh: command not found: (\S+)").unwrap(),
            "Command Not Found",
            "The command doesn't exist. You may need to install it first.",
            None
        ),

        // Permission denied errors
        (
            Regex::new(r"(?i)permission denied").unwrap(),
            "Permission Denied",
            "You don't have permission to execute this operation. Try using 'sudo' if appropriate.",
            None
        ),

        // File/Directory not found
        (
            Regex::new(r"(?i)no such file or directory").unwrap(),
            "File Not Found",
            "The specified file or directory doesn't exist. Check the path and try again.",
            None
        ),

        // Network/Connection errors
        (
            Regex::new(r"(?i)(could not resolve host|name or service not known|connection refused)").unwrap(),
            "Network Error",
            "Unable to connect to the server. Check your internet connection and the URL.",
            None
        ),

        // npm errors
        (
            Regex::new(r"(?i)npm ERR.*ENOENT").unwrap(),
            "NPM Error",
            "npm couldn't find a required file. Try running 'npm install' first.",
            Some("npm install")
        ),
        (
            Regex::new(r"(?i)npm ERR.*EACCES").unwrap(),
            "NPM Permission Error",
            "Permission error with npm. Try using 'sudo npm install -g' for global packages.",
            None
        ),

        // Python errors
        (
            Regex::new(r"(?i)ModuleNotFoundError").unwrap(),
            "Python Module Not Found",
            "Required Python module is missing. Install it using 'pip install <module-name>'.",
            None
        ),
        (
            Regex::new(r"(?i)No module named '(\S+)'").unwrap(),
            "Python Module Not Found",
            "Missing Python module. Try: pip install $1",
            None
        ),

        // Git errors
        (
            Regex::new(r"(?i)fatal: not a git repository").unwrap(),
            "Git Error",
            "This directory is not a git repository. Initialize one with 'git init'.",
            Some("git init")
        ),
        (
            Regex::new(r"(?i)fatal: remote .* already exists").unwrap(),
            "Git Error",
            "A remote with this name already exists. Use 'git remote -v' to see existing remotes.",
            Some("git remote -v")
        ),

        // Disk space errors
        (
            Regex::new(r"(?i)(no space left on device|disk full)").unwrap(),
            "Disk Space Error",
            "Your disk is full. Free up space by removing unnecessary files.",
            None
        ),

        // Port already in use
        (
            Regex::new(r"(?i)(address already in use|port.*already in use|EADDRINUSE)").unwrap(),
            "Port In Use",
            "The port is already being used by another process. Stop that process or use a different port.",
            None
        ),

        // Package manager errors
        (
            Regex::new(r"(?i)E: Unable to locate package (\S+)").unwrap(),
            "Package Not Found",
            "The package doesn't exist in the repository. Check the package name or update package lists.",
            Some("sudo apt update")
        ),
    ];
}

pub fn analyze_error(error_output: &str) -> Option<ErrorAnalysis> {
    for (pattern, error_type, suggestion, auto_fix) in ERROR_PATTERNS.iter() {
        if pattern.is_match(error_output) {
            return Some(ErrorAnalysis {
                error_type: error_type.to_string(),
                suggestion: suggestion.to_string(),
                auto_fix_command: auto_fix.map(|s| s.to_string()),
            });
        }
    }

    // If no specific pattern matched, return a generic analysis
    if !error_output.is_empty() && error_output.to_lowercase().contains("error") {
        return Some(ErrorAnalysis {
            error_type: "Unknown Error".to_string(),
            suggestion: "An error occurred. Review the output above for details.".to_string(),
            auto_fix_command: None,
        });
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_command_not_found() {
        let result = analyze_error("zsh: command not found: foo");
        assert!(result.is_some());
        assert_eq!(result.unwrap().error_type, "Command Not Found");
    }

    #[test]
    fn test_permission_denied() {
        let result = analyze_error("permission denied");
        assert!(result.is_some());
        assert_eq!(result.unwrap().error_type, "Permission Denied");
    }

    #[test]
    fn test_npm_error() {
        let result = analyze_error("npm ERR! code ENOENT");
        assert!(result.is_some());
        let analysis = result.unwrap();
        assert_eq!(analysis.error_type, "NPM Error");
        assert_eq!(analysis.auto_fix_command, Some("npm install".to_string()));
    }

    #[test]
    fn test_no_error() {
        let result = analyze_error("Everything is fine");
        assert!(result.is_none());
    }
}
