use serde::{Deserialize, Serialize};
use std::error::Error;
use regex::Regex;
use lazy_static::lazy_static;

#[derive(Serialize, Debug)]
struct GeminiRequest {
    contents: Vec<Content>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<Vec<Tool>>,
}

#[derive(Serialize, Debug)]
struct Tool {
    #[serde(rename = "googleSearch")]
    google_search: GoogleSearch,
}

#[derive(Serialize, Debug)]
struct GoogleSearch {}

#[derive(Serialize, Debug)]
struct Content {
    parts: Vec<Part>,
}

#[derive(Serialize, Debug)]
#[serde(untagged)]
enum Part {
    Text { text: String },
}

#[derive(Deserialize, Debug)]
struct GeminiResponse {
    candidates: Vec<Candidate>,
}

#[derive(Deserialize, Debug)]
struct Candidate {
    content: ContentResponse,
    #[serde(rename = "groundingMetadata")]
    grounding_metadata: Option<GroundingMetadata>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GroundingMetadata {
    #[serde(rename = "webSearchQueries")]
    pub web_search_queries: Option<Vec<String>>,
    #[serde(rename = "groundingChunks")]
    pub grounding_chunks: Option<Vec<GroundingChunk>>,
    #[serde(rename = "groundingSupports")]
    pub grounding_supports: Option<Vec<GroundingSupport>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GroundingChunk {
    pub web: Option<WebChunk>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WebChunk {
    pub uri: String,
    pub title: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GroundingSupport {
    pub segment: Option<TextSegment>,
    #[serde(rename = "groundingChunkIndices")]
    pub grounding_chunk_indices: Option<Vec<usize>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TextSegment {
    #[serde(rename = "startIndex")]
    pub start_index: usize,
    #[serde(rename = "endIndex")]
    pub end_index: usize,
    pub text: String,
}

#[derive(Deserialize, Debug)]
struct ContentResponse {
    parts: Vec<PartResponse>,
}

#[derive(Deserialize, Debug)]
struct PartResponse {
    text: String,
}

lazy_static! {
    static ref SIMPLE_COMMAND_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)^(cd|ls|pwd|mkdir|rm|cp|mv|cat|echo|touch|clear|exit|open)(\s|$)").unwrap(),
        Regex::new(r"(?i)^(list|show|display|view)(\s+files|\s+directories|\s+folder)").unwrap(),
        Regex::new(r"(?i)^(go\s+to|navigate\s+to|change\s+to)").unwrap(),
        Regex::new(r"(?i)^open\s+\w+").unwrap(), // "open [app name]"
    ];

    static ref INSTALL_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)\b(install|download|setup|get|add)\s+").unwrap(),
        Regex::new(r"(?i)\bhow\s+to\s+(install|setup|configure)").unwrap(),
        Regex::new(r"(?i)\bneed\s+(to\s+)?(install|download|setup)").unwrap(),
    ];

    static ref PACKAGE_MANAGERS: Vec<PackageManager> = vec![
        PackageManager {
            name: "brew",
            pattern: Regex::new(r"(?i)brew\s+install\s+([a-zA-Z0-9_\-@/\.]+(?:\s+[a-zA-Z0-9_\-@/\.]+)*)").unwrap(),
        },
        PackageManager {
            name: "apt",
            pattern: Regex::new(r"(?i)(?:sudo\s+)?apt(?:-get)?\s+install\s+(?:-y\s+)?([a-zA-Z0-9_\-@/\.]+(?:\s+[a-zA-Z0-9_\-@/\.]+)*)").unwrap(),
        },
        PackageManager {
            name: "yum",
            pattern: Regex::new(r"(?i)(?:sudo\s+)?yum\s+install\s+(?:-y\s+)?([a-zA-Z0-9_\-@/\.]+(?:\s+[a-zA-Z0-9_\-@/\.]+)*)").unwrap(),
        },
        PackageManager {
            name: "dnf",
            pattern: Regex::new(r"(?i)(?:sudo\s+)?dnf\s+install\s+(?:-y\s+)?([a-zA-Z0-9_\-@/\.]+(?:\s+[a-zA-Z0-9_\-@/\.]+)*)").unwrap(),
        },
        PackageManager {
            name: "pacman",
            pattern: Regex::new(r"(?i)(?:sudo\s+)?pacman\s+-S\s+([a-zA-Z0-9_\-@/\.]+(?:\s+[a-zA-Z0-9_\-@/\.]+)*)").unwrap(),
        },
        PackageManager {
            name: "winget",
            pattern: Regex::new(r"(?i)winget\s+install\s+(?:--id\s+)?([a-zA-Z0-9_\-@/\.]+(?:\s+[a-zA-Z0-9_\-@/\.]+)*)").unwrap(),
        },
        PackageManager {
            name: "choco",
            pattern: Regex::new(r"(?i)choco\s+install\s+(?:-y\s+)?([a-zA-Z0-9_\-@/\.]+(?:\s+[a-zA-Z0-9_\-@/\.]+)*)").unwrap(),
        },
        PackageManager {
            name: "npm",
            pattern: Regex::new(r"(?i)npm\s+install\s+(?:-g\s+)?([a-zA-Z0-9_\-@/\.]+(?:\s+[a-zA-Z0-9_\-@/\.]+)*)").unwrap(),
        },
        PackageManager {
            name: "pip",
            pattern: Regex::new(r"(?i)pip(?:3)?\s+install\s+([a-zA-Z0-9_\-@/\.]+(?:\s+[a-zA-Z0-9_\-@/\.]+)*)").unwrap(),
        },
        PackageManager {
            name: "cargo",
            pattern: Regex::new(r"(?i)cargo\s+install\s+([a-zA-Z0-9_\-@/\.]+(?:\s+[a-zA-Z0-9_\-@/\.]+)*)").unwrap(),
        },
    ];
}

struct PackageManager {
    name: &'static str,
    pattern: Regex,
}

fn normalize_package_name(name: &str) -> String {
    // Replace spaces with hyphens for multi-word packages
    // e.g., "qwen code" -> "qwen-code"
    name.trim().replace(' ', "-")
}

pub fn should_use_web_search_for_input(user_input: &str) -> bool {
    // Check if it's a simple command that doesn't need web search
    for pattern in SIMPLE_COMMAND_PATTERNS.iter() {
        if pattern.is_match(user_input) {
            return false; // Simple command, no web search needed
        }
    }

    // Default: ALWAYS use web search for everything else
    true
}

fn detect_package_command(command: &str) -> Option<(String, String, String)> {
    for pm in PACKAGE_MANAGERS.iter() {
        if let Some(captures) = pm.pattern.captures(command) {
            if let Some(package_match) = captures.get(1) {
                let package_name = normalize_package_name(package_match.as_str());
                return Some((
                    pm.name.to_string(),
                    package_name.clone(),
                    command.to_string(),
                ));
            }
        }
    }
    None
}

#[cfg(target_os = "macos")]
fn check_package_installed(manager: &str, package: &str) -> bool {
    use std::process::Command;

    match manager {
        "brew" => {
            Command::new("brew")
                .args(&["list", package])
                .output()
                .map(|output| output.status.success())
                .unwrap_or(false)
        }
        "npm" => {
            Command::new("npm")
                .args(&["list", "-g", package])
                .output()
                .map(|output| output.status.success())
                .unwrap_or(false)
        }
        "pip" => {
            Command::new("pip3")
                .args(&["show", package])
                .output()
                .map(|output| output.status.success())
                .unwrap_or(false)
        }
        "cargo" => {
            // Check if binary exists in cargo bin
            let home = std::env::var("HOME").unwrap_or_default();
            let cargo_bin = format!("{}/.cargo/bin/{}", home, package);
            std::path::Path::new(&cargo_bin).exists()
        }
        _ => false,
    }
}

#[cfg(target_os = "linux")]
fn check_package_installed(manager: &str, package: &str) -> bool {
    use std::process::Command;

    match manager {
        "apt" => {
            Command::new("dpkg")
                .args(&["-s", package])
                .output()
                .map(|output| output.status.success())
                .unwrap_or(false)
        }
        "yum" | "dnf" => {
            Command::new("rpm")
                .args(&["-q", package])
                .output()
                .map(|output| output.status.success())
                .unwrap_or(false)
        }
        "pacman" => {
            Command::new("pacman")
                .args(&["-Q", package])
                .output()
                .map(|output| output.status.success())
                .unwrap_or(false)
        }
        "npm" => {
            Command::new("npm")
                .args(&["list", "-g", package])
                .output()
                .map(|output| output.status.success())
                .unwrap_or(false)
        }
        "pip" => {
            Command::new("pip3")
                .args(&["show", package])
                .output()
                .map(|output| output.status.success())
                .unwrap_or(false)
        }
        "cargo" => {
            let home = std::env::var("HOME").unwrap_or_default();
            let cargo_bin = format!("{}/.cargo/bin/{}", home, package);
            std::path::Path::new(&cargo_bin).exists()
        }
        _ => false,
    }
}

#[cfg(target_os = "windows")]
fn check_package_installed(manager: &str, package: &str) -> bool {
    use std::process::Command;

    match manager {
        "winget" => {
            Command::new("winget")
                .args(&["list", "--id", package])
                .output()
                .map(|output| output.status.success() &&
                    String::from_utf8_lossy(&output.stdout).contains(package))
                .unwrap_or(false)
        }
        "choco" => {
            Command::new("choco")
                .args(&["list", "--local-only", package])
                .output()
                .map(|output| output.status.success() &&
                    String::from_utf8_lossy(&output.stdout).contains(package))
                .unwrap_or(false)
        }
        "npm" => {
            Command::new("npm")
                .args(&["list", "-g", package])
                .output()
                .map(|output| output.status.success())
                .unwrap_or(false)
        }
        "pip" => {
            Command::new("pip")
                .args(&["show", package])
                .output()
                .map(|output| output.status.success())
                .unwrap_or(false)
        }
        "cargo" => {
            let userprofile = std::env::var("USERPROFILE").unwrap_or_default();
            let cargo_bin = format!("{}/.cargo/bin/{}.exe", userprofile, package);
            std::path::Path::new(&cargo_bin).exists()
        }
        _ => false,
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TranslationResult {
    pub command: String,
    pub grounding_metadata: Option<GroundingMetadata>,
}

pub async fn translate_to_shell_command(
    user_input: &str,
    use_web_search: bool,
    conversation_history: Option<&str>,
    os_info: Option<&str>,
) -> Result<TranslationResult, Box<dyn Error + Send + Sync>> {
    dotenvy::dotenv().ok();

    let api_key = std::env::var("GEMINI_API_KEY")
        .unwrap_or_else(|_| "AIzaSyCnVi34Wd_fKoqW2m3TqJ9sSGVVdK_7F6w".to_string());

    let model = if use_web_search {
        "gemini-2.5-flash"
    } else {
        "gemini-2.5-flash-lite"
    };

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );

    let os_context = os_info.unwrap_or("Operating System: Unknown\nPrimary Package Manager: unknown\nShell: bash");

    let mut prompt = if let Some(history) = conversation_history {
        format!(
            "You are an expert in shell commands. \
            Your task is to translate the following natural language request into a single, \
            executable shell command for the user's specific operating system.\n\n\
            USER'S SYSTEM:\n\
            {}\n\n\
            IMPORTANT RULES:\n\
            1. Return ONLY the shell command, no explanations or markdown formatting\n\
            2. Do not wrap the command in code blocks or backticks\n\
            3. Do not include any introductory text like 'Here is the command:'\n\
            4. For multi-word package names (e.g., 'qwen code'), use hyphens (e.g., 'qwen-code')\n\
            5. ALWAYS use the Primary Package Manager listed above for installation commands\n\
            6. If the request is vague or could be dangerous, return a safe alternative\n\
            7. Use the conversation history to understand context (e.g., 'open it' means open the app mentioned before)\n\n\
            Recent conversation:\n\
            {}\n\n\
            New request: {}\n\
            Command:",
            os_context, history, user_input
        )
    } else {
        format!(
            "You are an expert in shell commands. \
            Your task is to translate the following natural language request into a single, \
            executable shell command for the user's specific operating system.\n\n\
            USER'S SYSTEM:\n\
            {}\n\n\
            IMPORTANT RULES:\n\
            1. Return ONLY the shell command, no explanations or markdown formatting\n\
            2. Do not wrap the command in code blocks or backticks\n\
            3. Do not include any introductory text like 'Here is the command:'\n\
            4. For multi-word package names (e.g., 'qwen code'), use hyphens (e.g., 'qwen-code')\n\
            5. ALWAYS use the Primary Package Manager listed above for installation commands\n\
            6. If the request is vague or could be dangerous, return a safe alternative\n\n\
            Request: {}\n\
            Command:",
            os_context, user_input
        )
    };

    if use_web_search {
        prompt.push_str("\n\nNote: You have access to web search. Use it to find the most up-to-date and accurate command for this request.");
    }

    let client = reqwest::Client::new();
    let gemini_request = GeminiRequest {
        contents: vec![Content {
            parts: vec![Part::Text { text: prompt }],
        }],
        tools: if use_web_search {
            Some(vec![Tool {
                google_search: GoogleSearch {},
            }])
        } else {
            None
        },
    };

    let res = client
        .post(&url)
        .json(&gemini_request)
        .send()
        .await?;

    if res.status().is_success() {
        let gemini_response = res.json::<GeminiResponse>().await?;
        if let Some(candidate) = gemini_response.candidates.get(0) {
            if let Some(part) = candidate.content.parts.get(0) {
                let mut command = part.text.trim().to_string();

                // Remove markdown code blocks if present
                if command.starts_with("```") {
                    command = command
                        .lines()
                        .skip(1)
                        .take_while(|line| !line.starts_with("```"))
                        .collect::<Vec<_>>()
                        .join("\n")
                        .trim()
                        .to_string();
                }

                // Remove backticks
                command = command.replace('`', "");

                // Extract grounding metadata
                let grounding_metadata = candidate.grounding_metadata.clone();

                // Check if this is a package installation command
                if let Some((manager, package, _)) = detect_package_command(&command) {
                    // Check if package is already installed
                    if !check_package_installed(&manager, &package) {
                        // Package not installed, proceed with installation
                        return Ok(TranslationResult {
                            command,
                            grounding_metadata,
                        });
                    } else {
                        // Package already installed
                        return Err(format!(
                            "Package '{}' is already installed via {}",
                            package, manager
                        )
                        .into());
                    }
                }

                return Ok(TranslationResult {
                    command,
                    grounding_metadata,
                });
            }
        }
    }

    Err("Failed to get a response from the AI".into())
}
