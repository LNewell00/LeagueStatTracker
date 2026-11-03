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
    <div className="bg-gradient-to-r from-riot-card via-riot-surface to-riot-card border border-riot-border rounded-2xl p-5 shadow-lg relative overflow-hidden">
      {/* Decorative Seraphine & Yuumi background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
        {/* Left: Player ID & Win Rate Ring */}
        <div className="flex items-center gap-5 w-full lg:w-auto">
          {/* Win Rate Donut / Meter */}
          <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              {/* Background Circle */}
              <path
                className="text-riot-border stroke-current"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Foreground Neon Progress */}
              <path
                className={`${
                  isPositiveWinRate ? "text-neon-win" : "text-neon-loss"
                } stroke-current transition-all duration-1000 ease-out`}
                strokeDasharray={`${summary.winRate}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-base font-extrabold ${isPositiveWinRate ? "text-neon-win" : "text-neon-loss"}`}>
                {summary.winRate}%
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">WR</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">{summonerName}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-riot-border text-slate-300 font-medium">
                Last {summary.totalGames} Matches
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-medium">
              <span className="text-neon-win font-semibold">{summary.wins}W</span>
              <span>-</span>
              <span className="text-neon-loss font-semibold">{summary.losses}L</span>
              <span>•</span>
              <span>CS/min: <strong className="text-slate-200">{summary.avgCsPerMin}</strong></span>
            </div>
          </div>
        </div>

        {/* Center: Key Stats Cards */}
        <div className="grid grid-cols-3 gap-3 w-full lg:w-auto flex-1 max-w-xl">
          {/* Card 1: Total Games */}
          <div className="bg-riot-darkest/60 border border-riot-border/70 rounded-xl p-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Trophy className="w-3.5 h-3.5 text-riot-gold" />
              <span>Total Games</span>
            </div>
            <span className="text-lg font-bold text-slate-100">{summary.totalGames}</span>
          </div>

          {/* Card 2: Average KDA */}
          <div className="bg-riot-darkest/60 border border-riot-border/70 rounded-xl p-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Crosshair className="w-3.5 h-3.5 text-riot-accent" />
              <span>Avg KDA</span>
            </div>
            <div className="text-center">
              <span className="text-lg font-bold text-slate-100">
                {summary.avgKills} / <span className="text-neon-loss">{summary.avgDeaths}</span> / {summary.avgAssists}
              </span>
              <div className="text-[11px] font-semibold text-riot-accent">{summary.kdaRatio}:1 Ratio</div>
            </div>
          </div>

          {/* Card 3: Performance Rating */}
          <div className="bg-riot-darkest/60 border border-riot-border/70 rounded-xl p-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Swords className="w-3.5 h-3.5 text-emerald-400" />
              <span>Win Ratio</span>
            </div>
            <span className={`text-lg font-bold ${isPositiveWinRate ? "text-neon-win" : "text-neon-loss"}`}>
              {summary.winRate}%
            </span>
          </div>
        </div>

        {/* Right: Top Champions Mini Showcase */}
        {summary.topChampions.length > 0 && (
          <div className="hidden xl:flex flex-col gap-1.5 border-l border-riot-border/50 pl-5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-riot-gold" />
              <span>Top Champions</span>
            </div>
            <div className="flex items-center gap-2">
              {summary.topChampions.slice(0, 3).map((c) => (
                <div key={c.championName} className="flex flex-col items-center group relative">
                  <div className="w-9 h-9 rounded-lg overflow-hidden border border-riot-border group-hover:border-riot-accent transition-all">
                    <img
                      src={getChampionIconUrl(c.championName)}
                      alt={c.championName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className={`text-[10px] font-bold mt-0.5 ${c.winRate >= 50 ? "text-neon-win" : "text-neon-loss"}`}>
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

