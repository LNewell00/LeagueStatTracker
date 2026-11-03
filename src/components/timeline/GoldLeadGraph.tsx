import React, { useState } from "react";
import { ParsedTimeline } from "../../types/timeline";
import { Coins, TrendingUp, Sparkles } from "lucide-react";

interface GoldLeadGraphProps {
  timeline: ParsedTimeline;
  targetChampionName: string;
}

export const GoldLeadGraph: React.FC<GoldLeadGraphProps> = ({ timeline, targetChampionName }) => {
  const [metric, setMetric] = useState<"gold" | "xp">("gold");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const frames = timeline.minuteFrames;
  if (!frames || frames.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-riot-surface/50 rounded-2xl border border-riot-border">
        No timeline frame data available for this match.
      </div>
    );
  }

  const values = frames.map((f) => (metric === "gold" ? f.goldDiff : f.xpDiff));
  const maxVal = Math.max(1000, ...values.map((v) => Math.abs(v)));
  const yDomain = Math.ceil(maxVal / 1000) * 1000;

  // SVG dimensions
  const width = 760;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 35, left: 55 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const zeroY = padding.top + graphHeight / 2;

  const getX = (index: number) => {
    if (frames.length <= 1) return padding.left;
    return padding.left + (index / (frames.length - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    // val in [-yDomain, +yDomain]
    // when val = yDomain (blue max), y is padding.top
    // when val = -yDomain (red max), y is padding.top + graphHeight
    const normalized = val / yDomain;
    return zeroY - normalized * (graphHeight / 2);
  };

  // Build SVG path points
  const points = frames.map((f, i) => ({
    x: getX(i),
    y: getY(metric === "gold" ? f.goldDiff : f.xpDiff),
    frame: f,
  }));

  const linePath = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  // Area paths (Blue above zero, Red below zero)
  const blueArea = `${linePath} L ${getX(frames.length - 1)} ${zeroY} L ${getX(0)} ${zeroY} Z`;

  const hoveredPt = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="space-y-4">
      {/* Header controls & milestone metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-riot-surface/80 p-3.5 rounded-2xl border border-riot-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMetric("gold")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              metric === "gold"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-riot-surface"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Gold Lead Curve
          </button>
          <button
            onClick={() => setMetric("xp")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              metric === "xp"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-riot-surface"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            XP Lead Curve
          </button>
        </div>

        {/* Milestone Quick Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-[10px] text-slate-500 uppercase font-sans">@ 15m:</span>
            <span
              className={`font-bold ${
                timeline.goldAt15m >= 0 ? "text-cyan-300" : "text-rose-400"
              }`}
            >
              {timeline.goldAt15m >= 0 ? "+" : ""}
              {timeline.goldAt15m.toLocaleString()}g
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-[10px] text-slate-500 uppercase font-sans">Peak Blue:</span>
            <span className="font-bold text-cyan-300">
              +{timeline.maxBlueGoldLead.lead.toLocaleString()}g ({timeline.maxBlueGoldLead.minute}m)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-[10px] text-slate-500 uppercase font-sans">Peak Red:</span>
            <span className="font-bold text-rose-400">
              +{timeline.maxRedGoldLead.lead.toLocaleString()}g ({timeline.maxRedGoldLead.minute}m)
            </span>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative bg-riot-darkest/90 border border-riot-border/70 rounded-2xl p-4 overflow-hidden shadow-2xl">
        {/* Subtle Watermark or team labels */}
        <div className="absolute top-3 left-16 text-[10px] uppercase font-bold tracking-wider text-cyan-400/50 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Blue Team Ahead
        </div>
        <div className="absolute bottom-6 left-16 text-[10px] uppercase font-bold tracking-wider text-rose-400/50 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Red Team Ahead
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
        >
          <defs>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.45" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="#475569"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* Upper (+domain) and lower (-domain) grid guides */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="#334155"
            strokeDasharray="2 4"
            strokeWidth="1"
          />
          <line
            x1={padding.left}
            y1={padding.top + graphHeight}
            x2={width - padding.right}
            y2={padding.top + graphHeight}
            stroke="#334155"
            strokeDasharray="2 4"
            strokeWidth="1"
          />

          {/* Y Axis Labels */}
          <text
            x={padding.left - 8}
            y={padding.top + 4}
            textAnchor="end"
            fontSize="10"
            fill="#06b6d4"
            fontFamily="monospace"
          >
            +{yDomain >= 1000 ? `${yDomain / 1000}k` : yDomain}
          </text>
          <text
            x={padding.left - 8}
            y={zeroY + 3}
            textAnchor="end"
            fontSize="10"
            fill="#94a3b8"
            fontFamily="monospace"
          >
            0
          </text>
          <text
            x={padding.left - 8}
            y={padding.top + graphHeight + 2}
            textAnchor="end"
            fontSize="10"
            fill="#f43f5e"
            fontFamily="monospace"
          >
            -{yDomain >= 1000 ? `${yDomain / 1000}k` : yDomain}
          </text>

          {/* Filled Area */}
          <path d={blueArea} fill="url(#blueGradient)" />

          {/* Main Curve Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            filter="url(#glow)"
          />

          {/* X Axis Time Labels */}
          {frames.map((f, i) => {
            // Label every 5 minutes and the final minute
            const is5min = f.minute % 5 === 0;
            const isLast = i === frames.length - 1;
            if (!is5min && !isLast) return null;

            return (
              <g key={i}>
                <line
                  x1={getX(i)}
                  y1={zeroY - 3}
                  x2={getX(i)}
                  y2={zeroY + 3}
                  stroke="#64748b"
                  strokeWidth="1"
                />
                <text
                  x={getX(i)}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {f.minute}m
                </text>
              </g>
            );
          })}

          {/* Interactive Hover Line & Point */}
          {hoveredPt && (
            <g>
              <line
                x1={hoveredPt.x}
                y1={padding.top}
                x2={hoveredPt.x}
                y2={padding.top + graphHeight}
                stroke="#ec4899"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={hoveredPt.x}
                cy={hoveredPt.y}
                r="5"
                fill="#ec4899"
                stroke="#fff"
                strokeWidth="2"
                filter="url(#glow)"
              />
            </g>
          )}

          {/* Mouse overlay hitboxes */}
          {frames.map((_, i) => {
            const step = graphWidth / Math.max(1, frames.length - 1);
            const x = getX(i) - step / 2;
            return (
              <rect
                key={i}
                x={Math.max(padding.left, x)}
                y={padding.top}
                width={step}
                height={graphHeight}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-crosshair"
              />
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredPt && (
          <div
            className="absolute z-20 pointer-events-none bg-riot-surface/95 backdrop-blur-md border border-riot-accent/40 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 transition-all"
            style={{
              left: `${Math.min(
                Math.max(10, (hoveredPt.x / width) * 100),
                70
              )}%`,
              top: "16px",
            }}
          >
            <div className="flex items-center justify-between gap-4 font-mono pb-1 border-b border-riot-border">
              <span className="font-bold text-slate-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-riot-accent" />
                Minute {hoveredPt.frame.minute}:00
              </span>
              <span
                className={`font-black ${
                  (metric === "gold" ? hoveredPt.frame.goldDiff : hoveredPt.frame.xpDiff) >= 0
                    ? "text-cyan-300"
                    : "text-rose-400"
                }`}
              >
                {(metric === "gold" ? hoveredPt.frame.goldDiff : hoveredPt.frame.xpDiff) >= 0
                  ? "Blue Lead +"
                  : "Red Lead +"}
                {Math.abs(
                  metric === "gold" ? hoveredPt.frame.goldDiff : hoveredPt.frame.xpDiff
                ).toLocaleString()}
                {metric === "gold" ? "g" : " XP"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 text-[11px] font-mono">
              <div className="text-cyan-300">
                Blue Team:{" "}
                <span className="font-bold">
                  {(metric === "gold"
                    ? hoveredPt.frame.blueGold
                    : hoveredPt.frame.blueXp
                  ).toLocaleString()}
                  {metric === "gold" ? "g" : ""}
                </span>
              </div>
              <div className="text-rose-400 text-right">
                Red Team:{" "}
                <span className="font-bold">
                  {(metric === "gold"
                    ? hoveredPt.frame.redGold
                    : hoveredPt.frame.redXp
                  ).toLocaleString()}
                  {metric === "gold" ? "g" : ""}
                </span>
              </div>
            </div>

            <div className="pt-1 mt-1 border-t border-riot-border/50 text-[11px] text-slate-300 flex items-center justify-between font-mono">
              <span>{targetChampionName} (You):</span>
              <span className="text-amber-300 font-bold">
                {hoveredPt.frame.targetGold.toLocaleString()}g • Lv {hoveredPt.frame.targetLevel} •{" "}
                {hoveredPt.frame.targetCs} CS
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
