mod commands;

use commands::live_client::poll_live_client_data;
use commands::native_recorder::{
    is_native_recording_active, start_native_game_recording, stop_native_game_recording,
};
use commands::recording::{
    append_debug_log, delete_recording, get_debug_log_content, highlight_file_in_explorer,
    launch_rofl_replay, list_recordings, open_debug_log_file, open_recordings_folder,
    save_recording_file, scan_rofl_replays,
};
use commands::riot_api::{
    get_league_entries, get_match_detail, get_match_ids, get_match_timeline, get_riot_account,
};
use commands::storage::{clear_match_cache, load_match_cache, save_match_cache};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "windows")]
    {
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            "--enable-usermedia-screen-capturing --auto-select-desktop-capture-source=\"League of Legends\"",
        );
    }

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
            clear_match_cache,
            save_recording_file,
            list_recordings,
            delete_recording,
            open_recordings_folder,
            scan_rofl_replays,
            launch_rofl_replay,
            highlight_file_in_explorer,
            append_debug_log,
            get_debug_log_content,
            open_debug_log_file,
            start_native_game_recording,
            stop_native_game_recording,
            is_native_recording_active
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

