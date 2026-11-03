import React from "react";
import { PlayerStatsSummary } from "../types/riot";
import { Trophy, Swords, Crosshair, Award } from "lucide-react";
import { getChampionIconUrl } from "../services/ddragon";

interface StatsOverviewProps {
  summary: PlayerStatsSummary;
  summonerName: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ summary, summonerName }) => {
  const isPositiveWinRate = summary.winRate >= 50;

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left: Player ID & Win Rate Meter */}
        <div className="flex items-center gap-4 w-full lg:w-auto">
          {/* Win Rate Donut */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center font-mono">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-neutral-200 dark:text-neutral-800 stroke-current"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${
                  isPositiveWinRate ? "text-emerald-500" : "text-riot-red"
                } stroke-current transition-all duration-700 ease-out`}
                strokeDasharray={`${summary.winRate}, 100`}
                strokeWidth="3.5"
                strokeLinecap="butt"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-sm font-bold tabular-nums ${isPositiveWinRate ? "text-emerald-600 dark:text-emerald-400" : "text-riot-red"}`}>
                {summary.winRate}%
              </span>
              <span className="text-[9px] uppercase font-bold text-neutral-400">WR</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                {summonerName}
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 font-bold">
                {summary.totalGames} GAMES SAMPLE
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs font-mono text-neutral-500 dark:text-neutral-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{summary.wins}W</span>
              <span>/</span>
              <span className="text-riot-red font-bold">{summary.losses}L</span>
              <span>•</span>
              <span>CS/M: <strong className="text-neutral-800 dark:text-neutral-200">{summary.avgCsPerMin}</strong></span>
            </div>
          </div>
        </div>

        {/* Center: Integrated Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full lg:w-auto flex-1 max-w-2xl xl:max-w-3xl">
          {/* Metric 1: Sample Size */}
          <div className="bg-neutral-50 dark:bg-[#12151f] border border-neutral-200 dark:border-neutral-800 rounded p-2.5 flex flex-col items-center justify-center font-mono">
            <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">
              <Trophy className="w-3 h-3 text-amber-500" />
              <span>Total Tracked</span>
            </div>
            <span className="text-base font-black text-neutral-900 dark:text-neutral-100 tabular-nums">
              {summary.totalGames} Matches
            </span>
          </div>

          {/* Metric 2: Average KDA */}
          <div className="bg-neutral-50 dark:bg-[#12151f] border border-neutral-200 dark:border-neutral-800 rounded p-2.5 flex flex-col items-center justify-center font-mono">
            <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">
              <Crosshair className="w-3 h-3 text-riot-red" />
              <span>Average KDA</span>
            </div>
            <div className="text-center">
              <span className="text-sm font-black text-neutral-900 dark:text-neutral-100 tabular-nums">
                {summary.avgKills} / <span className="text-riot-red">{summary.avgDeaths}</span> / {summary.avgAssists}
              </span>
              <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">
                {summary.kdaRatio}:1 Ratio
              </div>
            </div>
          </div>

          {/* Metric 3: Win Ratio */}
          <div className="bg-neutral-50 dark:bg-[#12151f] border border-neutral-200 dark:border-neutral-800 rounded p-2.5 flex flex-col items-center justify-center font-mono">
            <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">
              <Swords className="w-3 h-3 text-emerald-500" />
              <span>Win Ratio</span>
            </div>
            <span className={`text-base font-black tabular-nums ${isPositiveWinRate ? "text-emerald-600 dark:text-emerald-400" : "text-riot-red"}`}>
              {summary.winRate}%
            </span>
          </div>
        </div>

        {/* Right: Top Champions Mini Matrix */}
        {summary.topChampions.length > 0 && (
          <div className="hidden xl:flex flex-col gap-1 border-l border-neutral-200 dark:border-neutral-800 pl-4">
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
              <Award className="w-3 h-3 text-amber-500" />
              <span>Pool Leaders</span>
            </div>
            <div className="flex items-center gap-1.5">
              {summary.topChampions.slice(0, 3).map((c) => (
                <div key={c.championName} className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-900">
                    <img
                      src={getChampionIconUrl(c.championName)}
                      alt={c.championName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className={`text-[9px] font-mono font-bold mt-0.5 tabular-nums ${c.winRate >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-riot-red"}`}>
                    {c.winRate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
