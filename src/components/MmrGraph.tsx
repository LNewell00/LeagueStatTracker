import React, { useState } from "react";
import { MmrDataPoint, RankedEntry } from "../types/riot";
import { getChampionIconUrl } from "../services/ddragon";
import {
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  Target,
  Sparkles,
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

  // Generate SVG path points
  const points = dataPoints.map((d, i) => `${getX(i)},${getY(d.mmr)}`).join(" ");

  // Generate Area under curve path
  const areaPath = dataPoints.length > 0
    ? `M ${getX(0)},${getY(dataPoints[0].mmr)} ` +
      dataPoints.slice(1).map((d, i) => `L ${getX(i + 1)},${getY(d.mmr)}`).join(" ") +
      ` L ${getX(dataPoints.length - 1)},${paddingY + innerHeight} L ${getX(0)},${paddingY + innerHeight} Z`
    : "";

  // Progression summary metrics
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
    <div className="bg-riot-card/85 border border-riot-border rounded-2xl p-5 shadow-lg backdrop-blur-md relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-riot-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-riot-border/60 pb-4">
        {/* Left: Ranked status badge */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-riot-gold/30 via-riot-gold to-amber-200 p-[1px] shadow-neon-gold flex items-center justify-center">
            <div className="w-full h-full bg-riot-darkest rounded-[11px] flex items-center justify-center">
              <Award className="w-6 h-6 text-riot-gold" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 tracking-wide">
                Ranked Solo/Duo MMR Trend
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-riot-gold/10 text-riot-gold border border-riot-gold/30">
                {formatRankName(displayTier)} {displayRank} ({displayLp} LP)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Estimated ELO trajectory across your last {dataPoints.length} games
            </p>
          </div>
        </div>

        {/* Right: Key MMR Indicators */}
        <div className="flex items-center gap-4 text-xs">
          {/* Current MMR */}
          <div className="bg-riot-darkest/70 px-3 py-1.5 rounded-xl border border-riot-border/70 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Current MMR</div>
            <div className="text-sm font-extrabold text-riot-accent font-mono">
              {lastMmr.toLocaleString()}
            </div>
          </div>

          {/* Net Change */}
          <div className="bg-riot-darkest/70 px-3 py-1.5 rounded-xl border border-riot-border/70 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Net Shift</div>
            <div
              className={`text-sm font-extrabold font-mono flex items-center gap-1 justify-end ${
                netMmrChange >= 0 ? "text-neon-win" : "text-neon-loss"
              }`}
            >
              {netMmrChange >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{netMmrChange >= 0 ? `+${netMmrChange}` : netMmrChange}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive SVG Chart */}
      <div className="relative mt-4">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 md:h-56 overflow-visible select-none"
        >
          <defs>
            {/* Area gradient */}
            <linearGradient id="mmrAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ac8b9" stopOpacity="0.25" />
              <stop offset="85%" stopColor="#0ac8b9" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#0ac8b9" stopOpacity="0" />
            </linearGradient>

            {/* Line glow filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#0ac8b9" floodOpacity="0.6" />
            </filter>
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
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-slate-500 font-mono font-medium"
                >
                  {labelMmr}
                </text>
              </g>
            );
          })}

          {/* Area Fill Under Curve */}
          {areaPath && <path d={areaPath} fill="url(#mmrAreaGradient)" />}

          {/* Main Trend Line */}
          <polyline
            fill="none"
            stroke="#0ac8b9"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#neonGlow)"
            points={points}
          />

          {/* Interactive Data Points (Circles) */}
          {dataPoints.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.mmr);
            const isHovered = hoveredPoint?.matchId === d.matchId;

            return (
              <g
                key={d.matchId}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredPoint(d)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Transparent hit target for easy mouse hover */}
                <circle cx={cx} cy={cy} r="14" fill="transparent" />

                {/* Outer Ring on Hover */}
                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill="none"
                    stroke={d.win ? "#10b981" : "#f43f5e"}
                    strokeWidth="2"
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Center Node */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill={d.win ? "#10b981" : "#f43f5e"}
                  stroke="#070a0e"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {/* Match Number Label at Bottom */}
                <text
                  x={cx}
                  y={paddingY + innerHeight + 16}
                  textAnchor="middle"
                  className={`text-[9px] font-mono ${
                    isHovered ? "fill-riot-accent font-bold" : "fill-slate-500"
                  }`}
                >
                  G{d.matchIndex}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-riot-darkest/95 border border-riot-accent/50 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs -translate-x-1/2 -translate-y-full transition-all duration-100"
            style={{
              left: `${(getX(hoveredPoint.matchIndex - 1) / svgWidth) * 100}%`,
              top: `${(getY(hoveredPoint.mmr) / svgHeight) * 100 - 10}%`,
            }}
          >
            <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-riot-border">
              <div className="w-5 h-5 rounded overflow-hidden border border-riot-border">
                <img
                  src={getChampionIconUrl(hoveredPoint.championName)}
                  alt={hoveredPoint.championName}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-slate-100">{hoveredPoint.championName}</span>
              <span
                className={`text-[10px] font-black uppercase px-1.5 py-0.2 rounded ${
                  hoveredPoint.win
                    ? "bg-emerald-500/20 text-neon-win"
                    : "bg-rose-500/20 text-neon-loss"
                }`}
              >
                {hoveredPoint.win ? `+${hoveredPoint.delta}` : hoveredPoint.delta} MMR
              </span>
            </div>

            <div className="space-y-0.5 text-[11px] text-slate-300">
              <div>
                Score: <strong className="text-white">{hoveredPoint.kills}/{hoveredPoint.deaths}/{hoveredPoint.assists}</strong>
              </div>
              <div>
                Resulting Rank: <strong className="text-riot-gold">{hoveredPoint.tier} {hoveredPoint.rank}</strong> ({hoveredPoint.lp} LP)
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Total MMR: {hoveredPoint.mmr.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Summary Stats */}
      <div className="mt-4 pt-3 border-t border-riot-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2 bg-riot-darkest/60 px-3 py-2 rounded-xl border border-riot-border/70">
          <Target className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-400">Trend Win Rate</div>
            <div className="font-bold text-slate-200">{winRate}% ({winsCount}W - {dataPoints.length - winsCount}L)</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-riot-darkest/60 px-3 py-2 rounded-xl border border-riot-border/70">
          <Sparkles className="w-4 h-4 text-riot-gold" />
          <div>
            <div className="text-[10px] text-slate-400">Peak MMR in Period</div>
            <div className="font-bold text-slate-200">{peakMmr.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-riot-darkest/60 px-3 py-2 rounded-xl border border-riot-border/70">
          <Zap className="w-4 h-4 text-riot-accent" />
          <div>
            <div className="text-[10px] text-slate-400">Avg Gain / Game</div>
            <div className={`font-bold ${netMmrChange >= 0 ? "text-neon-win" : "text-neon-loss"}`}>
              {netMmrChange >= 0 ? `+${(netMmrChange / dataPoints.length).toFixed(1)}` : (netMmrChange / dataPoints.length).toFixed(1)} MMR
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-riot-darkest/60 px-3 py-2 rounded-xl border border-riot-border/70">
          <TrendingUp className="w-4 h-4 text-sky-400" />
          <div>
            <div className="text-[10px] text-slate-400">Rank Bracket</div>
            <div className="font-bold text-slate-200">{formatRankName(displayTier)} Tier</div>
          </div>
        </div>
      </div>
    </div>
  );
};
