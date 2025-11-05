use regex::Regex;
use lazy_static::lazy_static;
use std::path::PathBuf;

lazy_static! {
    // File operation commands that need path enhancement
    static ref FILE_OPS: Vec<&'static str> = vec![
        "rm", "mv", "cp", "cat", "open", "vim", "nano", "emacs",
        "less", "more", "head", "tail", "file", "stat", "chmod", "chown"
    ];

    // Pattern to detect file operations
    static ref FILE_OP_PATTERN: Regex = Regex::new(
        r"(?i)^(rm|mv|cp|cat|open|vim|nano|emacs|less|more|head|tail|file|stat|chmod|chown)\s+(.+?)(?:\s+|$)"
    ).unwrap();
}

fn get_search_directories() -> Vec<PathBuf> {
    let mut dirs = Vec::new();

    // Current directory
    if let Ok(current) = std::env::current_dir() {
        dirs.push(current);
    }

    // Home directory
    if let Ok(home) = std::env::var("HOME") {
        let home_path = PathBuf::from(&home);
        dirs.push(home_path.clone());

        // Common subdirectories
        dirs.push(home_path.join("Desktop"));
        dirs.push(home_path.join("Documents"));
        dirs.push(home_path.join("Downloads"));
    }

    dirs
}

fn find_file_in_directories(filename: &str, search_dirs: &[PathBuf]) -> Vec<PathBuf> {
    let mut found_paths = Vec::new();

    // Common file extensions to try if no extension is provided
    let extensions = vec!["", ".png", ".jpg", ".jpeg", ".txt", ".pdf", ".doc", ".docx", ".zip", ".mov", ".mp4"];

    for dir in search_dirs {
        if !dir.exists() {
            continue;
        }

        // Try exact match first
        let potential_path = dir.join(filename);
        if potential_path.exists() {
            if !found_paths.contains(&potential_path) {
                found_paths.push(potential_path);
            }
            continue;
        }

        // If filename doesn't have an extension, try with common extensions
        if !filename.contains('.') {
            for ext in &extensions {
                let filename_with_ext = format!("{}{}", filename, ext);
                let potential_path = dir.join(&filename_with_ext);
                if potential_path.exists() && !found_paths.contains(&potential_path) {
                    found_paths.push(potential_path);
                }
            }
        }

        // Also search one level deep in subdirectories
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                if let Ok(file_type) = entry.file_type() {
                    if file_type.is_dir() {
                        let subdir = entry.path();

                        // Try exact match in subdirectory
                        let potential_path = subdir.join(filename);
                        if potential_path.exists() && !found_paths.contains(&potential_path) {
                            found_paths.push(potential_path);
                        }

                        // Try with extensions in subdirectory
                        if !filename.contains('.') {
                            for ext in &extensions {
                                let filename_with_ext = format!("{}{}", filename, ext);
                                let potential_path = subdir.join(&filename_with_ext);
                                if potential_path.exists() && !found_paths.contains(&potential_path) {
                                    found_paths.push(potential_path);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    found_paths
}

fn extract_filenames_from_command(command: &str) -> Vec<String> {
    let mut filenames = Vec::new();

    // Match file operation patterns
    if let Some(captures) = FILE_OP_PATTERN.captures(command) {
        if let Some(args_match) = captures.get(2) {
            let args = args_match.as_str().trim();

            // Handle quoted strings (e.g., "file name.txt" or 'file name.txt')
            let quoted_pattern = Regex::new(r#"["']([^"']+)["']"#).unwrap();

            // First extract quoted filenames
            for cap in quoted_pattern.captures_iter(args) {
                if let Some(quoted) = cap.get(1) {
                    let filename = quoted.as_str();
                    // Skip if it looks like a path (contains /)
                    if !filename.contains('/') && !filename.is_empty() {
                        filenames.push(filename.to_string());
                    }
                }
            }

            // If no quoted filenames found, try splitting by spaces
            if filenames.is_empty() {
                let parts: Vec<&str> = args.split_whitespace()
                    .filter(|part| !part.starts_with('-'))
                    .collect();

                for part in parts {
                    // Remove quotes if present
                    let cleaned = part.trim_matches('"').trim_matches('\'');
                    // Skip if it looks like a path (contains /)
                    if !cleaned.contains('/') && !cleaned.is_empty() {
                        filenames.push(cleaned.to_string());
                    }
                }
            }
        }
    }

    filenames
}

pub fn enhance_command_with_paths(command: &str) -> Result<String, String> {
    // Check if this is a file operation command
    if !FILE_OPS.iter().any(|&op| command.trim_start().starts_with(op)) {
        return Ok(command.to_string()); // Not a file operation, return as-is
    }

    // Extract filenames from the command
    let filenames = extract_filenames_from_command(command);

    if filenames.is_empty() {
        return Ok(command.to_string()); // No filenames to enhance
    }

    let search_dirs = get_search_directories();
    let mut enhanced_command = command.to_string();

    for filename in filenames {
        // Find all occurrences of this file
        let found_paths = find_file_in_directories(&filename, &search_dirs);

        match found_paths.len() {
            0 => {
                // File not found, leave as-is (might be creating a new file)
                continue;
            }
            1 => {
                // Single match - replace with full path
                let full_path = found_paths[0].to_string_lossy().to_string();

                // Need to quote the path if it contains spaces
                let quoted_path = if full_path.contains(' ') {
                    format!("\"{}\"", full_path)
                } else {
                    full_path.clone()
                };

                // Replace the filename with the full path in the command
                // Handle both quoted and unquoted versions
                if command.contains(&format!("\"{}\"", filename)) {
                    enhanced_command = enhanced_command.replace(&format!("\"{}\"", filename), &quoted_path);
                } else if command.contains(&format!("'{}'", filename)) {
                    enhanced_command = enhanced_command.replace(&format!("'{}'", filename), &quoted_path);
                } else {
                    // Try to replace with word boundaries
                    let pattern = format!(r"\b{}\b", regex::escape(&filename));
                    if let Ok(re) = Regex::new(&pattern) {
                        enhanced_command = re.replace(&enhanced_command, &quoted_path).to_string();
                    }
                }
            }
            _ => {
                // Multiple matches - return error with options
                let paths_list: Vec<String> = found_paths.iter()
                    .map(|p| p.to_string_lossy().to_string())
                    .collect();

                return Err(format!(
                    "Multiple files matching '{}' found:\n{}\n\nPlease specify the full path.",
                    filename,
                    paths_list.join("\n")
                ));
            }
        }
    }

    Ok(enhanced_command)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_filenames() {
        let filenames = extract_filenames_from_command("rm test.txt");
        assert_eq!(filenames, vec!["test.txt"]);

        let filenames = extract_filenames_from_command("rm -rf node_modules");
        assert_eq!(filenames, vec!["node_modules"]);

        let filenames = extract_filenames_from_command("cat file1.txt file2.txt");
        assert_eq!(filenames, vec!["file1.txt", "file2.txt"]);
    }

    #[test]
    fn test_skips_paths() {
        let filenames = extract_filenames_from_command("rm ~/Desktop/test.txt");
        assert!(filenames.is_empty()); // Should skip because it contains /
    }

    #[test]
    fn test_non_file_commands() {
        let result = enhance_command_with_paths("ls -la");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "ls -la");
    }
}
