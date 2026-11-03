import React, { useState } from "react";
import { KillMapEvent } from "../../types/timeline";
import { getChampionIconUrl } from "../../services/ddragon";
import { Crosshair, Skull, Shield, Filter, MapPin, Sparkles } from "lucide-react";

interface KillMapProps {
  kills: KillMapEvent[];
  targetChampionName: string;
}

type FilterOption = "all" | "my-kills" | "my-deaths" | "my-assists";

export const KillMap: React.FC<KillMapProps> = ({ kills, targetChampionName: _targetChampionName }) => {
  const [filter, setFilter] = useState<FilterOption>("all");
  const [selectedKill, setSelectedKill] = useState<KillMapEvent | null>(null);

  if (!kills || kills.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-riot-surface/50 rounded-2xl border border-riot-border">
        No kill events recorded in this match timeline.
      </div>
    );
  }

  // Filtered kills
  const filteredKills = kills.filter((k) => {
    if (filter === "my-kills") return k.isTargetKill;
    if (filter === "my-deaths") return k.isTargetDeath;
    if (filter === "my-assists") return k.isTargetAssist;
    return true;
  });

  const myKillsCount = kills.filter((k) => k.isTargetKill).length;
  const myDeathsCount = kills.filter((k) => k.isTargetDeath).length;
  const myAssistsCount = kills.filter((k) => k.isTargetAssist).length;

  // Convert League Summoner Rift coords (0..15000) to percentage
  const getCoordinatesPct = (pos: { x: number; y: number }) => {
    const clampedX = Math.max(200, Math.min(14800, pos.x));
    const clampedY = Math.max(200, Math.min(14800, pos.y));
    const left = (clampedX / 15000) * 100;
    const top = ((15000 - clampedY) / 15000) * 100;
    return { left: `${left}%`, top: `${top}%` };
  };

  return (
    <div className="space-y-4">
      {/* Header filter controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-riot-surface/80 p-3.5 rounded-2xl border border-riot-border">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-riot-accent" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Kill Map Filters:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              filter === "all"
                ? "bg-riot-accent text-white shadow-[0_0_12px_rgba(236,72,153,0.3)]"
                : "bg-riot-surface text-slate-400 hover:text-slate-200"
            }`}
          >
            All Kills ({kills.length})
          </button>
          <button
            onClick={() => setFilter("my-kills")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              filter === "my-kills"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "bg-riot-surface text-slate-400 hover:text-slate-200"
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            My Kills ({myKillsCount})
          </button>
          <button
            onClick={() => setFilter("my-deaths")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              filter === "my-deaths"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                : "bg-riot-surface text-slate-400 hover:text-slate-200"
            }`}
          >
            <Skull className="w-3.5 h-3.5 text-rose-400" />
            My Deaths ({myDeathsCount})
          </button>
          <button
            onClick={() => setFilter("my-assists")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              filter === "my-assists"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                : "bg-riot-surface text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            My Assists ({myAssistsCount})
          </button>
        </div>
      </div>

      {/* Main Map + Kill Feed Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Summoner's Rift Map Visualizer (2 Cols) */}
        <div className="lg:col-span-2 relative bg-black/90 border border-riot-border rounded-2xl p-2 overflow-hidden flex flex-col items-center justify-center">
          <div className="relative w-full aspect-square max-w-[520px] rounded-xl overflow-hidden border border-riot-border/50 shadow-2xl">
            {/* Summoner's Rift minimap texture */}
            <img
              src="/map11.png"
              onError={(e) => {
                // Fallback to riot cdn if local not resolved
                (e.target as HTMLImageElement).src =
                  "https://ddragon.leagueoflegends.com/cdn/6.8.1/img/map/map11.png";
              }}
              alt="Summoner's Rift Map"
              className="w-full h-full object-cover filter brightness-90 contrast-110 select-none pointer-events-none"
            />

            {/* Bases & River Overlay Labels */}
            <div className="absolute bottom-2 left-2 text-[9px] font-black uppercase tracking-wider text-cyan-400/70 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
              Blue Base
            </div>
            <div className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider text-rose-400/70 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
              Red Base
            </div>

            {/* Kill Markers */}
            {filteredKills.map((k, idx) => {
              const { left, top } = getCoordinatesPct(k.position);
              const isSelected = selectedKill === k;

              // Determine icon color & style
              let markerStyle = "bg-slate-400/60 border-slate-300 w-2.5 h-2.5";
              if (k.isTargetKill) {
                markerStyle =
                  "bg-emerald-400 border-white w-4 h-4 shadow-[0_0_12px_#10b981] z-20 animate-pulse";
              } else if (k.isTargetDeath) {
                markerStyle =
                  "bg-rose-500 border-white w-4 h-4 shadow-[0_0_12px_#f43f5e] z-20";
              } else if (k.isTargetAssist) {
                markerStyle =
                  "bg-cyan-400 border-white w-3.5 h-3.5 shadow-[0_0_10px_#06b6d4] z-10";
              } else if (k.killerTeamId === 100) {
                markerStyle = "bg-cyan-500/80 border-cyan-300 w-2.5 h-2.5";
              } else {
                markerStyle = "bg-rose-500/80 border-rose-300 w-2.5 h-2.5";
              }

              return (
                <div
                  key={idx}
                  style={{ left, top }}
                  onClick={() => setSelectedKill(k)}
                  onMouseEnter={() => setSelectedKill(k)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-transform hover:scale-150 ${
                    isSelected ? "scale-175 z-30" : ""
                  }`}
                  title={`${k.minute}:${k.second < 10 ? "0" : ""}${k.second} - ${
                    k.killerChampion
                  } killed ${k.victimChampion}`}
                >
                  <div
                    className={`rounded-full border flex items-center justify-center transition-all ${markerStyle}`}
                  >
                    {k.isTargetDeath ? (
                      <Skull className="w-2.5 h-2.5 text-white" />
                    ) : k.isTargetKill ? (
                      <Crosshair className="w-2.5 h-2.5 text-black" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Kill Detail Card */}
          {selectedKill && (
            <div className="w-full mt-3 bg-riot-surface/90 border border-riot-accent/40 rounded-xl p-3 shadow-xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 flex items-center gap-1 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-riot-accent" />
                  {selectedKill.minute}:{selectedKill.second < 10 ? "0" : ""}
                  {selectedKill.second}
                </span>

                {/* Killer */}
                <div className="flex items-center gap-1.5">
                  <img
                    src={getChampionIconUrl(selectedKill.killerChampion)}
                    alt={selectedKill.killerChampion}
                    className="w-6 h-6 rounded-md border border-riot-border object-cover"
                  />
                  <span
                    className={`font-bold ${
                      selectedKill.isTargetKill
                        ? "text-emerald-300"
                        : selectedKill.killerTeamId === 100
                        ? "text-cyan-300"
                        : "text-rose-400"
                    }`}
                  >
                    {selectedKill.killerChampion}
                  </span>
                </div>

                <span className="text-slate-500 font-bold">→</span>

                {/* Victim */}
                <div className="flex items-center gap-1.5">
                  <img
                    src={getChampionIconUrl(selectedKill.victimChampion)}
                    alt={selectedKill.victimChampion}
                    className="w-6 h-6 rounded-md border border-riot-border object-cover"
                  />
                  <span
                    className={`font-bold ${
                      selectedKill.isTargetDeath
                        ? "text-rose-400"
                        : selectedKill.victimTeamId === 100
                        ? "text-cyan-300"
                        : "text-rose-400"
                    }`}
                  >
                    {selectedKill.victimChampion}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                Coords: ({selectedKill.position.x}, {selectedKill.position.y})
              </div>
            </div>
          )}
        </div>

        {/* Chronological Kill Log (1 Col) */}
        <div className="bg-riot-surface/70 border border-riot-border rounded-2xl p-3 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-riot-border/50 text-xs font-bold uppercase tracking-wider text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-riot-accent" />
              Kill Feed
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {filteredKills.length} Events
            </span>
          </div>

          <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 text-xs">
            {filteredKills.map((k, i) => {
              const isSelected = selectedKill === k;

              return (
                <div
                  key={i}
                  onClick={() => setSelectedKill(k)}
                  className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-riot-accent/20 border-riot-accent shadow-md"
                      : "bg-riot-darkest/60 border-riot-border/40 hover:bg-riot-surface hover:border-riot-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 w-9">
                      {k.minute}:{k.second < 10 ? "0" : ""}
                      {k.second}
                    </span>

                    <img
                      src={getChampionIconUrl(k.killerChampion)}
                      alt={k.killerChampion}
                      className="w-5 h-5 rounded object-cover border border-riot-border shrink-0"
                    />

                    <span
                      className={`font-semibold truncate max-w-[70px] ${
                        k.isTargetKill
                          ? "text-emerald-300"
                          : k.killerTeamId === 100
                          ? "text-cyan-300"
                          : "text-rose-400"
                      }`}
                    >
                      {k.killerChampion}
                    </span>

                    <span className="text-slate-500 font-bold text-[10px]">✕</span>

                    <img
                      src={getChampionIconUrl(k.victimChampion)}
                      alt={k.victimChampion}
                      className="w-5 h-5 rounded object-cover border border-riot-border shrink-0"
                    />

                    <span
                      className={`font-semibold truncate max-w-[70px] ${
                        k.isTargetDeath
                          ? "text-rose-400"
                          : k.victimTeamId === 100
                          ? "text-cyan-300"
                          : "text-rose-400"
                      }`}
                    >
                      {k.victimChampion}
                    </span>
                  </div>

                  {k.isTargetKill && (
                    <span className="text-[9px] font-black uppercase px-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Kill
                    </span>
                  )}
                  {k.isTargetDeath && (
                    <span className="text-[9px] font-black uppercase px-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Death
                    </span>
                  )}
                  {k.isTargetAssist && (
                    <span className="text-[9px] font-black uppercase px-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      Assist
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
