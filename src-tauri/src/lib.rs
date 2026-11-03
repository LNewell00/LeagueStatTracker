mod commands;

use commands::live_client::poll_live_client_data;
use commands::riot_api::{get_match_detail, get_match_ids, get_riot_account};
use commands::storage::{clear_match_cache, load_match_cache, save_match_cache};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_riot_account,
            get_match_ids,
            get_match_detail,
            poll_live_client_data,
            save_match_cache,
            load_match_cache,
            clear_match_cache
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

