import React, { useMemo } from "react";
import { PlayerStatsSummary, RankedEntry, ParsedMatch, MmrDataPoint } from "../types/riot";
import { Swords, Crosshair, Award, Target, AlertTriangle } from "lucide-react";
import { getChampionIconUrl } from "../services/ddragon";
import {
  calculateRankUpForecast,
  getQueueMeta,
  TIER_COLORS,
} from "../services/rankedAnalytics";

interface StatsOverviewProps {
  summary: PlayerStatsSummary;
  summonerName: string;
  currentRank?: RankedEntry | null;
  matches?: ParsedMatch[];
  mmrPoints?: MmrDataPoint[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  summary,
  summonerName,
  currentRank,
  matches = [],
  mmrPoints = [],
}) => {
  const isPositiveWinRate = summary.winRate >= 50;

  // Calculate promotion forecast & target
  const forecast = useMemo(() => {
    return calculateRankUpForecast(currentRank || null, matches, mmrPoints);
  }, [currentRank, matches, mmrPoints]);

  const tierColors = TIER_COLORS[forecast.currentTier] || TIER_COLORS.GOLD;
  const targetColors = TIER_COLORS[forecast.targetTier] || TIER_COLORS.GOLD;

  // Calculate game distribution across queues in current match sample
  const queueBreakdown = useMemo(() => {
    const counts: Record<string, { name: string; count: number; color: string }> = {};
    matches.forEach((m) => {
      const meta = getQueueMeta(m.queueId, m.gameMode);
      if (!counts[meta.category]) {
        counts[meta.category] = { name: meta.shortLabel, count: 0, color: meta.color };
      }
      counts[meta.category].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [matches]);

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded shadow-sm divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
      {/* ========================================================= */}
      {/* SECTION 1: RANKED STANDING & PROMOTION FORECASTER         */}
      {/* ========================================================= */}
      <div className="p-4 sm:p-5 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 sm:gap-6">
        {/* Current Rank & LP Gauge */}
        <div className="flex items-center gap-4 min-w-[320px]">
          <div
            className={`w-14 h-14 rounded-sm border ${tierColors.border} ${tierColors.bg} flex items-center justify-center shrink-0 text-amber-500 shadow-sm`}
          >
            <Award className="w-7 h-7" style={{ color: tierColors.hex }} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <span
                className="text-lg font-black uppercase tracking-wider"
                style={{ color: tierColors.hex }}
              >
                {forecast.currentTier} {forecast.currentRank}
              </span>
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {forecast.currentLp} LP
              </span>
            </div>

            {/* Precision LP Progress Bar */}
            <div className="mt-2 w-full bg-neutral-200 dark:bg-neutral-800 rounded-none h-2 overflow-hidden flex">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${Math.min(100, forecast.currentLp)}%`, backgroundColor: tierColors.hex }}
              />
            </div>

            <div className="mt-1.5 flex items-center justify-between text-xs text-neutral-400 tabular-nums">
              <span>{forecast.currentLp} / 100 LP</span>
              {currentRank && (
                <span>
                  Ranked: <strong className="text-neutral-700 dark:text-neutral-300">{currentRank.wins}W {currentRank.losses}L</strong> ({forecast.rankedWinRate}%)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Promotion Forecaster / Win Target Calculator */}
        <div className="flex-1 w-full bg-neutral-50 dark:bg-[#12151f] border border-neutral-200 dark:border-neutral-800 rounded-sm p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-riot-red" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                Promotion Forecast:
              </span>
              <span className="text-xs sm:text-sm font-black" style={{ color: targetColors.hex }}>
                ➔ {forecast.targetLabel}
              </span>
              <span className="text-xs text-neutral-400">
                ({forecast.lpToPromote} LP away)
              </span>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Target Pace: Need <strong className="text-emerald-600 dark:text-emerald-400 font-black">~{forecast.netWinsNeeded} Net Wins</strong> at current gain pace (<strong className="text-emerald-600 dark:text-emerald-400">+{forecast.avgLpGain} LP</strong> / <strong className="text-riot-red">-{forecast.avgLpLoss} LP</strong>).
            </p>
          </div>

          {/* Quick Scenario Pills */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs tabular-nums">
            <span className="text-neutral-400 uppercase font-bold text-[10px]">Scenarios:</span>
            {forecast.scenarios.slice(0, 2).map((sc, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-sm bg-white dark:bg-[#181d2c] border border-neutral-300 dark:border-neutral-700 font-bold text-neutral-800 dark:text-neutral-200"
                title={`${sc.record} results in ${sc.netGain > 0 ? `+${sc.netGain}` : sc.netGain} net LP`}
              >
                {sc.record} (+{sc.netGain} LP)
              </span>
            ))}
          </div>
        </div>

        {/* Demotion Shield Alert if LP is low */}
        {forecast.demotionRisk && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs shrink-0">
            <AlertTriangle className="w-4 h-4" />
            <span>{forecast.demotionWarning}</span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: QUEUE DISTRIBUTION & COMBAT METRICS            */}
      {/* ========================================================= */}
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left: Overall Win Rate Donut & Identity */}
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
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
              <span className={`text-sm font-black tabular-nums ${isPositiveWinRate ? "text-emerald-600 dark:text-emerald-400" : "text-riot-red"}`}>
                {summary.winRate}%
              </span>
              <span className="text-[9px] uppercase font-bold text-neutral-400">WR</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                {summonerName}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 font-bold">
                {summary.totalGames} Games Batch
              </span>
            </div>
            <div className="flex items-center gap-2.5 mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 tabular-nums">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{summary.wins}W</span>
              <span>/</span>
              <span className="text-riot-red font-bold">{summary.losses}L</span>
              <span>•</span>
              <span>CS/M: <strong className="text-neutral-800 dark:text-neutral-200">{summary.avgCsPerMin}</strong></span>
            </div>
          </div>
        </div>

        {/* Center: What games are being played (Queue distribution strip) */}
        {queueBreakdown.length > 0 && (
          <div className="w-full lg:w-auto flex-1 max-w-md bg-neutral-50 dark:bg-[#12151f] p-3 rounded-sm border border-neutral-200 dark:border-neutral-800">
            <div className="text-[10px] sm:text-[11px] uppercase font-bold text-neutral-400 tracking-wider mb-1.5 flex items-center justify-between">
              <span>Game Modes Played</span>
              <span>{summary.totalGames} Total</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {queueBreakdown.map((q) => (
                <div
                  key={q.name}
                  className="px-2.5 py-1 rounded-sm bg-white dark:bg-[#181d2c] border border-neutral-200 dark:border-neutral-700 text-xs font-bold flex items-center gap-1.5 tabular-nums"
                >
                  <span className={q.color}>{q.name}:</span>
                  <strong className="text-neutral-800 dark:text-neutral-200">{q.count}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Center: Key Combat Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
          {/* Average KDA */}
          <div className="bg-neutral-50 dark:bg-[#12151f] border border-neutral-200 dark:border-neutral-800 rounded p-3 min-w-[130px] flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-neutral-500 text-[10px] uppercase font-bold tracking-wider mb-1">
              <Crosshair className="w-3.5 h-3.5 text-riot-red" />
              <span>Average KDA</span>
            </div>
            <span className="text-sm sm:text-base font-black text-neutral-900 dark:text-neutral-100 tabular-nums">
              {summary.avgKills} / <span className="text-riot-red">{summary.avgDeaths}</span> / {summary.avgAssists}
            </span>
            <span className="text-xs text-neutral-400 mt-0.5">{summary.kdaRatio}:1 Ratio</span>
          </div>

          {/* Win Ratio */}
          <div className="bg-neutral-50 dark:bg-[#12151f] border border-neutral-200 dark:border-neutral-800 rounded p-3 min-w-[130px] flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-neutral-500 text-[10px] uppercase font-bold tracking-wider mb-1">
              <Swords className="w-3.5 h-3.5 text-emerald-500" />
              <span>Win Pace</span>
            </div>
            <span className={`text-sm sm:text-base font-black tabular-nums ${isPositiveWinRate ? "text-emerald-600 dark:text-emerald-400" : "text-riot-red"}`}>
              {summary.winRate}% WR
            </span>
            <span className="text-xs text-neutral-400 mt-0.5">{summary.wins}W - {summary.losses}L</span>
          </div>
        </div>

        {/* Right: Pool Leaders */}
        {summary.topChampions.length > 0 && (
          <div className="hidden xl:flex flex-col gap-1.5 border-l border-neutral-200 dark:border-neutral-800 pl-5">
            <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Most Played</span>
            </div>
            <div className="flex items-center gap-2">
              {summary.topChampions.slice(0, 3).map((c) => (
                <div key={c.championName} className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-900 shadow-sm">
                    <img
                      src={getChampionIconUrl(c.championName)}
                      alt={c.championName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className={`text-[10px] font-bold mt-1 tabular-nums ${c.winRate >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-riot-red"}`}>
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
