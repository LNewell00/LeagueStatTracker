use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

fn get_cache_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Unable to resolve app data dir: {}", e))?;

    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create app data dir: {}", e))?;
    }

    Ok(app_dir.join("match_cache.json"))
}

#[tauri::command]
pub async fn save_match_cache(app: AppHandle, cache_content: String) -> Result<(), String> {
    let path = get_cache_file_path(&app)?;
    fs::write(&path, cache_content).map_err(|e| format!("Failed to write cache file: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn load_match_cache(app: AppHandle) -> Result<String, String> {
    let path = get_cache_file_path(&app)?;
    if !path.exists() {
        return Ok("[]".to_string());
    }
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read cache file: {}", e))?;
    Ok(content)
}

#[tauri::command]
pub async fn clear_match_cache(app: AppHandle) -> Result<(), String> {
    let path = get_cache_file_path(&app)?;
    if path.exists() {
        let _ = fs::remove_file(path);
    }
    Ok(())
}

