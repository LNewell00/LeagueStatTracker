import React, { useState } from "react";
import { MmrDataPoint, RankedEntry } from "../types/riot";
import { getChampionIconUrl } from "../services/ddragon";
import {
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  Target,
} from "lucide-react";

interface MmrGraphProps {
  dataPoints: MmrDataPoint[];
  currentRank?: RankedEntry | null;
}

export const MmrGraph: React.FC<MmrGraphProps> = ({ dataPoints, currentRank }) => {
  const [hoveredPoint, setHoveredPoint] = useState<MmrDataPoint | null>(null);

  if (!dataPoints || dataPoints.length === 0) {
    return null;
  }

  // Calculate MMR bounds for chart scaling
  const mmrValues = dataPoints.map((d) => d.mmr);
  const minMmr = Math.min(...mmrValues) - 25;
  const maxMmr = Math.max(...mmrValues) + 25;
  const range = Math.max(50, maxMmr - minMmr);

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 30;
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;

  // Coordinate mapping
  const getX = (index: number) => {
    if (dataPoints.length === 1) return paddingX + innerWidth / 2;
    return paddingX + (index / (dataPoints.length - 1)) * innerWidth;
  };

  const getY = (mmr: number) => {
    return paddingY + innerHeight - ((mmr - minMmr) / range) * innerHeight;
  };

  const points = dataPoints.map((d, i) => `${getX(i)},${getY(d.mmr)}`).join(" ");

  const areaPath =
    dataPoints.length > 0
      ? `M ${getX(0)},${getY(dataPoints[0].mmr)} ` +
        dataPoints.slice(1).map((d, i) => `L ${getX(i + 1)},${getY(d.mmr)}`).join(" ") +
        ` L ${getX(dataPoints.length - 1)},${paddingY + innerHeight} L ${getX(0)},${paddingY + innerHeight} Z`
      : "";

  const firstMmr = dataPoints[0].mmr;
  const lastMmr = dataPoints[dataPoints.length - 1].mmr;
  const netMmrChange = lastMmr - firstMmr;
  const winsCount = dataPoints.filter((d) => d.win).length;
  const winRate = Math.round((winsCount / dataPoints.length) * 100);
  const peakMmr = Math.max(...mmrValues);

  const latestPoint = dataPoints[dataPoints.length - 1];
  const displayTier = currentRank?.tier || latestPoint.tier;
  const displayRank = currentRank?.rank || latestPoint.rank;
  const displayLp = currentRank?.leaguePoints ?? latestPoint.lp;

  const formatRankName = (t: string) => {
    return t ? t.charAt(0) + t.slice(1).toLowerCase() : "Gold";
  };

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded p-4 shadow-sm">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
        {/* Left: Ranked status badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-amber-500">
            <Award className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                MMR Analytics Curve
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {formatRankName(displayTier)} {displayRank} ({displayLp} LP)
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-400 mt-0.5">
              ELO progression ticker across last {dataPoints.length} games
            </p>
          </div>
        </div>

        {/* Right: Key MMR Indicators */}
        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
          <div className="bg-neutral-50 dark:bg-[#12151f] px-3 py-1.5 rounded-sm border border-neutral-200 dark:border-neutral-800 text-right">
            <div className="text-[9px] text-neutral-400 uppercase font-semibold">Current MMR</div>
            <div className="text-sm font-black text-neutral-900 dark:text-neutral-100">
              {lastMmr.toLocaleString()}
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-[#12151f] px-3 py-1.5 rounded-sm border border-neutral-200 dark:border-neutral-800 text-right">
            <div className="text-[9px] text-neutral-400 uppercase font-semibold">Net Shift</div>
            <div
              className={`text-sm font-black flex items-center gap-0.5 justify-end ${
                netMmrChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-riot-red"
              }`}
            >
              {netMmrChange >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{netMmrChange >= 0 ? `+${netMmrChange}` : netMmrChange}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive SVG Chart */}
      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 md:h-52 overflow-visible select-none"
        >
          <defs>
            <linearGradient id="tradingAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eb0029" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#eb0029" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal Reference Lines */}
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = paddingY + innerHeight * (1 - pct);
            const labelMmr = Math.round(minMmr + pct * range);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="currentColor"
                  className="text-neutral-200 dark:text-neutral-800/80"
                  strokeDasharray="2 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-neutral-400 font-mono font-medium"
                >
                  {labelMmr}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#tradingAreaGradient)" />}

          {/* Main Trend Line */}
          <polyline
            fill="none"
            stroke="#eb0029"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Interactive Data Points */}
          {dataPoints.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.mmr);
            const isHovered = hoveredPoint?.matchId === d.matchId;

            return (
              <g
                key={d.matchId}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(d)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle cx={cx} cy={cy} r="12" fill="transparent" />

                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="7"
                    fill={d.win ? "#10b981" : "#eb0029"}
                    fillOpacity="0.2"
                  />
                )}

                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 4.5 : 3}
                  fill={d.win ? "#10b981" : "#eb0029"}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {(isHovered ||
                  dataPoints.length <= 15 ||
                  i === 0 ||
                  i === dataPoints.length - 1 ||
                  (dataPoints.length <= 25 ? i % 2 === 0 : i % 5 === 0)) && (
                  <text
                    x={cx}
                    y={paddingY + innerHeight + 14}
                    textAnchor="middle"
                    className={`text-[8px] font-mono ${
                      isHovered ? "fill-riot-red font-bold" : "fill-neutral-400"
                    }`}
                  >
                    G{d.matchIndex}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-white dark:bg-[#151924] border border-neutral-300 dark:border-neutral-700 rounded-sm p-2.5 shadow-md text-xs -translate-x-1/2 -translate-y-full transition-all duration-75 font-mono"
            style={{
              left: `${(getX(hoveredPoint.matchIndex - 1) / svgWidth) * 100}%`,
              top: `${(getY(hoveredPoint.mmr) / svgHeight) * 100 - 8}%`,
            }}
          >
            <div className="flex items-center gap-2 mb-1 pb-1 border-b border-neutral-200 dark:border-neutral-800">
              <div className="w-4 h-4 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700">
                <img
                  src={getChampionIconUrl(hoveredPoint.championName)}
                  alt={hoveredPoint.championName}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">{hoveredPoint.championName}</span>
              <span
                className={`text-[9px] font-bold px-1 py-0.2 rounded-sm ${
                  hoveredPoint.win
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-riot-red/15 text-riot-red"
                }`}
              >
                {hoveredPoint.win ? `+${hoveredPoint.delta}` : hoveredPoint.delta} MMR
              </span>
            </div>

            <div className="space-y-0.5 text-[10px] text-neutral-600 dark:text-neutral-300 tabular-nums">
              <div>
                Score: <strong className="text-neutral-900 dark:text-neutral-100">{hoveredPoint.kills}/{hoveredPoint.deaths}/{hoveredPoint.assists}</strong>
              </div>
              <div>
                Rank: <strong className="text-amber-500">{hoveredPoint.tier} {hoveredPoint.rank}</strong> ({hoveredPoint.lp} LP)
              </div>
              <div className="text-[9px] text-neutral-400 font-mono">
                Total MMR: {hoveredPoint.mmr.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Summary Stats */}
      <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 bg-neutral-50 dark:bg-[#12151f] px-2.5 py-1.5 rounded-sm border border-neutral-200 dark:border-neutral-800">
          <Target className="w-3.5 h-3.5 text-emerald-500" />
          <div>
            <div className="text-[9px] uppercase font-bold text-neutral-400">Trend WR</div>
            <div className="font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">{winRate}% ({winsCount}W-{dataPoints.length - winsCount}L)</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-neutral-50 dark:bg-[#12151f] px-2.5 py-1.5 rounded-sm border border-neutral-200 dark:border-neutral-800">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <div>
            <div className="text-[9px] uppercase font-bold text-neutral-400">Peak MMR</div>
            <div className="font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">{peakMmr.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-neutral-50 dark:bg-[#12151f] px-2.5 py-1.5 rounded-sm border border-neutral-200 dark:border-neutral-800">
          <Zap className="w-3.5 h-3.5 text-riot-red" />
          <div>
            <div className="text-[9px] uppercase font-bold text-neutral-400">Avg Shift</div>
            <div className={`font-bold tabular-nums ${netMmrChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-riot-red"}`}>
              {netMmrChange >= 0 ? `+${(netMmrChange / dataPoints.length).toFixed(1)}` : (netMmrChange / dataPoints.length).toFixed(1)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-neutral-50 dark:bg-[#12151f] px-2.5 py-1.5 rounded-sm border border-neutral-200 dark:border-neutral-800">
          <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          <div>
            <div className="text-[9px] uppercase font-bold text-neutral-400">Tier</div>
            <div className="font-bold text-neutral-800 dark:text-neutral-200">{formatRankName(displayTier)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
