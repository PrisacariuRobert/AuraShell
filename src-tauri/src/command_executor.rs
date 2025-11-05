use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};
use serde::Serialize;
use std::error::Error;
use std::io::{BufRead, BufReader};
use tauri::Emitter;

#[derive(Clone, Serialize)]
struct StreamOutput {
    output: String,
    is_error: bool,
}

#[derive(Debug, Serialize)]
pub struct ExecutionResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

pub async fn execute_shell_command_streaming<R: tauri::Runtime>(
    command: &str,
    app_handle: &tauri::AppHandle<R>,
    directory: Option<&str>,
) -> Result<(ExecutionResult, Option<u32>), Box<dyn Error + Send + Sync>> {
    let pty_system = NativePtySystem::default();

    let pty_pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("Failed to open PTY: {}", e))?;

    let mut shell_command = CommandBuilder::new("sh");
    shell_command.arg("-c");
    shell_command.arg(command);
    if let Some(dir) = directory {
        shell_command.cwd(dir);
    }

    let mut child = pty_pair
        .slave
        .spawn_command(shell_command)
        .map_err(|e| format!("Failed to spawn command: {}", e))?;


    let pid = child.process_id();

    drop(pty_pair.slave);

    let mut reader = pty_pair.master.try_clone_reader()?;

    let app_handle_clone = app_handle.clone();

    let reader_handle = tokio::task::spawn_blocking(move || {
        let mut all_output = String::new();
        let buf_reader = BufReader::new(&mut reader);

        for line in buf_reader.lines() {
            match line {
                Ok(line_content) => {
                    all_output.push_str(&line_content);
                    all_output.push('\n');

                    let _ = app_handle_clone.emit(
                        "command-output",
                        StreamOutput {
                            output: line_content,
                            is_error: false,
                        },
                    );
                }
                Err(_) => break,
            }
        }

        all_output
    });

    let exit_status = tokio::task::spawn_blocking(move || child.wait())
        .await
        .map_err(|e| format!("Failed to join child task: {}", e))?
        .map_err(|e| format!("Failed to wait for child: {}", e))?;

    let all_stdout = reader_handle
        .await
        .map_err(|e| format!("Failed to join reader task: {}", e))?;

    let exit_code = exit_status.exit_code();

    Ok((
        ExecutionResult {
            stdout: all_stdout,
            stderr: String::new(),
            exit_code: exit_code as i32,
        },
        pid,
    ))
}

#[cfg(unix)]
pub fn terminate_process(pid: u32) -> Result<(), String> {
    use std::process::Command;

    Command::new("kill")
        .arg("-TERM")
        .arg(pid.to_string())
        .output()
        .map_err(|e| format!("Failed to terminate process: {}", e))?;

    Ok(())
}

#[cfg(windows)]
pub fn terminate_process(pid: u32) -> Result<(), String> {
    use std::process::Command;

    Command::new("taskkill")
        .args(&["/PID", &pid.to_string(), "/F"])
        .output()
        .map_err(|e| format!("Failed to terminate process: {}", e))?;

    Ok(())
}
