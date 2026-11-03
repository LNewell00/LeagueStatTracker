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

