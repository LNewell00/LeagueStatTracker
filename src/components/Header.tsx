import React, { useState } from "react";
import { Search, Settings, RefreshCw, Radio, ShieldAlert, Sparkles } from "lucide-react";
import { SUPPORTED_REGIONS } from "../types/riot";

interface HeaderProps {
  gameName: string;
  tagLine: string;
  region: string;
  isLoading: boolean;
  isLiveGameActive: boolean;
  onSearch: (gameName: string, tagLine: string, region: string) => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  gameName,
  tagLine,
  region,
  isLoading,
  isLiveGameActive,
  onSearch,
  onOpenSettings,
  hasApiKey,
}) => {
  const [inputRiotId, setInputRiotId] = useState(`${gameName}#${tagLine}`);
  const [selectedRegion, setSelectedRegion] = useState(region?.toLowerCase() || "na");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = inputRiotId.split("#");
    const name = parts[0]?.trim() || "";
    const tag = parts[1]?.trim() || "NA1";
    if (name) {
      onSearch(name, tag, selectedRegion);
    }
  };

  return (
    <header className="border-b border-riot-border/70 bg-riot-dark/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-riot-accent/20 via-riot-accent to-emerald-400 p-[1px] shadow-neon-cyan">
            <div className="w-full h-full bg-riot-darkest rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-riot-accent" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-wider text-slate-100 uppercase">
                League<span className="text-riot-accent">Tracker</span>
              </h1>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-riot-accent/10 text-riot-accent border border-riot-accent/30">
                v2 Native
              </span>
            </div>
            <p className="text-xs text-slate-400">Riot Match V5 & Live Client Engine</p>
          </div>
        </div>

        {/* Search Bar & Region Picker */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-xl">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inputRiotId}
              onChange={(e) => setInputRiotId(e.target.value)}
              placeholder="Search Riot ID (e.g. Faker#KR1)"
              className="w-full pl-9 pr-4 py-2 text-sm bg-riot-surface border border-riot-border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-riot-accent focus:ring-1 focus:ring-riot-accent transition-all"
            />
          </div>

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-riot-surface border border-riot-border text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-riot-accent cursor-pointer"
          >
            {SUPPORTED_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-riot-accent/10 border border-riot-accent/40 text-riot-accent font-medium text-sm hover:bg-riot-accent/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Fetch</span>
          </button>
        </form>

        {/* Live Client Status & Settings */}
        <div className="flex items-center gap-3">
          {/* Live client badge indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isLiveGameActive
                ? "bg-neon-winBadge/40 border-neon-win/40 text-neon-win shadow-neon-win"
                : "bg-riot-surface/80 border-riot-border text-slate-400"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveGameActive ? "animate-pulse text-neon-win" : "text-slate-500"}`} />
            <span>{isLiveGameActive ? "LIVE GAME DETECTED" : "Client Standby"}</span>
          </div>

          {/* Missing API Key warning indicator if empty */}
          {!hasApiKey && (
            <button
              onClick={onOpenSettings}
              title="Riot API Key not configured"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">API Key</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-riot-surface border border-riot-border text-slate-300 hover:text-white hover:border-riot-accent transition-all"
            title="Settings & Config"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

