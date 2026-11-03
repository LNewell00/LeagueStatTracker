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
    };
    savePreferences(newPrefs);
    onSavePreferences(newPrefs);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = async () => {
    if (confirm("Are you sure you want to clear the local match cache?")) {
      await clearLocalCache();
      onCacheCleared();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-riot-card border border-riot-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-riot-border bg-riot-surface/50">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-riot-accent" />
            <h3 className="text-base font-bold text-slate-100">Application Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-riot-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Riot API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Riot API Key
              </label>
              <a
                href="https://developer.riotgames.com/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-riot-accent hover:underline flex items-center gap-1"
              >
                <span>Get Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-3.5 py-2.5 text-sm bg-riot-darkest border border-riot-border rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-riot-accent"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Personal Riot Developer keys refresh every 24 hours. Stored locally on your machine.
            </p>
          </div>

          {/* Default Account & Region */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5">
                Default Game Name
              </label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="e.g. Faker"
                className="w-full px-3 py-2 text-sm bg-riot-darkest border border-riot-border rounded-xl text-slate-100 focus:outline-none focus:border-riot-accent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5">
                Default Tagline
              </label>
              <input
                type="text"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                placeholder="e.g. KR1"
                className="w-full px-3 py-2 text-sm bg-riot-darkest border border-riot-border rounded-xl text-slate-100 focus:outline-none focus:border-riot-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5">
              Default Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-riot-darkest border border-riot-border rounded-xl text-slate-200 focus:outline-none focus:border-riot-accent cursor-pointer"
            >
              {SUPPORTED_REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Local Cache Management */}
          <div className="pt-2 border-t border-riot-border/50 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">Local Cache</div>
              <div className="text-[11px] text-slate-500">Purge cached match histories to force re-fetch</div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cache</span>
            </button>
          </div>

          {/* Live App Updates via GitHub */}
          <div className="pt-2 border-t border-riot-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <ArrowUpCircle className="w-3.5 h-3.5 text-riot-accent" />
                  <span>Application Updates</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Version 0.1.0 • Connected to GitHub Releases
                </div>
              </div>
              <button
                type="button"
                onClick={handleCheckUpdate}
                disabled={isCheckingUpdate || isDownloading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-riot-surface border border-riot-border text-slate-200 text-xs font-medium hover:border-riot-accent transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? "animate-spin" : ""}`} />
                <span>Check for Updates</span>
              </button>
            </div>

            {updateStatus && (
              <div className="p-2.5 rounded-xl bg-riot-darkest border border-riot-border text-xs text-slate-300">
                <p>{updateStatus}</p>
                {availableUpdate && !isDownloading && (
                  <button
                    type="button"
                    onClick={handleInstallUpdate}
                    className="mt-2 w-full py-1.5 px-3 rounded-lg bg-emerald-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-400 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download & Relaunch</span>
                  </button>
                )}
                {isDownloading && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Downloading update...</span>
                      <span>{downloadProgress !== null ? `${downloadProgress}%` : "Please wait..."}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-riot-accent h-1.5 transition-all duration-300"
                        style={{ width: `${downloadProgress || 50}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-riot-surface transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-riot-accent text-riot-darkest font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-neon-cyan"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

