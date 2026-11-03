import React, { useState, useMemo } from "react";
import { ParsedTimeline } from "../../types/timeline";
import { getChampionIconUrl } from "../../services/ddragon";
import {
  Coins,
  TrendingUp,
  Sparkles,
  Users,
  Crosshair,
  Shield,
  Layers,
  Scale,
} from "lucide-react";

interface GoldLeadGraphProps {
  timeline: ParsedTimeline;
  targetChampionName: string;
}

type GraphMode = "CHAMPIONS" | "TEAM_LEAD";
type MetricType = "gold" | "xp";

export const GoldLeadGraph: React.FC<GoldLeadGraphProps> = ({
  timeline,
  targetChampionName: _targetChampionName,
}) => {
  const [metric, setMetric] = useState<MetricType>("gold");
  const [mode, setMode] = useState<GraphMode>("CHAMPIONS");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const frames = timeline.minuteFrames;
  const participants = timeline.participants || [];
  const targetId = timeline.targetParticipantId;
  const target = participants.find((p) => p.participantId === targetId);

  // Direct lane opponent detection (same position on opposite team, or fallback to first enemy)
  const laneOpponent = useMemo(() => {
    if (!target) return participants.find((p) => p.teamId !== timeline.targetTeamId);
    return (
      participants.find(
        (p) =>
          p.teamId !== target.teamId &&
          p.role &&
          target.role &&
          p.role.toLowerCase() === target.role.toLowerCase()
      ) || participants.find((p) => p.teamId !== target.teamId)
    );
  }, [participants, target, timeline.targetTeamId]);

  // Selected entities to graph in CHAMPIONS mode
  // Champion IDs: 1..10, Team totals: "TEAM_100", "TEAM_200"
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>(() => {
    // Default: Target champion + Lane opponent + Ally team
    const initial = [String(targetId)];
    if (laneOpponent) initial.push(String(laneOpponent.participantId));
    return initial;
  });

  const toggleEntity = (id: string) => {
    setSelectedEntityIds((prev) => {
      if (prev.includes(id)) {
        // Keep at least one selected
        if (prev.length <= 1) return prev;
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  // Presets
  const applyPreset = (preset: "LANE" | "MY_TEAM" | "ALL_CHAMPS" | "TEAMS_ONLY" | "CHAMP_AND_TEAM") => {
    if (preset === "LANE") {
      const ids = [String(targetId)];
      if (laneOpponent) ids.push(String(laneOpponent.participantId));
      setSelectedEntityIds(ids);
    } else if (preset === "MY_TEAM") {
      const allyIds = participants
        .filter((p) => p.teamId === timeline.targetTeamId)
        .map((p) => String(p.participantId));
      setSelectedEntityIds(allyIds);
    } else if (preset === "ALL_CHAMPS") {
      setSelectedEntityIds(participants.map((p) => String(p.participantId)));
    } else if (preset === "TEAMS_ONLY") {
      setSelectedEntityIds(["TEAM_100", "TEAM_200"]);
    } else if (preset === "CHAMP_AND_TEAM") {
      const myTeamKey = timeline.targetTeamId === 100 ? "TEAM_100" : "TEAM_200";
      const enemyTeamKey = timeline.targetTeamId === 100 ? "TEAM_200" : "TEAM_100";
      setSelectedEntityIds([String(targetId), myTeamKey, enemyTeamKey]);
    }
  };

  if (!frames || frames.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-riot-surface/50 rounded-2xl border border-riot-border">
        No timeline frame data available for this match.
      </div>
    );
  }

  // SVG chart sizing
  const width = 800;
  const height = 280;
  const padding = { top: 25, right: 35, bottom: 40, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => {
    if (frames.length <= 1) return padding.left;
    return padding.left + (index / (frames.length - 1)) * graphWidth;
  };

  // ----------------------------------------------------------------------
  // MODE 1: MULTI-CHAMPION & TEAM COMPARISON
  // ----------------------------------------------------------------------
  // Compute line data for each selected entity
  const entitySeries = useMemo(() => {
    return selectedEntityIds.map((id) => {
      if (id === "TEAM_100") {
        const points = frames.map((f, i) => ({
          x: getX(i),
          val: metric === "gold" ? f.blueGold : f.blueXp,
          minute: f.minute,
        }));
        return {
          id,
          name: "Blue Team Total",
          championName: "",
          color: "#06b6d4",
          isTeam: true,
          points,
        };
      }
      if (id === "TEAM_200") {
        const points = frames.map((f, i) => ({
          x: getX(i),
          val: metric === "gold" ? f.redGold : f.redXp,
          minute: f.minute,
        }));
        return {
          id,
          name: "Red Team Total",
          championName: "",
          color: "#f43f5e",
          isTeam: true,
          points,
        };
      }

      // Individual Champion
      const pId = Number(id);
      const p = participants.find((x) => x.participantId === pId);
      const points = frames.map((f, i) => {
        const pData = f.participantData?.[pId];
        let val = 0;
        if (pData) {
          val = metric === "gold" ? pData.totalGold : pData.xp;
        } else if (pId === targetId) {
          val = metric === "gold" ? f.targetGold : f.blueXp / 5;
        }
        return {
          x: getX(i),
          val,
          minute: f.minute,
        };
      });

      return {
        id,
        name: p?.summonerName || `Player ${pId}`,
        championName: p?.championName || `Champion`,
        color: p?.color || (p?.teamId === 100 ? "#06b6d4" : "#f43f5e"),
        isTeam: false,
        isTarget: pId === targetId,
        points,
      };
    });
  }, [selectedEntityIds, frames, metric, participants, targetId]);

  // Max value across all selected lines
  const maxSeriesVal = useMemo(() => {
    let max = 1000;
    entitySeries.forEach((s) => {
      s.points.forEach((pt) => {
        if (pt.val > max) max = pt.val;
      });
    });
    return Math.ceil(max / 1000) * 1000;
  }, [entitySeries]);

  const getY_Multi = (val: number) => {
    const ratio = Math.min(1, Math.max(0, val / maxSeriesVal));
    return padding.top + (1 - ratio) * graphHeight;
  };

  // ----------------------------------------------------------------------
  // MODE 2: TEAM ADVANTAGE (DIFF) CURVE
  // ----------------------------------------------------------------------
  const diffValues = frames.map((f) => (metric === "gold" ? f.goldDiff : f.xpDiff));
  const maxDiff = Math.max(1000, ...diffValues.map((v) => Math.abs(v)));
  const yDiffDomain = Math.ceil(maxDiff / 1000) * 1000;
  const zeroY = padding.top + graphHeight / 2;

  const getY_Diff = (val: number) => {
    const normalized = val / yDiffDomain;
    return zeroY - normalized * (graphHeight / 2);
  };

  const diffPoints = frames.map((f, i) => ({
    x: getX(i),
    y: getY_Diff(metric === "gold" ? f.goldDiff : f.xpDiff),
    frame: f,
  }));

  const diffLinePath = diffPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");
  const diffBlueArea = `${diffLinePath} L ${getX(frames.length - 1)} ${zeroY} L ${getX(
    0
  )} ${zeroY} Z`;

  // Hovered item data
  const hoveredFrame = hoverIndex !== null && frames[hoverIndex] ? frames[hoverIndex] : null;

  return (
    <div className="space-y-4">
      {/* Main Mode & Metric Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-riot-surface/85 p-3 rounded-2xl border border-riot-border">
        {/* Metric Selector (Gold vs XP) */}
        <div className="flex items-center gap-1.5 bg-riot-darkest p-1 rounded-xl border border-riot-border text-xs font-semibold">
          <button
            onClick={() => setMetric("gold")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              metric === "gold"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-neon-gold font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Gold Progression</span>
          </button>
          <button
            onClick={() => setMetric("xp")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              metric === "xp"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>XP Progression</span>
          </button>
        </div>

        {/* View Mode (Multi-Champion vs Team Advantage) */}
        <div className="flex items-center gap-1.5 bg-riot-darkest p-1 rounded-xl border border-riot-border text-xs font-semibold">
          <button
            onClick={() => setMode("CHAMPIONS")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              mode === "CHAMPIONS"
                ? "bg-riot-accent text-white shadow-neon-pink font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Champion & Team Comparison</span>
          </button>
          <button
            onClick={() => setMode("TEAM_LEAD")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              mode === "TEAM_LEAD"
                ? "bg-riot-accent text-white shadow-neon-pink font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Team Lead Advantage Curve</span>
          </button>
        </div>
      </div>

      {/* When in CHAMPIONS comparison mode: Show Presets & Champion Toggles */}
      {mode === "CHAMPIONS" && (
        <div className="bg-riot-surface/70 border border-riot-border rounded-2xl p-3.5 space-y-3">
          {/* Quick Presets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-riot-border/50 pb-2.5">
            <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-riot-accent" />
              Quick Comparison Presets:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => applyPreset("LANE")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-riot-darkest border border-riot-border text-slate-300 hover:text-white hover:border-riot-accent text-[11px] font-semibold transition-all"
              >
                <Crosshair className="w-3 h-3 text-emerald-400" />
                Lane Matchup (You vs Opponent)
              </button>
              <button
                onClick={() => applyPreset("MY_TEAM")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-riot-darkest border border-riot-border text-slate-300 hover:text-white hover:border-riot-accent text-[11px] font-semibold transition-all"
              >
                <Users className="w-3 h-3 text-cyan-400" />
                My Full Team (5 Allies)
              </button>
              <button
                onClick={() => applyPreset("CHAMP_AND_TEAM")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-riot-darkest border border-riot-border text-slate-300 hover:text-white hover:border-riot-accent text-[11px] font-semibold transition-all"
              >
                <Shield className="w-3 h-3 text-pink-400" />
                You vs Team Totals
              </button>
              <button
                onClick={() => applyPreset("ALL_CHAMPS")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-riot-darkest border border-riot-border text-slate-300 hover:text-white hover:border-riot-accent text-[11px] font-semibold transition-all"
              >
                All 10 Champions
              </button>
              <button
                onClick={() => applyPreset("TEAMS_ONLY")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-riot-darkest border border-riot-border text-slate-300 hover:text-white hover:border-riot-accent text-[11px] font-semibold transition-all"
              >
                Blue vs Red Team Totals
              </button>
            </div>
          </div>

          {/* Interactive Toggle Chips */}
          <div className="space-y-2">
            {/* Blue Team Champions & Total */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider w-20 shrink-0">
                Blue Team:
              </span>
              <button
                onClick={() => toggleEntity("TEAM_100")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                  selectedEntityIds.includes("TEAM_100")
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                    : "bg-riot-darkest/60 text-slate-400 border-riot-border hover:text-slate-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Team Total
              </button>
              {participants
                .filter((p) => p.teamId === 100)
                .map((p) => {
                  const isSelected = selectedEntityIds.includes(String(p.participantId));
                  return (
                    <button
                      key={p.participantId}
                      onClick={() => toggleEntity(String(p.participantId))}
                      style={{
                        borderColor: isSelected ? p.color : undefined,
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? "bg-riot-darkest shadow-md text-slate-100"
                          : "bg-riot-darkest/40 text-slate-500 border-riot-border/50 hover:text-slate-300"
                      }`}
                    >
                      <img
                        src={getChampionIconUrl(p.championName)}
                        alt={p.championName}
                        className="w-4 h-4 rounded-full object-cover shrink-0"
                      />
                      <span>{p.championName}</span>
                      {p.isTarget && (
                        <span className="text-[9px] text-pink-400 font-bold px-1 rounded bg-pink-500/20">
                          YOU
                        </span>
                      )}
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                    </button>
                  );
                })}
            </div>

            {/* Red Team Champions & Total */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider w-20 shrink-0">
                Red Team:
              </span>
              <button
                onClick={() => toggleEntity("TEAM_200")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                  selectedEntityIds.includes("TEAM_200")
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                    : "bg-riot-darkest/60 text-slate-400 border-riot-border hover:text-slate-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Team Total
              </button>
              {participants
                .filter((p) => p.teamId === 200)
                .map((p) => {
                  const isSelected = selectedEntityIds.includes(String(p.participantId));
                  return (
                    <button
                      key={p.participantId}
                      onClick={() => toggleEntity(String(p.participantId))}
                      style={{
                        borderColor: isSelected ? p.color : undefined,
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? "bg-riot-darkest shadow-md text-slate-100"
                          : "bg-riot-darkest/40 text-slate-500 border-riot-border/50 hover:text-slate-300"
                      }`}
                    >
                      <img
                        src={getChampionIconUrl(p.championName)}
                        alt={p.championName}
                        className="w-4 h-4 rounded-full object-cover shrink-0"
                      />
                      <span>{p.championName}</span>
                      {p.isTarget && (
                        <span className="text-[9px] text-pink-400 font-bold px-1 rounded bg-pink-500/20">
                          YOU
                        </span>
                      )}
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* SVG Chart Container */}
      <div className="relative bg-riot-darkest/95 border border-riot-border rounded-2xl p-4 overflow-hidden shadow-2xl">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
        >
          <defs>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
            </linearGradient>
            <filter id="glowMulti" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* MODE 1: MULTI-CHAMPION & TEAM OVERLAY */}
          {mode === "CHAMPIONS" && (
            <>
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padding.top + (1 - ratio) * graphHeight;
                const val = Math.round(ratio * maxSeriesVal);
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke="#334155"
                      strokeDasharray="2 4"
                      strokeWidth="1"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94a3b8"
                      fontFamily="monospace"
                    >
                      {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                    </text>
                  </g>
                );
              })}

              {/* Render curves for each selected entity */}
              {entitySeries.map((series) => {
                const pathStr = series.points.reduce((acc, pt, idx) => {
                  const y = getY_Multi(pt.val);
                  return idx === 0 ? `M ${pt.x} ${y}` : `${acc} L ${pt.x} ${y}`;
                }, "");

                return (
                  <path
                    key={series.id}
                    d={pathStr}
                    fill="none"
                    stroke={series.color}
                    strokeWidth={series.isTarget || series.isTeam ? 3 : 2}
                    strokeDasharray={series.isTeam ? "4 3" : undefined}
                    opacity={series.isTarget ? 1 : 0.85}
                    filter="url(#glowMulti)"
                  />
                );
              })}
            </>
          )}

          {/* MODE 2: TEAM ADVANTAGE (DIFF) CURVE */}
          {mode === "TEAM_LEAD" && (
            <>
              {/* Center Zero Axis */}
              <line
                x1={padding.left}
                y1={zeroY}
                x2={width - padding.right}
                y2={zeroY}
                stroke="#64748b"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />

              {/* Y Axis labels for diff */}
              <text
                x={padding.left - 8}
                y={padding.top + 4}
                textAnchor="end"
                fontSize="10"
                fill="#06b6d4"
                fontFamily="monospace"
              >
                +{yDiffDomain >= 1000 ? `${yDiffDomain / 1000}k` : yDiffDomain}
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
                -{yDiffDomain >= 1000 ? `${yDiffDomain / 1000}k` : yDiffDomain}
              </text>

              {/* Filled Area */}
              <path d={diffBlueArea} fill="url(#blueGradient)" />

              {/* Main Diff Line */}
              <path
                d={diffLinePath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                filter="url(#glowMulti)"
              />
            </>
          )}

          {/* X Axis Time Labels */}
          {frames.map((f, i) => {
            const is5min = f.minute % 5 === 0;
            const isLast = i === frames.length - 1;
            if (!is5min && !isLast) return null;

            return (
              <g key={i}>
                <line
                  x1={getX(i)}
                  y1={height - padding.bottom}
                  x2={getX(i)}
                  y2={height - padding.bottom + 4}
                  stroke="#64748b"
                  strokeWidth="1"
                />
                <text
                  x={getX(i)}
                  y={height - padding.bottom + 16}
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

          {/* Interactive Hover Line */}
          {hoverIndex !== null && (
            <line
              x1={getX(hoverIndex)}
              y1={padding.top}
              x2={getX(hoverIndex)}
              y2={padding.top + graphHeight}
              stroke="#ec4899"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
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

        {/* Hover Comparison Tooltip (Multi-Champion or Diff) */}
        {hoveredFrame && hoverIndex !== null && (
          <div
            className="absolute z-20 pointer-events-none bg-riot-surface/95 backdrop-blur-md border border-riot-accent/40 rounded-xl p-3 shadow-2xl text-xs space-y-2 transition-all min-w-[240px]"
            style={{
              left: `${Math.min(
                Math.max(5, (getX(hoverIndex) / width) * 100),
                65
              )}%`,
              top: "16px",
            }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-riot-border">
              <span className="font-bold text-slate-100 flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3 text-riot-accent" />
                Minute {hoveredFrame.minute}:00
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {metric.toUpperCase()} Breakdown
              </span>
            </div>

            {/* List comparison of all selected entities */}
            {mode === "CHAMPIONS" ? (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {entitySeries
                  .map((s) => {
                    const pt = s.points[hoverIndex];
                    return {
                      ...s,
                      currentVal: pt?.val || 0,
                    };
                  })
                  .sort((a, b) => b.currentVal - a.currentVal)
                  .map((s, idx) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 text-[11px] font-mono"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[9px] text-slate-500 w-3 font-bold">
                          #{idx + 1}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.championName ? (
                          <img
                            src={getChampionIconUrl(s.championName)}
                            alt={s.championName}
                            className="w-4 h-4 rounded-full object-cover shrink-0"
                          />
                        ) : null}
                        <span
                          className={`truncate font-semibold ${
                            s.isTarget ? "text-pink-300 font-bold" : "text-slate-200"
                          }`}
                        >
                          {s.championName || s.name}
                        </span>
                      </div>
                      <span className="font-bold text-slate-100 whitespace-nowrap">
                        {s.currentVal.toLocaleString()}
                        {metric === "gold" ? "g" : " xp"}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              /* Diff Mode Hover Details */
              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-cyan-300">Blue Team:</span>
                  <span className="font-bold text-cyan-200">
                    {(metric === "gold"
                      ? hoveredFrame.blueGold
                      : hoveredFrame.blueXp
                    ).toLocaleString()}
                    {metric === "gold" ? "g" : " xp"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-400">Red Team:</span>
                  <span className="font-bold text-rose-300">
                    {(metric === "gold"
                      ? hoveredFrame.redGold
                      : hoveredFrame.redXp
                    ).toLocaleString()}
                    {metric === "gold" ? "g" : " xp"}
                  </span>
                </div>
                <div className="pt-1 border-t border-riot-border/50 flex justify-between font-bold">
                  <span>Lead:</span>
                  <span
                    className={
                      (metric === "gold" ? hoveredFrame.goldDiff : hoveredFrame.xpDiff) >= 0
                        ? "text-cyan-300"
                        : "text-rose-400"
                    }
                  >
                    {(metric === "gold" ? hoveredFrame.goldDiff : hoveredFrame.xpDiff) >= 0
                      ? "Blue +"
                      : "Red +"}
                    {Math.abs(
                      metric === "gold" ? hoveredFrame.goldDiff : hoveredFrame.xpDiff
                    ).toLocaleString()}
                    {metric === "gold" ? "g" : " xp"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
