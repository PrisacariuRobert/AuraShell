mod ai_translator;
mod command_detector;
mod command_executor;
mod error_analyzer;
mod file_locator;
mod safety;
mod system_monitor;

use serde::Serialize;
use std::sync::Mutex;
use tauri::State;

struct AppState {
    pid: Option<u32>,
}

#[derive(Serialize)]
struct ExecutionResponse {
    output: String,
    error: Option<String>,
    exit_code: i32,
    command_run: String,
    needs_confirmation: bool,
    was_natural_language: bool,
    current_dir: String,
    error_analysis: Option<error_analyzer::ErrorAnalysis>,
    suggested_fix: Option<String>,
    safety_check: Option<safety::SafetyCheck>,
}

#[tauri::command]
async fn translate_command(
    user_input: String,
    conversation_history: Option<String>,
) -> Result<String, String> {
    // Use smart intent classifier to determine if web search is needed
    let use_web_search = ai_translator::should_use_web_search_for_input(&user_input);

    // Translate only once with the appropriate settings
    let command = ai_translator::translate_to_shell_command(
        &user_input,
        use_web_search,
        conversation_history.as_deref(),
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(command)
}

#[tauri::command]
async fn execute_command_with_confirmation<R: tauri::Runtime>(
    command: String,
    app_handle: tauri::AppHandle<R>,
    state: State<'_, Mutex<AppState>>,
) -> Result<String, String> {
    // Execute the command with streaming
    let (result, pid) = command_executor::execute_shell_command_streaming(&command, &app_handle)
        .await
        .map_err(|e| format!("Execution error: {}", e))?;

    // Store the PID for potential termination
    if let Some(process_pid) = pid {
        state.lock().unwrap().pid = Some(process_pid);
    }

    // Check for errors and analyze
    if result.exit_code != 0 {
        let error_output = if !result.stderr.is_empty() {
            &result.stderr
        } else {
            &result.stdout
        };

        if let Some(analysis) = error_analyzer::analyze_error(error_output) {
            let error_msg = format!(
                "Command failed with exit code {}\n\nError: {}\nSuggestion: {}{}",
                result.exit_code,
                analysis.error_type,
                analysis.suggestion,
                analysis
                    .auto_fix_command
                    .map(|cmd| format!("\n\nTry running: {}", cmd))
                    .unwrap_or_default()
            );
            return Err(error_msg);
        }
    }

    // Clear the PID since command completed
    state.lock().unwrap().pid = None;

    Ok(result.stdout)
}

#[tauri::command]
fn stop_command(state: State<Mutex<AppState>>) -> Result<String, String> {
    let mut state_guard = state.lock().unwrap();

    if let Some(pid) = state_guard.pid {
        command_executor::terminate_process(pid)?;
        state_guard.pid = None;
        Ok("Command terminated successfully".to_string())
    } else {
        Err("No running command to stop".to_string())
    }
}

#[tauri::command]
fn check_safety(command: String) -> safety::SafetyCheck {
    safety::check_command_safety(&command)
}

#[tauri::command]
fn get_system_stats() -> system_monitor::SystemStats {
    system_monitor::get_system_stats()
}

#[tauri::command]
fn analyze_error(error_output: String) -> Option<error_analyzer::ErrorAnalysis> {
    error_analyzer::analyze_error(&error_output)
}

#[tauri::command]
fn get_current_directory() -> Result<String, String> {
    std::env::current_dir()
        .map(|path| path.to_string_lossy().to_string())
        .map_err(|e| format!("Failed to get current directory: {}", e))
}

#[tauri::command]
fn set_home_directory() -> Result<String, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| {
        #[cfg(target_os = "windows")]
        {
            std::env::var("USERPROFILE").unwrap_or_else(|_| ".".to_string())
        }
        #[cfg(not(target_os = "windows"))]
        {
            ".".to_string()
        }
    });

    std::env::set_current_dir(&home_dir)
        .map(|_| home_dir.clone())
        .map_err(|e| format!("Failed to set home directory: {}", e))
}

#[tauri::command]
async fn execute_input<R: tauri::Runtime>(
    input: String,
    force_execute: bool,
    conversation_history: Option<String>,
    app_handle: tauri::AppHandle<R>,
    state: State<'_, Mutex<AppState>>,
) -> Result<ExecutionResponse, String> {
    // Determine if input is a direct command or natural language
    let is_natural_language = !input.trim_start().starts_with('/')
        && !input.trim_start().starts_with('.')
        && !input.contains('=')
        && input.split_whitespace().count() > 2;

    let command_to_execute = if is_natural_language && !force_execute {
        // Translate natural language to shell command with conversation context
        translate_command(input.clone(), conversation_history).await?
    } else {
        input.clone()
    };

    // Enhance command with full file paths if needed
    let command_to_execute = file_locator::enhance_command_with_paths(&command_to_execute)
        .map_err(|e| e.to_string())?;

    // Check safety
    let safety_check = check_safety(command_to_execute.clone());

    // If command needs confirmation and force_execute is false, return early with confirmation request
    if safety_check.danger_level != safety::DangerLevel::Safe && !force_execute {
        return Ok(ExecutionResponse {
            output: String::new(),
            error: None,
            exit_code: 0,
            command_run: command_to_execute,
            needs_confirmation: true,
            was_natural_language: is_natural_language,
            current_dir: get_current_directory().unwrap_or_else(|_| ".".to_string()),
            error_analysis: None,
            suggested_fix: None,
            safety_check: Some(safety_check),
        });
    }

    // Execute the command
    let (result, pid) = command_executor::execute_shell_command_streaming(&command_to_execute, &app_handle)
        .await
        .map_err(|e| format!("Execution error: {}", e))?;

    // Store PID if available
    if let Some(process_pid) = pid {
        state.lock().unwrap().pid = Some(process_pid);
    }

    // Get current directory
    let current_dir = get_current_directory().unwrap_or_else(|_| ".".to_string());

    // Analyze errors if command failed
    let (error_analysis, suggested_fix) = if result.exit_code != 0 {
        let error_output = if !result.stderr.is_empty() {
            &result.stderr
        } else {
            &result.stdout
        };

        let analysis = error_analyzer::analyze_error(error_output);
        let fix = analysis.as_ref().and_then(|a| a.auto_fix_command.clone());
        (analysis, fix)
    } else {
        (None, None)
    };

    // Clear PID since command completed
    state.lock().unwrap().pid = None;

    Ok(ExecutionResponse {
        output: result.stdout,
        error: if !result.stderr.is_empty() {
            Some(result.stderr)
        } else if result.exit_code != 0 {
            Some(format!("Command exited with code {}", result.exit_code))
        } else {
            None
        },
        exit_code: result.exit_code,
        command_run: command_to_execute,
        needs_confirmation: false, // Command already executed if we reach this point
        was_natural_language: is_natural_language,
        current_dir,
        error_analysis,
        suggested_fix,
        safety_check: if safety_check.danger_level != safety::DangerLevel::Safe {
            Some(safety_check)
        } else {
            None
        },
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(Mutex::new(AppState { pid: None }))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            translate_command,
            execute_command_with_confirmation,
            execute_input,
            stop_command,
            check_safety,
            get_system_stats,
            analyze_error,
            get_current_directory,
            set_home_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
