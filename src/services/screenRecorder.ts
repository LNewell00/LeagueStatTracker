import { invoke } from "@tauri-apps/api/core";
import { logger } from "./logger";
import { isTauriEnvironment } from "./storage";

export interface RecordingMeta {
  name: string;
  path: string;
  size_bytes: number;
  created_at: number;
  url?: string; // Blob URL for web playback
  duration?: number;
}

export interface RoflReplayMeta {
  file_name: string;
  path: string;
  size_bytes: number;
  modified_at: number;
}

export type QualityPreset = "720p" | "1080p" | "1080p60";

// IndexedDB Helper for persistent local VOD playback within WebView
const DB_NAME = "LeagueTrackerRecordings";
const STORE_NAME = "vod_blobs";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function storeVodBlob(id: string, blob: Blob, meta: { name: string; duration: number }): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({
      id,
      blob,
      name: meta.name,
      duration: meta.duration,
      size: blob.size,
      created_at: Date.now(),
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("Failed to store blob in IndexedDB:", e);
  }
}

export async function getStoredVodBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result?.blob || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deleteStoredVodBlob(id: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
  } catch {
    // ignore
  }
}

class ScreenRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private currentStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private timerInterval: any = null;
  private stateChangeCallbacks: ((state: "idle" | "recording" | "paused") => void)[] = [];
  private durationCallbacks: ((seconds: number) => void)[] = [];
  private isNativeMode: boolean = false;
  private nativePath: string | null = null;

  public isRecordingActive: boolean = false;
  public isRecordingPaused: boolean = false;
  public recordedSeconds: number = 0;

  public onStateChange(cb: (state: "idle" | "recording" | "paused") => void) {
    this.stateChangeCallbacks.push(cb);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter((c) => c !== cb);
    };
  }

  public onDurationUpdate(cb: (seconds: number) => void) {
    this.durationCallbacks.push(cb);
    return () => {
      this.durationCallbacks = this.durationCallbacks.filter((c) => c !== cb);
    };
  }

  private emitState(state: "idle" | "recording" | "paused") {
    this.stateChangeCallbacks.forEach((cb) => cb(state));
  }

  private emitDuration(sec: number) {
    this.durationCallbacks.forEach((cb) => cb(sec));
  }

  /**
   * Start lightweight screen / game window recording
   */
  public async start(quality: QualityPreset = "720p", includeMic: boolean = false): Promise<void> {
    if (this.isRecordingActive || (this.mediaRecorder && this.mediaRecorder.state !== "inactive")) {
      throw new Error("Recording is already in progress.");
    }

    // 0. PRIMARY: Native Windows Graphics Capture (Zero Prompts, Zero Dialogs)
    if (isTauriEnvironment()) {
      try {
        logger.log("info", "ScreenRecorder", "Initiating Native Windows Graphics Capture for 'League of Legends (TM) Client'...");
        const path = await invoke<string>("start_native_game_recording");
        this.isNativeMode = true;
        this.nativePath = path;
        this.isRecordingActive = true;
        this.isRecordingPaused = false;
        this.recordedSeconds = 0;

        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
          if (!this.isRecordingPaused) {
            this.recordedSeconds++;
            this.emitDuration(this.recordedSeconds);
          }
        }, 1000);

        this.emitState("recording");
        logger.log("success", "ScreenRecorder", `Native Windows Graphics Capture attached to League! Recording to: ${path}`);
        return;
      } catch (nativeErr: any) {
        logger.log("warn", "ScreenRecorder", `Native capture initiation failed (${nativeErr?.message || nativeErr}), falling back to web capture...`);
      }
    }

    const videoConstraints: MediaTrackConstraints = {
      frameRate: quality === "1080p60" ? { ideal: 60, max: 60 } : { ideal: 30, max: 30 },
    };

    if (quality === "720p") {
      videoConstraints.width = { ideal: 1280 };
      videoConstraints.height = { ideal: 720 };
    } else if (quality === "1080p" || quality === "1080p60") {
      videoConstraints.width = { ideal: 1920 };
      videoConstraints.height = { ideal: 1080 };
    }

    logger.log("info", "ScreenRecorder", `start() called (preset: ${quality}, includeMic: ${includeMic})`);

    if (!navigator?.mediaDevices?.getDisplayMedia) {
      const err = new Error("navigator.mediaDevices.getDisplayMedia is not available in this browser/WebView2 instance.");
      logger.log("error", "ScreenRecorder", err.message);
      throw err;
    }

    // 1. Get Display / Window stream via 3-Tier Fallback Cascade
    let displayStream: MediaStream;
    try {
      logger.log("info", "ScreenRecorder", "Attempting Level 1 capture (resolution/framerate + audio)...");
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: videoConstraints,
        audio: true, // Capture in-game sound
      });
      logger.log("success", "ScreenRecorder", "Level 1 display stream acquired with audio!", {
        tracks: displayStream.getTracks().map((t) => `${t.kind}: ${t.label}`),
      });
    } catch (e1: any) {
      logger.log("warn", "ScreenRecorder", `Level 1 failed (${e1?.name}: ${e1?.message}), trying Level 2 (video-only with framerate)...`);
      try {
        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30, max: 60 } },
          audio: false,
        });
        logger.log("success", "ScreenRecorder", "Level 2 display stream acquired (video only)!", {
          tracks: displayStream.getTracks().map((t) => `${t.kind}: ${t.label}`),
        });
      } catch (e2: any) {
        logger.log("warn", "ScreenRecorder", `Level 2 failed (${e2?.name}: ${e2?.message}), trying Level 3 universal fallback (video: true)...`);
        try {
          displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
          });
          logger.log("success", "ScreenRecorder", "Level 3 display stream acquired (universal video: true)!", {
            tracks: displayStream.getTracks().map((t) => `${t.kind}: ${t.label}`),
          });
        } catch (e3: any) {
          logger.log("error", "ScreenRecorder", `FATAL: All capture levels failed: [${e3?.name}] ${e3?.message}`, {
            name: e3?.name,
            message: e3?.message,
            stack: e3?.stack,
          });
          throw e3;
        }
      }
    }

    let combinedStream = displayStream;

    // 2. Mix microphone audio if requested
    if (includeMic) {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioCtx = new AudioContext();
        const dest = audioCtx.createMediaStreamDestination();

        if (displayStream.getAudioTracks().length > 0) {
          const sysSource = audioCtx.createMediaStreamSource(displayStream);
          sysSource.connect(dest);
        }

        const micSource = audioCtx.createMediaStreamSource(micStream);
        micSource.connect(dest);

        const mixedAudioTrack = dest.stream.getAudioTracks()[0];
        combinedStream = new MediaStream([
          ...displayStream.getVideoTracks(),
          mixedAudioTrack,
        ]);
      } catch (err) {
        console.warn("Could not attach microphone, continuing with system sound only:", err);
      }
    }

    this.currentStream = combinedStream;
    this.recordedChunks = [];

    // Choose most efficient hardware codec
    let mimeType = "video/webm;codecs=vp9,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm;codecs=vp8,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }
    }

    const bitrates: Record<QualityPreset, number> = {
      "720p": 2_500_000,   // 2.5 Mbps - extremely low CPU & storage impact
      "1080p": 5_000_000,  // 5.0 Mbps
      "1080p60": 8_000_000, // 8.0 Mbps
    };

    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: bitrates[quality] || 3_000_000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    // If user clicks "Stop sharing" on the browser/system banner
    displayStream.getVideoTracks()[0].onended = () => {
      if (this.isRecordingActive) {
        this.stop();
      }
    };

    // Start with 1-second chunks for low memory overhead
    recorder.start(1000);
    this.mediaRecorder = recorder;
    this.isRecordingActive = true;
    this.isRecordingPaused = false;
    this.recordedSeconds = 0;

    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isRecordingPaused) {
        this.recordedSeconds++;
        this.emitDuration(this.recordedSeconds);
      }
    }, 1000);

    this.emitState("recording");
  }

  public pause() {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.pause();
      this.isRecordingPaused = true;
      this.emitState("paused");
    }
  }

  public resume() {
    if (this.mediaRecorder && this.mediaRecorder.state === "paused") {
      this.mediaRecorder.resume();
      this.isRecordingPaused = false;
      this.emitState("recording");
    }
  }

  /**
   * Stop recording and return final video Blob and metadata
   */
  public async stop(): Promise<{ blob: Blob; durationSec: number; mimeType: string; path?: string }> {
    if (this.isNativeMode) {
      clearInterval(this.timerInterval);
      const durationSec = Math.max(1, this.recordedSeconds);
      let savedPath = this.nativePath || "";
      try {
        savedPath = await invoke<string>("stop_native_game_recording");
        logger.log("success", "ScreenRecorder", `Native recording stopped & saved to: ${savedPath} (${durationSec}s)`);
      } catch (e: any) {
        logger.log("error", "ScreenRecorder", `Failed stopping native recording: ${e?.message}`);
      }
      this.isNativeMode = false;
      this.nativePath = null;
      this.isRecordingActive = false;
      this.isRecordingPaused = false;
      this.emitState("idle");
      return {
        blob: new Blob([], { type: "video/mp4" }),
        durationSec,
        mimeType: "video/mp4",
        path: savedPath,
      };
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error("No active recording found."));
      }

      clearInterval(this.timerInterval);
      const durationSec = Math.max(1, this.recordedSeconds);

      this.mediaRecorder.onstop = () => {
        const finalBlob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType || "video/webm",
        });

        // Release hardware tracks
        if (this.currentStream) {
          this.currentStream.getTracks().forEach((t) => t.stop());
          this.currentStream = null;
        }

        this.mediaRecorder = null;
        this.isRecordingActive = false;
        this.isRecordingPaused = false;
        this.emitState("idle");

        resolve({
          blob: finalBlob,
          durationSec,
          mimeType: finalBlob.type,
        });
      };

      this.mediaRecorder.stop();
    });
  }
}

