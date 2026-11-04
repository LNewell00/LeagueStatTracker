// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "windows")]
    {
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            "--enable-usermedia-screen-capturing --auto-select-desktop-capture-source=\"League of Legends\"",
        );
    }
    league_stat_tracker_lib::run();
}
