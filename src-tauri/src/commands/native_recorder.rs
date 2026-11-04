use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use windows_capture::{
    capture::{CaptureControl, Context, GraphicsCaptureApiHandler},
    encoder::{AudioSettingsBuilder, ContainerSettingsBuilder, VideoEncoder, VideoSettingsBuilder},
    frame::Frame,
    graphics_capture_api::InternalCaptureControl,
    settings::{
        ColorFormat, CursorCaptureSettings, DirtyRegionSettings, DrawBorderSettings,
        MinimumUpdateIntervalSettings, SecondaryWindowSettings, Settings,
    },
    window::Window,
};

pub struct LeagueCaptureSession {
    encoder: Option<VideoEncoder>,
}

impl GraphicsCaptureApiHandler for LeagueCaptureSession {
    type Flags = (u32, u32, PathBuf);
    type Error = Box<dyn std::error::Error + Send + Sync>;

    fn new(ctx: Context<Self::Flags>) -> Result<Self, Self::Error> {
        let (width, height, path) = ctx.flags;

        // Even width & height are required by H.264 video encoders
        let enc_width = if width % 2 != 0 { width + 1 } else { width };
        let enc_height = if height % 2 != 0 { height + 1 } else { height };

        let encoder = VideoEncoder::new(
            VideoSettingsBuilder::new(enc_width, enc_height),
            AudioSettingsBuilder::default().disabled(true),
            ContainerSettingsBuilder::default(),
            path,
        )?;

        Ok(Self {
            encoder: Some(encoder),
        })
    }

    fn on_frame_arrived(
        &mut self,
        frame: &mut Frame,
        _capture_control: InternalCaptureControl,
    ) -> Result<(), Self::Error> {
        if let Some(encoder) = &mut self.encoder {
            let _ = encoder.send_frame(frame);
        }
        Ok(())
    }

    fn on_closed(&mut self) -> Result<(), Self::Error> {
        if let Some(encoder) = self.encoder.take() {
            let _ = encoder.finish();
        }
        Ok(())
    }
}

static ACTIVE_CONTROL: Mutex<Option<(CaptureControl<LeagueCaptureSession, Box<dyn std::error::Error + Send + Sync>>, Instant, PathBuf)>> = Mutex::new(None);

fn get_recordings_directory() -> Result<PathBuf, String> {
    let base = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map(PathBuf::from)
        .map_err(|e| format!("Could not find user home directory: {}", e))?;

    let dir = base.join("Videos").join("LeagueStatTracker");
    if !dir.exists() {
        std::fs::create_dir_all(&dir).map_err(|e| format!("Failed to create recordings directory: {}", e))?;
    }
    Ok(dir)
}

#[tauri::command]
pub fn start_native_game_recording() -> Result<String, String> {
    let mut guard = ACTIVE_CONTROL.lock().map_err(|e| e.to_string())?;
    if guard.is_some() {
        return Err("A native game recording session is already active".to_string());
    }

    // 1. Locate the League of Legends 3D Game Window
    let window = Window::from_contains_name("League of Legends (TM) Client")
        .or_else(|_| Window::from_contains_name("League of Legends"))
        .map_err(|_| "Could not find 'League of Legends (TM) Client' window. Ensure the match is in progress.".to_string())?;

    let width = window.width().unwrap_or(1920).max(640) as u32;
    let height = window.height().unwrap_or(1080).max(480) as u32;

    // 2. Prepare output MP4 path in Videos/LeagueStatTracker
    let dir = get_recordings_directory()?;
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
    let file_name = format!("LoL_Game_{}.mp4", now);
    let target_path = dir.join(&file_name);

    // 3. Configure Windows Graphics Capture without any border or prompt
    let settings = Settings::new(
        window,
        CursorCaptureSettings::Default,
        DrawBorderSettings::WithoutBorder,
        SecondaryWindowSettings::Default,
        MinimumUpdateIntervalSettings::Default,
        DirtyRegionSettings::Default,
        ColorFormat::Rgba8,
        (width, height, target_path.clone()),
    );

    let control = LeagueCaptureSession::start_free_threaded(settings)
        .map_err(|e| format!("Failed to initialize native Windows Graphics Capture: {}", e))?;

    let path_str = target_path.to_string_lossy().to_string();
    *guard = Some((control, Instant::now(), target_path));

    println!("[NATIVE_RECORDER] Successfully attached to League of Legends window! Recording to: {}", path_str);
    Ok(path_str)
}

#[tauri::command]
pub fn stop_native_game_recording() -> Result<String, String> {
    let mut guard = ACTIVE_CONTROL.lock().map_err(|e| e.to_string())?;
    if let Some((control, start_time, path)) = guard.take() {
        let duration = start_time.elapsed().as_secs();
        let _ = control.stop();
        let path_str = path.to_string_lossy().to_string();
        println!("[NATIVE_RECORDER] Finalized native recording: {} ({}s)", path_str, duration);
        Ok(path_str)
    } else {
        Err("No active native recording found to stop".to_string())
    }
}

#[tauri::command]
pub fn is_native_recording_active() -> bool {
    if let Ok(guard) = ACTIVE_CONTROL.lock() {
        guard.is_some()
    } else {
        false
    }
}
