import { LiveGameData, LivePollerState } from "../types/live";
import { isTauriEnvironment } from "./storage";
import { MOCK_LIVE_GAME } from "./mockData";
import { logger } from "./logger";

type LiveClientListener = (state: LivePollerState) => void;

class LiveClientPoller {
  private intervalId: number | null = null;
  private pollIntervalMs: number = 3000;
  private listeners: Set<LiveClientListener> = new Set();
  private mockMode: boolean = false;

  private currentState: LivePollerState = {
    isActive: false,
    isLoading: false,
    lastUpdated: null,
    data: null,
    error: null,
  };

  public subscribe(listener: LiveClientListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.currentState);
    }
  }

  public setMockMode(enabled: boolean) {
    this.mockMode = enabled;
    if (enabled) {
      this.currentState = {
        isActive: true,
        isLoading: false,
        lastUpdated: Date.now(),
        data: MOCK_LIVE_GAME,
        error: null,
      };
      this.notify();
    } else {
      this.pollOnce();
    }
  }

  public start() {
    if (this.intervalId) return;
    this.pollOnce();
    this.intervalId = window.setInterval(() => {
      this.pollOnce();
    }, this.pollIntervalMs);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public async pollOnce() {
    if (this.mockMode) {
      this.currentState = {
        isActive: true,
        isLoading: false,
        lastUpdated: Date.now(),
        data: MOCK_LIVE_GAME,
        error: null,
      };
      this.notify();
      return;
    }

    this.currentState.isLoading = true;
    this.notify();

    const wasActive = this.currentState.isActive;

    try {
      if (isTauriEnvironment()) {
        const { invoke } = await import("@tauri-apps/api/core");
        const data = await invoke<LiveGameData>("poll_live_client_data");
        this.currentState = {
          isActive: true,
          isLoading: false,
          lastUpdated: Date.now(),
          data,
          error: null,
        };
        if (!wasActive) {
          logger.log("success", "LiveClient", `Match detected on port 2999! Mode: ${data?.gameData?.gameMode || "LoL"} (time: ${Math.floor(data?.gameData?.gameTime || 0)}s)`);
        }
      } else {
        // Direct browser fetch (will fail on CORS/self-signed cert unless proxy/Tauri is used)
        const res = await fetch("https://127.0.0.1:2999/liveclientdata/allgamedata", {
          signal: AbortSignal.timeout(1500),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.currentState = {
          isActive: true,
          isLoading: false,
          lastUpdated: Date.now(),
          data,
          error: null,
        };
        if (!wasActive) {
          logger.log("success", "LiveClient", `Match detected on port 2999! Mode: ${data?.gameData?.gameMode || "LoL"}`);
        }
      }
    } catch (err: any) {
      if (wasActive) {
        logger.log("info", "LiveClient", "Match ended or League client closed.");
      }
      this.currentState = {
        isActive: false,
        isLoading: false,
        lastUpdated: Date.now(),
        data: null,
        error: err?.message || "Game client offline",
      };
    }

    this.notify();
  }
}

export const liveClientService = new LiveClientPoller();

