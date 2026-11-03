import { isTauriEnvironment } from "./storage";

export interface UpdateInfo {
  available: boolean;
  version?: string;
  body?: string;
  date?: string;
}

export type DownloadProgressHandler = (downloaded: number, total: number | null) => void;

export async function checkAppUpdate(): Promise<{
  updateAvailable: boolean;
  version: string | null;
  notes: string | null;
  updateHandle: any | null;
}> {
  if (!isTauriEnvironment()) {
    return { updateAvailable: false, version: null, notes: null, updateHandle: null };
  }

  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();

    if (update && update.available) {
      return {
        updateAvailable: true,
        version: update.version,
        notes: update.body || null,
        updateHandle: update,
      };
    }

    return { updateAvailable: false, version: null, notes: null, updateHandle: null };
  } catch (err) {
    console.warn("Failed to check for updates:", err);
    return { updateAvailable: false, version: null, notes: null, updateHandle: null };
  }
}

export async function installUpdateAndRestart(
  updateHandle: any,
  onProgress?: DownloadProgressHandler
): Promise<void> {
  if (!updateHandle) return;

  try {
    let downloaded = 0;
    let contentLength: number | null = null;

    await updateHandle.downloadAndInstall((event: any) => {
      switch (event.event) {
        case "Started":
          contentLength = event.data.contentLength || null;
          if (onProgress) onProgress(0, contentLength);
          break;
        case "Progress":
          downloaded += event.data.chunkLength;
          if (onProgress) onProgress(downloaded, contentLength);
          break;
        case "Finished":
          if (onProgress) onProgress(downloaded, contentLength);
          break;
      }
    });

    // Relaunch the app after update has completed
    const { relaunch } = await import("@tauri-apps/plugin-process");
    await relaunch();
  } catch (err) {
    console.error("Update installation failed:", err);
    throw err;
  }
}

