use regex::Regex;
use lazy_static::lazy_static;

#[derive(Debug, Clone, PartialEq)]
pub enum CommandType {
    Installation,
    Navigation,
    FileOperation,
    SystemInfo,
    NetworkOperation,
    ProcessManagement,
    PackageManagement,
    Git,
    Search,
    Text,
    Permission,
    Archive,
    Download,
    Unknown,
}

lazy_static! {
    static ref INSTALLATION_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)\b(brew|apt|apt-get|yum|dnf|pacman|npm|pip|pip3|cargo|gem)\s+install\b").unwrap(),
        Regex::new(r"(?i)\bcurl.*\|\s*bash\b").unwrap(),
        Regex::new(r"(?i)\bwget.*\|\s*sh\b").unwrap(),
    ];

    static ref NAVIGATION_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)^\s*cd\s+").unwrap(),
        Regex::new(r"(?i)^\s*pwd\s*$").unwrap(),
        Regex::new(r"(?i)^\s*ls\b").unwrap(),
        Regex::new(r"(?i)^\s*dir\b").unwrap(),
    ];

    static ref FILE_OPERATION_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)^\s*(cp|mv|rm|mkdir|rmdir|touch|cat|more|less|head|tail|nano|vim|vi|emacs)\b").unwrap(),
        Regex::new(r"(?i)^\s*(find|locate)\b").unwrap(),
    ];

    static ref SYSTEM_INFO_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)^\s*(uname|hostname|whoami|date|uptime|df|du|free|top|htop|ps|lscpu|lsblk)\b").unwrap(),
        Regex::new(r"(?i)^\s*system_profiler\b").unwrap(),
    ];

    static ref NETWORK_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)^\s*(ping|traceroute|netstat|ifconfig|ip|nslookup|dig|host|curl|wget|ssh|scp|ftp|telnet)\b").unwrap(),
    ];

    static ref PROCESS_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)^\s*(kill|killall|pkill|bg|fg|jobs|nohup)\b").unwrap(),
    ];

    static ref PACKAGE_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)^\s*(brew|apt|apt-get|yum|dnf|pacman|npm|pip|pip3|cargo|gem)\s+(list|search|update|upgrade|remove|uninstall)\b").unwrap(),
    ];

    static ref GIT_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)^\s*git\s+").unwrap(),
    ];

    static ref SEARCH_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)^\s*(grep|ack|ag|rg|find)\b").unwrap(),
    ];

    static ref TEXT_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)^\s*(echo|printf|sed|awk|cut|sort|uniq|wc|tr)\b").unwrap(),
    ];

    static ref PERMISSION_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)^\s*(chmod|chown|chgrp|sudo|su)\b").unwrap(),
    ];

    static ref ARCHIVE_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)^\s*(tar|zip|unzip|gzip|gunzip|bzip2|bunzip2|7z)\b").unwrap(),
    ];

    static ref DOWNLOAD_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)^\s*(curl|wget)\s+").unwrap(),
    ];
}

fn matches_any(command: &str, patterns: &[Regex]) -> bool {
    patterns.iter().any(|pattern| pattern.is_match(command))
}

pub fn detect_command_type(command: &str) -> CommandType {
    if matches_any(command, &INSTALLATION_PATTERNS) {
        return CommandType::Installation;
    }

    if matches_any(command, &NAVIGATION_PATTERNS) {
        return CommandType::Navigation;
    }

    if matches_any(command, &FILE_OPERATION_PATTERNS) {
        return CommandType::FileOperation;
    }

    if matches_any(command, &SYSTEM_INFO_PATTERNS) {
        return CommandType::SystemInfo;
    }

    if matches_any(command, &NETWORK_PATTERNS) {
        return CommandType::NetworkOperation;
    }

    if matches_any(command, &PROCESS_PATTERNS) {
        return CommandType::ProcessManagement;
    }

    if matches_any(command, &PACKAGE_PATTERNS) {
        return CommandType::PackageManagement;
    }

    if matches_any(command, &GIT_PATTERNS) {
        return CommandType::Git;
    }

    if matches_any(command, &SEARCH_PATTERNS) {
        return CommandType::Search;
    }

    if matches_any(command, &TEXT_PATTERNS) {
        return CommandType::Text;
    }

    if matches_any(command, &PERMISSION_PATTERNS) {
        return CommandType::Permission;
    }

    if matches_any(command, &ARCHIVE_PATTERNS) {
        return CommandType::Archive;
    }

    if matches_any(command, &DOWNLOAD_PATTERNS) {
        return CommandType::Download;
    }

    CommandType::Unknown
}

pub fn should_use_web_search(command_type: &CommandType) -> bool {
    matches!(
        command_type,
        CommandType::Installation | CommandType::PackageManagement | CommandType::Unknown
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_installation_detection() {
        assert_eq!(
            detect_command_type("brew install node"),
            CommandType::Installation
        );
        assert_eq!(
            detect_command_type("sudo apt-get install vim"),
            CommandType::Installation
        );
        assert_eq!(
            detect_command_type("npm install -g typescript"),
            CommandType::Installation
        );
    }

    #[test]
    fn test_navigation_detection() {
        assert_eq!(detect_command_type("cd /home/user"), CommandType::Navigation);
        assert_eq!(detect_command_type("ls -la"), CommandType::Navigation);
        assert_eq!(detect_command_type("pwd"), CommandType::Navigation);
    }

    #[test]
    fn test_git_detection() {
        assert_eq!(detect_command_type("git status"), CommandType::Git);
        assert_eq!(detect_command_type("git commit -m 'test'"), CommandType::Git);
    }

    #[test]
    fn test_web_search_decision() {
        assert!(should_use_web_search(&CommandType::Installation));
        assert!(should_use_web_search(&CommandType::PackageManagement));
        assert!(!should_use_web_search(&CommandType::Navigation));
        assert!(!should_use_web_search(&CommandType::Git));
    }
}
