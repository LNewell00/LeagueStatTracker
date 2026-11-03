mod commands;

use commands::live_client::poll_live_client_data;
use commands::riot_api::{
    get_league_entries, get_match_detail, get_match_ids, get_match_timeline, get_riot_account,
};
use commands::storage::{clear_match_cache, load_match_cache, save_match_cache};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let icon_bytes = include_bytes!("../icons/128x128.png");
                if let Ok(icon) = tauri::image::Image::from_bytes(icon_bytes) {
                    let _ = window.set_icon(icon);
                }
                let _ = window.show();
                let _ = window.set_focus();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_riot_account,
            get_match_ids,
            get_match_detail,
            get_match_timeline,
            get_league_entries,
            poll_live_client_data,
            save_match_cache,
            load_match_cache,
            clear_match_cache
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

