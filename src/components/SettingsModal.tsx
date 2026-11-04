import React, { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { AppPreferences, savePreferences, clearLocalCache } from "../services/storage";
import { X, Key, Trash2, ExternalLink, Check, RefreshCw, ArrowUpCircle, Download, Video } from "lucide-react";
import { SUPPORTED_REGIONS } from "../types/riot";
import { checkAppUpdate, installUpdateAndRestart } from "../services/updater";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: AppPreferences;
  onSavePreferences: (newPrefs: AppPreferences) => void;
  onCacheCleared: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
  onCacheCleared,
}) => {
  const [apiKey, setApiKey] = useState(preferences.apiKey);
  const [gameName, setGameName] = useState(preferences.gameName);
  const [tagLine, setTagLine] = useState(preferences.tagLine);
  const [region, setRegion] = useState(preferences.region);
  const [matchCount, setMatchCount] = useState<number>(preferences.matchCount || 20);
  const [enableVodRecording, setEnableVodRecording] = useState<boolean>(
    preferences.enableVodRecording !== undefined ? preferences.enableVodRecording : true
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Auto-updater states
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [availableUpdate, setAvailableUpdate] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [appVersion, setAppVersion] = useState<string>("0.2.0");

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => {});
  }, []);

  if (!isOpen) return null;

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatus("Checking GitHub Releases for updates...");
    try {
      const result = await checkAppUpdate();
      if (result.updateAvailable) {
        setAvailableUpdate(result.updateHandle);
        setUpdateStatus(`New version v${result.version} is available!`);
      } else {
        setUpdateStatus(`You are running the latest version (v${appVersion}).`);
      }
    } catch {
      setUpdateStatus("Could not reach update server. Check your connection.");
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleInstallUpdate = async () => {
    if (!availableUpdate) return;
    setIsDownloading(true);
    try {
      await installUpdateAndRestart(availableUpdate, (downloaded, total) => {
        if (total) {
          setDownloadProgress(Math.round((downloaded / total) * 100));
        }
      });
    } catch (err: any) {
      alert(`Update failed: ${err?.message || err}`);
      setIsDownloading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newPrefs: AppPreferences = {
      ...preferences,
      apiKey: apiKey.trim(),
      gameName: gameName.trim(),
      tagLine: tagLine.trim(),
      region,
      matchCount,
      enableVodRecording,
    };
    savePreferences(newPrefs);
    onSavePreferences(newPrefs);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleClear = async () => {
    if (confirm("Are you sure you want to purge the local match cache?")) {
      await clearLocalCache();
      onCacheCleared();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in font-mono text-xs">
      <div className="bg-white dark:bg-[#0c0e14] border border-neutral-300 dark:border-neutral-700 w-full max-w-lg rounded shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#11141c]">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-riot-red" />
            <h3 className="font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              Platform Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-4 space-y-3.5 max-h-[85vh] overflow-y-auto custom-scrollbar">
          {/* Riot API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Riot Games API Key
              </label>
              <a
                href="https://developer.riotgames.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-riot-red hover:underline flex items-center gap-0.5"
              >
                <span>Portal</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-2.5 py-1.5 text-xs bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-riot-red font-mono"
            />
            <p className="text-[10px] text-neutral-400 mt-1">
              Personal Development Keys refresh every 24 hours.
            </p>
          </div>

          {/* Summoner Name & Tag */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                Game Name
              </label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Faker"
                className="w-full px-2.5 py-1.5 text-xs bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-riot-red"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                Tag Line (no #)
              </label>
              <input
                type="text"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                placeholder="KR1"
                className="w-full px-2.5 py-1.5 text-xs bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-riot-red"
              />
            </div>
          </div>

          {/* Region and Match Count */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                Default Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-riot-red cursor-pointer"
              >
                {SUPPORTED_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                Batch Sample Size
              </label>
              <select
                value={matchCount}
                onChange={(e) => setMatchCount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-riot-red cursor-pointer"
              >
                <option value={10}>10 Games</option>
                <option value={20}>20 Games (Recommended)</option>
                <option value={30}>30 Games</option>
                <option value={40}>40 Games</option>
                <option value={50}>50 Games</option>
              </select>
            </div>
          </div>

          {/* Automated Game Detection & VOD Recording Option */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="pr-4">
              <div className="font-bold text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-riot-red" />
                <span>Automated Game Detection & VODs</span>
              </div>
              <div className="text-[10px] text-neutral-400">
                Auto-detect live League matches (Practice Tool, Normals, Ranked) & enable VOD studio
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={enableVodRecording}
                onChange={(e) => setEnableVodRecording(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-riot-red"></div>
            </label>
          </div>

          {/* Local Cache Management */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">Cache Purge</div>
              <div className="text-[10px] text-neutral-400">Flush locally saved match payloads</div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs hover:border-riot-red transition-all cursor-pointer"
            >
              <Trash2 className="w-3 h-3 text-riot-red" />
              <span>Purge Cache</span>
            </button>
          </div>

          {/* Live App Updates via GitHub */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1.5">
                  <ArrowUpCircle className="w-3.5 h-3.5 text-riot-red" />
                  <span>Version Distribution</span>
                </div>
                <div className="text-[10px] text-neutral-400">
                  Build v{appVersion} • GitHub Releases Channel
                </div>
              </div>
              <button
                type="button"
                onClick={handleCheckUpdate}
                disabled={isCheckingUpdate || isDownloading}
                className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs hover:border-riot-red transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingUpdate ? "animate-spin" : ""}`} />
                <span>Check Updates</span>
              </button>
            </div>

            {updateStatus && (
              <div className="p-2 rounded-sm bg-neutral-100 dark:bg-[#141721] border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-700 dark:text-neutral-300">
                <p>{updateStatus}</p>
                {availableUpdate && !isDownloading && (
                  <button
                    type="button"
                    onClick={handleInstallUpdate}
                    className="mt-1.5 w-full py-1 px-2.5 rounded-sm bg-riot-red text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-riot-redHover transition-all cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download & Apply</span>
                  </button>
                )}
                {isDownloading && downloadProgress !== null && (
                  <div className="mt-2 space-y-1">
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-riot-red h-full transition-all"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400">Downloading: {downloadProgress}%</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-4 py-1.5 rounded-sm bg-riot-red hover:bg-riot-redHover text-white text-xs font-bold uppercase transition-all shadow-sm cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
