import { ParsedMatch } from "../types/riot";

// Check if running inside Tauri runtime
export function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function saveMatchesToCache(matches: ParsedMatch[]): Promise<void> {
  const json = JSON.stringify(matches);

  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_match_cache", { cacheContent: json });
      return;
    } catch (e) {
      console.warn("Failed to write to Tauri cache, falling back to localStorage", e);
    }
  }

  try {
    localStorage.setItem("league_matches_cache", json);
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export async function loadMatchesFromCache(): Promise<ParsedMatch[]> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const raw = await invoke<string>("load_match_cache");
      if (raw && raw !== "[]") {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Failed to read from Tauri cache, falling back to localStorage", e);
    }
  }

  try {
    const raw = localStorage.getItem("league_matches_cache");
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to parse cached matches:", e);
  }

  return [];
}

export async function clearLocalCache(): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("clear_match_cache");
    } catch (e) {
      console.warn("Error clearing Tauri cache", e);
    }
  }
  localStorage.removeItem("league_matches_cache");
}

export interface AppPreferences {
  apiKey: string;
  gameName: string;
  tagLine: string;
  region: string;
  useMockOnEmpty: boolean;
  matchCount?: number;
}

const PREFS_KEY = "league_tracker_prefs";

export function loadPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        matchCount: parsed.matchCount || 20,
      };
    }
  } catch {
    // ignore
  }

  return {
    apiKey: import.meta.env.VITE_RIOT_API_KEY || "",
    gameName: import.meta.env.VITE_DEFAULT_GAME_NAME || "Faker",
    tagLine: import.meta.env.VITE_DEFAULT_TAG_LINE || "KR1",
    region: (import.meta.env.VITE_DEFAULT_REGION || "na").toLowerCase(),
    useMockOnEmpty: true,
    matchCount: 20,
  };
}

export function savePreferences(prefs: AppPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error("Failed to save preferences:", e);
  }
}

