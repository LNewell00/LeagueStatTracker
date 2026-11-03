import React from "react";
import { ParsedMatch } from "../types/riot";
import {
  getChampionIconUrl,
  getItemIconUrl,
  getSummonerSpellIconUrl,
} from "../services/ddragon";
import { Eye, Flame } from "lucide-react";

interface MatchRowProps {
  match: ParsedMatch;
}

export const MatchRow: React.FC<MatchRowProps> = ({ match }) => {
  const p = match.targetParticipant;
  const isWin = p.win;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getKdaBadge = (kda: number) => {
    if (kda >= 5.0) return "text-riot-gold font-bold";
    if (kda >= 3.0) return "text-emerald-400 font-bold";
    return "text-slate-300 font-semibold";
  };

  const items = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5];

  return (
    <div
      className={`relative group rounded-xl border transition-all duration-200 overflow-hidden ${
        isWin
          ? "bg-slate-900/60 border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-neon-win"
          : "bg-slate-900/60 border-rose-500/30 hover:border-rose-500/60 hover:shadow-neon-loss"
      }`}
    >
      {/* Accent side stripe */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          isWin ? "bg-neon-win" : "bg-neon-loss"
        }`}
      />

      <div className="p-4 pl-5 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Section 1: Win/Loss status, queue & duration */}
        <div className="flex items-center gap-4 w-full lg:w-48">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded ${
                  isWin
                    ? "bg-emerald-500/20 text-neon-win border border-emerald-500/40"
                    : "bg-rose-500/20 text-neon-loss border border-rose-500/40"
                }`}
              >
                {isWin ? "Victory" : "Defeat"}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1.5">
              <span className="font-medium text-slate-300">Ranked Solo</span>
              <div className="text-[11px] text-slate-500">
                {formatDuration(match.gameDuration)} • {formatTimeAgo(match.gameCreation)}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Champion Portrait, Spells & Level */}
        <div className="flex items-center gap-3 w-full lg:w-44">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-riot-border bg-riot-darkest">
              <img
                src={getChampionIconUrl(p.championName)}
                alt={p.championName}
                className="w-full h-full object-cover scale-105"
                loading="lazy"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-riot-surface border border-riot-border text-slate-300 text-[9px] font-bold px-1 rounded-full">
              {p.champLevel}
            </span>
          </div>

          {/* Summoner Spells */}
          <div className="flex flex-col gap-1">
            <div className="w-5 h-5 rounded overflow-hidden border border-riot-border bg-riot-darkest">
              <img
                src={getSummonerSpellIconUrl(p.summoner1Id)}
                alt="Spell 1"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-5 h-5 rounded overflow-hidden border border-riot-border bg-riot-darkest">
              <img
                src={getSummonerSpellIconUrl(p.summoner2Id)}
                alt="Spell 2"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-100">{p.championName}</div>
            <div className="text-[11px] text-slate-400">CS {p.cs} ({p.csPerMin}/m)</div>
          </div>
        </div>

        {/* Section 3: KDA & Score */}
        <div className="flex flex-col items-center lg:items-start w-full lg:w-36">
          <div className="text-sm font-extrabold text-slate-100 tracking-tight">
            {p.kills} / <span className="text-neon-loss">{p.deaths}</span> / {p.assists}
          </div>
          <div className={`text-xs mt-0.5 ${getKdaBadge(p.kda)}`}>
            {p.kda}:1 <span className="text-[10px] text-slate-400 font-normal">KDA</span>
          </div>
        </div>

        {/* Section 4: Items Grid */}
        <div className="flex items-center gap-1.5 w-full lg:w-auto">
          {items.map((itemId, idx) => (
            <div
              key={idx}
              className="w-8 h-8 rounded-lg bg-riot-darkest border border-riot-border/70 overflow-hidden flex items-center justify-center"
            >
              {itemId > 0 ? (
                <img
                  src={getItemIconUrl(itemId)}
                  alt={`Item ${itemId}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              )}
            </div>
          ))}

          {/* Trinket */}
          <div className="w-8 h-8 rounded-lg bg-riot-darkest border border-riot-border/70 overflow-hidden flex items-center justify-center ml-1">
            {p.item6 > 0 ? (
              <img
                src={getItemIconUrl(p.item6)}
                alt="Trinket"
                className="w-full h-full object-cover rounded"
                loading="lazy"
              />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            )}
          </div>
        </div>

        {/* Section 5: Stats (Damage & Vision) */}
        <div className="hidden xl:flex items-center gap-4 text-xs text-slate-400 border-l border-riot-border/50 pl-4">
          <div className="flex items-center gap-1" title="Damage to champions">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>{p.totalDamageDealtToChampions.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1" title="Vision score">
            <Eye className="w-3.5 h-3.5 text-riot-accent" />
            <span>{p.visionScore}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

