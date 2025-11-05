use regex::Regex;
use lazy_static::lazy_static;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct SafetyCheck {
    pub is_safe: bool,
    pub warning: Option<String>,
    pub danger_level: DangerLevel,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub enum DangerLevel {
    Safe,
    Low,
    Medium,
    High,
    Critical,
}

lazy_static! {
    static ref CRITICAL_PATTERNS: Vec<(Regex, &'static str)> = vec![
        (Regex::new(r"(?i)\brm\s+(-rf|--recursive.*--force|-fr)\s+/\s*$").unwrap(),
            "This command will DELETE ALL FILES on your system! This is EXTREMELY DANGEROUS."),
        (Regex::new(r"(?i)\bdd\s+.*of=/dev/(sd[a-z]|disk[0-9])").unwrap(),
            "This command will OVERWRITE AN ENTIRE DISK! All data will be lost."),
        (Regex::new(r"(?i)\bmkfs\b").unwrap(),
            "This command will FORMAT a disk, destroying all data on it."),
        (Regex::new(r"(?i)\b:\(\)\{").unwrap(),
            "This is a FORK BOMB that will crash your system!"),
        (Regex::new(r"(?i)\bchmod\s+(-R\s+)?777\s+/").unwrap(),
            "This will make ALL FILES on your system readable/writable by EVERYONE!"),
    ];

    static ref HIGH_PATTERNS: Vec<(Regex, &'static str)> = vec![
        (Regex::new(r"(?i)\brm\s+(-rf|-fr|--recursive.*--force)\s+").unwrap(),
            "Recursive force delete - this will permanently delete files without confirmation."),
        (Regex::new(r"(?i)\bdd\s+if=").unwrap(),
            "Direct disk operation - can destroy data if used incorrectly."),
        (Regex::new(r"(?i)\b(sudo|su)\s+rm\s+").unwrap(),
            "Deleting files as root can damage your system."),
        (Regex::new(r"(?i)\bchmod\s+000\b").unwrap(),
            "This will make files completely inaccessible, even to you."),
        (Regex::new(r"(?i)>\s*/dev/(sd[a-z]|disk[0-9])").unwrap(),
            "Writing directly to disk devices can corrupt data."),
    ];

    static ref MEDIUM_PATTERNS: Vec<(Regex, &'static str)> = vec![
        (Regex::new(r"(?i)\brm\s+.*\*").unwrap(),
            "Using wildcards with rm can delete more files than intended."),
        (Regex::new(r"(?i)\bkillall\b").unwrap(),
            "This will terminate all processes with the specified name."),
        (Regex::new(r"(?i)\bchmod\s+777\b").unwrap(),
            "This makes files readable/writable by everyone - a security risk."),
        (Regex::new(r"(?i)\bcurl.*\|\s*(bash|sh)").unwrap(),
            "Running downloaded scripts directly is risky - always review them first."),
        (Regex::new(r"(?i)\bwget.*\|\s*(bash|sh)").unwrap(),
            "Running downloaded scripts directly is risky - always review them first."),
    ];

    static ref LOW_PATTERNS: Vec<(Regex, &'static str)> = vec![
        (Regex::new(r"(?i)\bsudo\b").unwrap(),
            "This command requires administrator privileges."),
        (Regex::new(r"(?i)\brm\s+").unwrap(),
            "This will delete files permanently."),
        (Regex::new(r"(?i)\bmv\s+.*\s+/").unwrap(),
            "Moving files to root directory - make sure this is intended."),
    ];
}

fn check_patterns(command: &str, patterns: &[(Regex, &str)]) -> Option<String> {
    for (pattern, message) in patterns.iter() {
        if pattern.is_match(command) {
            return Some(message.to_string());
        }
    }
    None
}

pub fn check_command_safety(command: &str) -> SafetyCheck {
    // Check critical patterns first
    if let Some(warning) = check_patterns(command, &CRITICAL_PATTERNS) {
        return SafetyCheck {
            is_safe: false,
            warning: Some(warning),
            danger_level: DangerLevel::Critical,
        };
    }

    // Check high danger patterns
    if let Some(warning) = check_patterns(command, &HIGH_PATTERNS) {
        return SafetyCheck {
            is_safe: false,
            warning: Some(warning),
            danger_level: DangerLevel::High,
        };
    }

    // Check medium danger patterns
    if let Some(warning) = check_patterns(command, &MEDIUM_PATTERNS) {
        return SafetyCheck {
            is_safe: false,
            warning: Some(warning),
            danger_level: DangerLevel::Medium,
        };
    }

    // Check low danger patterns
    if let Some(warning) = check_patterns(command, &LOW_PATTERNS) {
        return SafetyCheck {
            is_safe: true,
            warning: Some(warning),
            danger_level: DangerLevel::Low,
        };
    }

    // No dangerous patterns detected
    SafetyCheck {
        is_safe: true,
        warning: None,
        danger_level: DangerLevel::Safe,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_critical_commands() {
        let result = check_command_safety("rm -rf /");
        assert_eq!(result.danger_level, DangerLevel::Critical);
        assert!(!result.is_safe);

        let result = check_command_safety("dd if=/dev/zero of=/dev/sda");
        assert_eq!(result.danger_level, DangerLevel::Critical);
    }

    #[test]
    fn test_high_danger_commands() {
        let result = check_command_safety("rm -rf ./node_modules");
        assert_eq!(result.danger_level, DangerLevel::High);
        assert!(!result.is_safe);
    }

    #[test]
    fn test_safe_commands() {
        let result = check_command_safety("ls -la");
        assert_eq!(result.danger_level, DangerLevel::Safe);
        assert!(result.is_safe);

        let result = check_command_safety("echo 'hello world'");
        assert_eq!(result.danger_level, DangerLevel::Safe);
    }
}
