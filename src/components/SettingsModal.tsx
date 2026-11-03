import React, { useState } from "react";
import { AppPreferences, savePreferences, clearLocalCache } from "../services/storage";
import { X, Key, Trash2, ExternalLink, Check, RefreshCw, ArrowUpCircle, Download } from "lucide-react";
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
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Auto-updater states
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [availableUpdate, setAvailableUpdate] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

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
        setUpdateStatus("You are running the latest version (v0.1.0).");
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
            className="p-1 rounded-sm text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4">
          {/* Riot API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Riot API Developer Key
              </label>
              <a
                href="https://developer.riotgames.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-riot-red hover:underline flex items-center gap-1"
              >
                <span>Get Key</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-3 py-1.5 text-xs bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-riot-red"
            />
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Personal keys refresh every 24h. Persisted locally in encrypted storage.
            </p>
          </div>

          {/* Default Account & Region */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                Default Summoner Name
              </label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="e.g. Faker"
                className="w-full px-2.5 py-1.5 text-xs bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-riot-red"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                placeholder="e.g. KR1"
                className="w-full px-2.5 py-1.5 text-xs bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-riot-red"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                Default Server
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

          {/* Local Cache Management */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">Cache Purge</div>
              <div className="text-[10px] text-neutral-400">Flush locally saved match payloads</div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs hover:border-riot-red transition-all"
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
                  Build v0.1.0 • GitHub Releases Channel
                </div>
              </div>
              <button
                type="button"
                onClick={handleCheckUpdate}
                disabled={isCheckingUpdate || isDownloading}
                className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs hover:border-riot-red transition-all disabled:opacity-50"
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
                    className="mt-1.5 w-full py-1 px-2.5 rounded-sm bg-riot-red text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-riot-redHover transition-all"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download & Apply</span>
                  </button>
                )}
                {isDownloading && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex justify-between text-[9px] text-neutral-400">
                      <span>Downloading patch...</span>
                      <span>{downloadProgress !== null ? `${downloadProgress}%` : "Wait..."}</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-none h-1 overflow-hidden">
                      <div
                        className="bg-riot-red h-full transition-all duration-300"
                        style={{ width: `${downloadProgress || 50}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-sm text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-4 py-1.5 rounded bg-riot-red text-white font-bold text-xs hover:bg-riot-redHover active:scale-95 transition-all shadow-sm"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
