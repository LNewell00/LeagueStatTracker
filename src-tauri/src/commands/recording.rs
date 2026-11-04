use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::time::UNIX_EPOCH;

#[derive(Debug, Serialize, Deserialize)]
pub struct RecordingMeta {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub created_at: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RoflReplayMeta {
    pub file_name: String,
    pub path: String,
    pub size_bytes: u64,
    pub modified_at: u64,
}

fn get_recordings_directory() -> Result<PathBuf, String> {
    let base = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map(PathBuf::from)
        .map_err(|e| format!("Could not find user home directory: {}", e))?;

    let dir = base.join("Videos").join("LeagueStatTracker");
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create recordings directory: {}", e))?;
    }
    Ok(dir)
}

#[tauri::command]
pub fn save_recording_file(file_name: String, video_bytes: Vec<u8>) -> Result<String, String> {
    let dir = get_recordings_directory()?;
    let clean_name = if file_name.ends_with(".webm") || file_name.ends_with(".mp4") {
        file_name
    } else {
        format!("{}.webm", file_name)
    };

    let target_path = dir.join(&clean_name);
    fs::write(&target_path, &video_bytes)
        .map_err(|e| format!("Failed to write video file {}: {}", target_path.display(), e))?;

    Ok(target_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn list_recordings() -> Result<Vec<RecordingMeta>, String> {
    let dir = get_recordings_directory()?;
    let mut results = Vec::new();

    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("");
                if ext.eq_ignore_ascii_case("webm") || ext.eq_ignore_ascii_case("mp4") {
                    let meta = entry.metadata().ok();
                    let size_bytes = meta.as_ref().map(|m| m.len()).unwrap_or(0);
                    let created_at = meta
                        .and_then(|m| m.created().or_else(|_| m.modified()).ok())
                        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                        .map(|d| d.as_secs())
                        .unwrap_or(0);

                    results.push(RecordingMeta {
                        name: entry.file_name().to_string_lossy().to_string(),
                        path: path.to_string_lossy().to_string(),
                        size_bytes,
                        created_at,
                    });
                }
            }
        }
    }

    // Sort newest first
    results.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(results)
}

#[tauri::command]
pub fn delete_recording(file_path: String) -> Result<(), String> {
    let path = PathBuf::from(&file_path);
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Failed to delete recording: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub fn open_recordings_folder() -> Result<(), String> {
    let dir = get_recordings_directory()?;
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(dir.to_string_lossy().as_ref())
            .spawn()
            .map_err(|e| format!("Failed to launch explorer: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(dir.to_string_lossy().as_ref())
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(dir.to_string_lossy().as_ref())
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub fn highlight_file_in_explorer(file_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .args(["/select,", &file_path])
            .spawn()
            .map_err(|e| format!("Failed to open explorer: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(["-R", &file_path])
            .spawn()
            .map_err(|e| format!("Failed to open finder: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub fn launch_rofl_replay(replay_path: String) -> Result<(), String> {
    let possible_exes = [
        PathBuf::from(r"C:\Riot Games\League of Legends\Game\League of Legends.exe"),
        PathBuf::from(r"D:\Riot Games\League of Legends\Game\League of Legends.exe"),
    ];

    let found_exe = possible_exes.iter().find(|p| p.exists());
    if let Some(game_exe) = found_exe {
        Command::new(game_exe)
            .arg(&replay_path)
            .spawn()
            .map_err(|e| format!("Failed to launch League of Legends replay: {}", e))?;
        Ok(())
    } else {
        #[cfg(target_os = "windows")]
        {
            Command::new("cmd")
                .args(["/c", "start", "", &replay_path])
                .spawn()
                .map_err(|e| format!("Could not open replay file: {}", e))?;
            Ok(())
        }
        #[cfg(not(target_os = "windows"))]
        {
            Err("League of Legends client executable not found.".to_string())
        }
    }
}

#[tauri::command]
pub fn scan_rofl_replays() -> Result<Vec<RoflReplayMeta>, String> {
    let mut results = Vec::new();
    let base = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map(PathBuf::from)
        .map_err(|e| format!("Could not find user home: {}", e))?;

    let replay_dir = base.join("Documents").join("League of Legends").join("Replays");
    if replay_dir.exists() {
        if let Ok(entries) = fs::read_dir(&replay_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("");
                    if ext.eq_ignore_ascii_case("rofl") {
                        let meta = entry.metadata().ok();
                        let size_bytes = meta.as_ref().map(|m| m.len()).unwrap_or(0);
                        let modified_at = meta
                            .and_then(|m| m.modified().ok())
                            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                            .map(|d| d.as_secs())
                            .unwrap_or(0);

                        results.push(RoflReplayMeta {
                            file_name: entry.file_name().to_string_lossy().to_string(),
                            path: path.to_string_lossy().to_string(),
                            size_bytes,
                            modified_at,
                        });
                    }
                }
            }
        }
    }

    results.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));
    Ok(results)
}

fn get_debug_log_path() -> PathBuf {
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            let log_file = parent.join("debug_recording.log");
            return log_file;
        }
    }
    std::env::temp_dir().join("league_stat_tracker_debug.log")
}

#[tauri::command]
pub fn append_debug_log(entry: String) -> Result<(), String> {
    use std::fs::OpenOptions;
    use std::io::Write;

    let now_ms = std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);

    let line = format!("[+{}] {}\n", now_ms, entry);

    let log_path = get_debug_log_path();
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(&log_path) {
        let _ = f.write_all(line.as_bytes());
    }

    // Also mirror to %TEMP%/league_stat_tracker_debug.log
    let temp_log = std::env::temp_dir().join("league_stat_tracker_debug.log");
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(&temp_log) {
        let _ = f.write_all(line.as_bytes());
    }

    // Also write to project working dir if exists
    let cwd_log = PathBuf::from("debug_recording.log");
    let _ = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&cwd_log)
        .and_then(|mut f| f.write_all(line.as_bytes()));

    println!("[APP_LOG] {}", entry);
    Ok(())
}

#[tauri::command]
pub fn get_debug_log_content() -> Result<String, String> {
    let log_path = get_debug_log_path();
    if log_path.exists() {
        fs::read_to_string(&log_path).map_err(|e| format!("Failed to read debug log: {}", e))
    } else {
        let temp_log = std::env::temp_dir().join("league_stat_tracker_debug.log");
        if temp_log.exists() {
            fs::read_to_string(&temp_log).map_err(|e| format!("Failed to read temp debug log: {}", e))
        } else {
            Ok("No log entries recorded yet.".to_string())
        }
    }
}

#[tauri::command]
pub fn open_debug_log_file() -> Result<(), String> {
    let log_path = get_debug_log_path();
    #[cfg(target_os = "windows")]
    {
        Command::new("notepad.exe")
            .arg(log_path.to_string_lossy().as_ref())
            .spawn()
            .map_err(|e| format!("Failed to open notepad: {}", e))?;
    }
    Ok(())
}

