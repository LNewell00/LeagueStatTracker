import React, { useState, useEffect } from "react";
import { Search, Settings, RefreshCw, Radio, ShieldAlert, Sun, Moon } from "lucide-react";
import { SUPPORTED_REGIONS } from "../types/riot";

interface HeaderProps {
  gameName: string;
  tagLine: string;
  region: string;
  matchCount?: number;
  isLoading: boolean;
  isLiveGameActive: boolean;
  onSearch: (gameName: string, tagLine: string, region: string, count: number) => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  gameName,
  tagLine,
  region,
  matchCount = 20,
  isLoading,
  isLiveGameActive,
  onSearch,
  onOpenSettings,
  hasApiKey,
  theme = "dark",
  onToggleTheme,
}) => {
  const [inputRiotId, setInputRiotId] = useState(`${gameName}#${tagLine}`);
  const [selectedRegion, setSelectedRegion] = useState(region?.toLowerCase() || "na");
  const [selectedCount, setSelectedCount] = useState<number>(matchCount);

  useEffect(() => {
    if (gameName && tagLine) {
      setInputRiotId(`${gameName}#${tagLine}`);
    }
  }, [gameName, tagLine]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = inputRiotId.split("#");
    const name = parts[0]?.trim() || "";
    const tag = parts[1]?.trim() || "NA1";
    if (name) {
      onSearch(name, tag, selectedRegion, selectedCount);
    }
  };

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] sticky top-0 z-40 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-riot-red flex items-center justify-center text-white font-black text-xs tracking-tighter shrink-0 select-none shadow-sm">
            LST
          </div>
          <div className="flex items-baseline gap-1.5 select-none">
            <span className="text-base font-black tracking-wider uppercase text-neutral-900 dark:text-white">
              LEAGUE
            </span>
            <span className="text-base font-black tracking-wider uppercase text-riot-red">
              ANALYTICS
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 dark:text-neutral-300 ml-1">
              PRO
            </span>
          </div>
        </div>

        {/* Search Bar & Region Selector - Market Integrated Form */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-1.5 w-full md:w-auto flex-1 max-w-2xl xl:max-w-3xl"
        >
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-neutral-500 dark:text-neutral-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={inputRiotId}
              onChange={(e) => setInputRiotId(e.target.value)}
              placeholder="Search Riot ID (e.g. Faker#KR1)"
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700/80 rounded text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:border-riot-red focus:ring-1 focus:ring-riot-red transition-all"
            />
          </div>

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="shrink-0 bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700/80 text-neutral-800 dark:text-neutral-200 text-xs font-mono rounded px-2.5 py-1.5 focus:outline-none focus:border-riot-red cursor-pointer"
          >
            {SUPPORTED_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCount}
            onChange={(e) => setSelectedCount(Number(e.target.value))}
            className="shrink-0 bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700/80 text-neutral-800 dark:text-neutral-200 text-xs font-mono rounded px-2 py-1.5 focus:outline-none focus:border-riot-red cursor-pointer"
            title="Number of matches"
          >
            <option value={10}>10G</option>
            <option value={20}>20G</option>
            <option value={30}>30G</option>
            <option value={40}>40G</option>
            <option value={50}>50G</option>
          </select>

          <button
            type="submit"
            disabled={isLoading}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded bg-riot-red text-white font-bold text-xs hover:bg-riot-redHover active:scale-95 transition-all disabled:opacity-50 select-none shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
        </form>

        {/* Live Client Status, Theme Toggle, Settings */}
        <div className="flex items-center gap-2">
          {/* Live client badge indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono uppercase tracking-wider font-semibold transition-all select-none ${
              isLiveGameActive
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                : "bg-neutral-100 dark:bg-[#141721] border-neutral-300 dark:border-neutral-700/70 text-neutral-500 dark:text-neutral-400"
            }`}
          >
            <Radio
              className={`w-3 h-3 ${isLiveGameActive ? "text-emerald-500 animate-pulse" : "text-neutral-400"}`}
            />
            <span>{isLiveGameActive ? "Live Match" : "Standby"}</span>
          </div>

          {/* Missing API Key warning indicator if empty */}
          {!hasApiKey && (
            <button
              onClick={onOpenSettings}
              title="Riot API Key not configured"
              className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">API Key</span>
            </button>
          )}

          {/* Dark / Light Mode Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700/80 text-neutral-700 dark:text-neutral-300 hover:text-riot-red dark:hover:text-riot-red transition-all"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700/80 text-neutral-700 dark:text-neutral-300 hover:text-riot-red dark:hover:text-riot-red transition-all"
            title="Settings & Config"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