export const screenRecorder = new ScreenRecorderService();

/**
 * Save recording to Tauri backend Videos folder, and fallback to browser download
 */
export async function saveRecordingLocally(
  blob: Blob,
  fileName: string,
  durationSec: number
): Promise<{ path?: string; id: string }> {
  logger.log("info", "ScreenRecorder", `saveRecordingLocally starting for ${fileName} (${blob.size} bytes, ${durationSec}s)`);
  const id = `vod_${Date.now()}`;
  await storeVodBlob(id, blob, { name: fileName, duration: durationSec });

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = Array.from(new Uint8Array(arrayBuffer));
    const savedPath = await invoke<string>("save_recording_file", {
      fileName,
      videoBytes: bytes,
    });
    logger.log("success", "ScreenRecorder", `Video successfully written to disk: ${savedPath}`);
    return { path: savedPath, id };
  } catch (err: any) {
    logger.log("error", "ScreenRecorder", `Tauri save_recording_file failed: ${err?.message || err}`, err);
    return { id };
  }
}

export async function fetchDiskRecordings(): Promise<RecordingMeta[]> {
  try {
    return await invoke<RecordingMeta[]>("list_recordings");
  } catch {
    return [];
  }
}

export async function deleteDiskRecording(filePath: string): Promise<void> {
  try {
    await invoke("delete_recording", { filePath });
  } catch (e) {
    console.error("Failed to delete recording:", e);
  }
}

export async function openRecordingsFolder(): Promise<void> {
  try {
    await invoke("open_recordings_folder");
  } catch (e) {
    console.error("Failed to open recordings folder:", e);
  }
}

export async function fetchRoflReplays(): Promise<RoflReplayMeta[]> {
  try {
    return await invoke<RoflReplayMeta[]>("scan_rofl_replays");
  } catch {
    return [];
  }
}

export async function launchRoflReplay(replayPath: string): Promise<void> {
  try {
    await invoke("launch_rofl_replay", { replayPath });
  } catch (e) {
    console.error("Failed to launch ROFL replay:", e);
    throw e;
  }
}

export async function highlightFileInExplorer(filePath: string): Promise<void> {
  try {
    await invoke("highlight_file_in_explorer", { filePath });
  } catch (e) {
    console.error("Failed to highlight file in explorer:", e);
  }
}

export function downloadVodFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
