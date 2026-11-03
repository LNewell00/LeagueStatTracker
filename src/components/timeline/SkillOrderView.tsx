import React from "react";
import { SkillLevelUpEvent, SkillSlot } from "../../types/timeline";
import { Zap, Crown, ArrowRight } from "lucide-react";

interface SkillOrderViewProps {
  skillLevelUps: SkillLevelUpEvent[];
  championName: string;
}

export const SkillOrderView: React.FC<SkillOrderViewProps> = ({
  skillLevelUps,
  championName,
}) => {
  if (!skillLevelUps || skillLevelUps.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-riot-surface/50 rounded-2xl border border-riot-border">
        No skill level-up events recorded for {championName} in this timeline.
      </div>
    );
  }

  const maxLevel = Math.max(1, ...skillLevelUps.map((s) => s.level));
  // Create an array [1, 2, 3, ... maxLevel]
  const levels = Array.from({ length: Math.min(18, maxLevel) }, (_, i) => i + 1);

  // Group by skill
  const skillSlots: SkillSlot[] = ["Q", "W", "E", "R"];

  const getSlotColor = (slot: SkillSlot) => {
    switch (slot) {
      case "Q":
        return {
          bg: "bg-cyan-500/20",
          text: "text-cyan-300",
          border: "border-cyan-500/40",
          glow: "shadow-[0_0_10px_rgba(6,182,212,0.3)]",
          badge: "bg-cyan-500 text-black",
        };
      case "W":
        return {
          bg: "bg-emerald-500/20",
          text: "text-emerald-300",
          border: "border-emerald-500/40",
          glow: "shadow-[0_0_10px_rgba(16,185,129,0.3)]",
          badge: "bg-emerald-500 text-black",
        };
      case "E":
        return {
          bg: "bg-fuchsia-500/20",
          text: "text-fuchsia-300",
          border: "border-fuchsia-500/40",
          glow: "shadow-[0_0_10px_rgba(217,70,239,0.3)]",
          badge: "bg-fuchsia-500 text-black",
        };
      case "R":
        return {
          bg: "bg-amber-500/25",
          text: "text-amber-300",
          border: "border-amber-500/50",
          glow: "shadow-[0_0_12px_rgba(245,158,11,0.4)]",
          badge: "bg-amber-400 text-black",
        };
    }
  };

  // Compute skill priority order (which skill hit 5 points first, excluding R)
  const skillCounts: Record<SkillSlot, number> = { Q: 0, W: 0, E: 0, R: 0 };
  const maxOrder: SkillSlot[] = [];

  skillLevelUps.forEach((event) => {
    const slot = event.skillKey;
    skillCounts[slot] = (skillCounts[slot] || 0) + 1;
    if (slot !== "R" && skillCounts[slot] === 5 && !maxOrder.includes(slot)) {
      maxOrder.push(slot);
    }
  });

  // If match ended before skills hit 5, sort remaining standard skills by point count
  (["Q", "W", "E"] as SkillSlot[]).forEach((slot) => {
    if (!maxOrder.includes(slot)) {
      maxOrder.push(slot);
    }
  });
  maxOrder.sort((a, b) => skillCounts[b] - skillCounts[a]);

  return (
    <div className="space-y-4">
      {/* Header with maxing priority banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-riot-surface/80 p-3.5 rounded-2xl border border-riot-border">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-riot-accent" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {championName} Skill Progression
          </span>
        </div>

        {/* Priority Badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
            Max Order Priority:
          </span>
          <div className="flex items-center gap-1.5">
            {maxOrder.map((slot, idx) => {
              const colors = getSlotColor(slot);
              return (
                <React.Fragment key={slot}>
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${colors.bg} ${colors.text} border ${colors.border} ${colors.glow}`}
                  >
                    {slot}
                  </span>
                  {idx < maxOrder.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-riot-darkest/90 border border-riot-border/70 rounded-2xl p-4 overflow-x-auto shadow-2xl">
        <table className="w-full text-center border-separate border-spacing-1.5 select-none">
          <thead>
            <tr>
              <th className="w-12 text-[10px] font-bold text-slate-500 uppercase tracking-wider py-1 text-left">
                Skill
              </th>
              {levels.map((lvl) => (
                <th
                  key={lvl}
                  className={`text-[10px] font-mono py-1 px-1 rounded-md min-w-[28px] ${
                    lvl === 6 || lvl === 11 || lvl === 16
                      ? "text-amber-400 font-bold bg-amber-500/10"
                      : "text-slate-400 font-medium"
                  }`}
                >
                  {lvl}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {skillSlots.map((slot) => {
              const colors = getSlotColor(slot);
              const count = skillCounts[slot];

              return (
                <tr key={slot} className="group">
                  {/* Skill Slot Header */}
                  <td className="text-left py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs border ${colors.bg} ${colors.text} ${colors.border} ${colors.glow}`}
                      >
                        {slot === "R" ? <Crown className="w-3.5 h-3.5" /> : slot}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {count}
                      </span>
                    </div>
                  </td>

                  {/* Level Columns */}
                  {levels.map((lvl) => {
                    const event = skillLevelUps.find((s) => s.level === lvl);
                    const isLeveled = event?.skillKey === slot;

                    return (
                      <td key={lvl} className="p-0.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                            isLeveled
                              ? `${colors.bg} ${colors.text} border ${colors.border} ${colors.glow} scale-105`
                              : "bg-riot-surface/30 border border-riot-border/30 text-transparent hover:border-riot-border/60"
                          }`}
                        >
                          {isLeveled ? slot : "•"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Chronological sequence chips */}
      <div className="bg-riot-surface/60 border border-riot-border/60 rounded-2xl p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Step-by-Step Level Evolution
        </div>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {skillLevelUps.map((evt) => {
            const colors = getSlotColor(evt.skillKey);
            return (
              <span
                key={evt.level}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${colors.bg} ${colors.text} ${colors.border}`}
                title={`Level ${evt.level}: Leveled ${evt.skillKey}`}
              >
                <span className="text-[9px] text-slate-400 font-normal">
                  {evt.level}:
                </span>
                {evt.skillKey}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

