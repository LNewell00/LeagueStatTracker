import React, { useState, useMemo } from "react";
import { ParsedMatch } from "../types/riot";
import { computeTeammateSynergies } from "../services/synergy";
import { getChampionIconUrl } from "../services/ddragon";
import {
  Users,
  Search,
  Sparkles,
  Flame,
  Swords,
  HeartHandshake,
  TrendingUp,
  Clock,
} from "lucide-react";

interface DuoSynergyTabProps {
  matches: ParsedMatch[];
  targetPuuid?: string;
  summonerName?: string;
}

export const DuoSynergyTab: React.FC<DuoSynergyTabProps> = ({
  matches,
  targetPuuid,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"5_PLUS" | "3_PLUS" | "ALL">("5_PLUS");

  const synergyStats = useMemo(() => {
    return computeTeammateSynergies(matches, targetPuuid);
  }, [matches, targetPuuid]);

  const duos5PlusCount = useMemo(() => {
    return synergyStats.teammates.filter((t) => t.gamesTogether >= 5).length;
  }, [synergyStats.teammates]);

  const duos3PlusCount = useMemo(() => {
    return synergyStats.teammates.filter((t) => t.gamesTogether >= 3).length;
  }, [synergyStats.teammates]);

  const filteredTeammates = useMemo(() => {
    return synergyStats.teammates.filter((t) => {
      if (filterMode === "5_PLUS" && t.gamesTogether < 5) return false;
      if (filterMode === "3_PLUS" && t.gamesTogether < 3) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          t.displayName.toLowerCase().includes(query) ||
          t.mostPlayedChampion.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [synergyStats.teammates, filterMode, searchQuery]);

  const formatTimeAgo = (timestamp: number) => {
    const diffHours = Math.round((Date.now() - timestamp) / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner & Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Overview */}
        <div className="bg-riot-card/85 border border-riot-border rounded-2xl p-5 shadow-lg backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Teammate Synergy</h3>
              <p className="text-xs text-slate-400">Tracked across {matches.length} matches</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="bg-riot-darkest/70 rounded-xl p-2.5 border border-riot-border/60">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Partners</div>
              <div className="text-xl font-black text-slate-100 font-mono">
                {synergyStats.totalTeammatesTracked}
              </div>
            </div>
            <div className="bg-riot-darkest/70 rounded-xl p-2.5 border border-riot-border/60">
              <div className="text-[10px] uppercase font-bold text-pink-400">5+ Game Duos</div>
              <div className="text-xl font-black text-pink-300 font-mono">
                {duos5PlusCount}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Strongest Champion Combo */}
        <div className="md:col-span-2 bg-gradient-to-r from-riot-card/90 via-riot-surface/70 to-riot-card/90 border border-riot-gold/40 rounded-2xl p-5 shadow-lg backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-riot-gold/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-riot-gold animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                Strongest Duo Champion Synergy
              </h3>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-riot-gold/10 text-riot-gold border border-riot-gold/30">
              Highest Win Rate
            </span>
          </div>

          {synergyStats.bestCombo ? (
            <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-riot-darkest/80 border border-riot-border p-3.5 rounded-xl">
              <div className="flex items-center gap-3">
                {/* My Champion */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-pink-500 shadow-neon-pink">
                    <img
                      src={getChampionIconUrl(synergyStats.bestCombo.myChampion)}
                      alt={synergyStats.bestCombo.myChampion}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-[9px] bg-pink-950/90 text-pink-300 border border-pink-500/40 px-1 rounded font-bold">
                    You
                  </span>
                </div>

                <div className="flex flex-col items-center px-1">
                  <HeartHandshake className="w-5 h-5 text-riot-gold" />
                  <span className="text-[9px] font-mono text-slate-400">Combo</span>
                </div>

                {/* Their Champion */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.5)]">
                    <img
                      src={getChampionIconUrl(synergyStats.bestCombo.theirChampion)}
                      alt={synergyStats.bestCombo.theirChampion}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-[9px] bg-indigo-950/90 text-indigo-300 border border-indigo-500/40 px-1 rounded font-bold">
                    Ally
                  </span>
                </div>

                <div className="ml-2">
                  <div className="text-sm font-black text-slate-100 tracking-wide">
                    {synergyStats.bestCombo.myChampion} + {synergyStats.bestCombo.theirChampion}
                  </div>
                  <p className="text-xs text-slate-400">
                    {synergyStats.bestCombo.wins}W - {synergyStats.bestCombo.losses}L across{" "}
                    {synergyStats.bestCombo.games} games
                  </p>
                </div>
              </div>

              {/* Win Rate Badge */}
              <div className="text-right sm:border-l sm:border-riot-border sm:pl-5">
                <div className="text-2xl font-black font-mono text-neon-win">
                  {synergyStats.bestCombo.winRate}%
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Synergy Win Rate</div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400 italic">
              Play more games to unlock combo synergy detection!
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-riot-card/60 p-3 rounded-2xl border border-riot-border">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teammate or champion..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-riot-darkest border border-riot-border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-riot-accent"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1.5 bg-riot-darkest p-1 rounded-xl border border-riot-border text-xs font-semibold w-full sm:w-auto justify-center">
          <button
            onClick={() => setFilterMode("5_PLUS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              filterMode === "5_PLUS"
                ? "bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-neon-pink font-bold"
                : "text-slate-400 hover:text-pink-300"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>5+ Games ({duos5PlusCount})</span>
          </button>
          <button
            onClick={() => setFilterMode("3_PLUS")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === "3_PLUS"
                ? "bg-riot-surface text-slate-100 border border-riot-border shadow-sm font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            3+ Games ({duos3PlusCount})
          </button>
          <button
            onClick={() => setFilterMode("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === "ALL"
                ? "bg-riot-surface text-slate-100 border border-riot-border shadow-sm font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Partners ({synergyStats.teammates.length})
          </button>
        </div>
      </div>

      {/* Teammates Cards Grid */}
      {filteredTeammates.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-riot-border rounded-2xl bg-riot-card/30 p-6">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">
            {filterMode === "5_PLUS"
              ? "No teammates with 5+ games found in these matches"
              : "No teammates match your search"}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {filterMode === "5_PLUS"
              ? "Tip: Switch to '3+ Games' or 'All Partners' above, or increase your match count (to 30, 40, or 50) in the top bar to analyze more games together."
              : "Try adjusting your search query or reset filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeammates.map((teammate) => {
            const isHighWinrate = teammate.winRate >= 60;
            const isLowWinrate = teammate.winRate < 45;

            return (
              <div
                key={teammate.puuid || teammate.displayName}
                className="bg-riot-card/80 border border-riot-border hover:border-riot-border/80 rounded-2xl p-4 shadow-lg backdrop-blur-md transition-all hover:shadow-xl flex flex-col justify-between"
              >
                {/* Header row */}
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-riot-border/50">
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-riot-border shrink-0">
                        <img
                          src={getChampionIconUrl(teammate.mostPlayedChampion)}
                          alt={teammate.mostPlayedChampion}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] font-bold px-0.5 text-slate-300">
                          {teammate.mostPlayedChampion.slice(0, 4)}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-100">{teammate.displayName}</h4>
                          {teammate.isFrequentDuo && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40">
                              Duo Partner
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>{teammate.gamesTogether} games together</span>
                          <span>•</span>
                          <span className="font-mono text-slate-300">
                            {teammate.wins}W - {teammate.losses}L
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Win Rate Circle / Badge */}
                    <div className="text-right">
                      <div
                        className={`text-lg font-black font-mono ${
                          isHighWinrate ? "text-neon-win" : isLowWinrate ? "text-neon-loss" : "text-slate-300"
                        }`}
                      >
                        {teammate.winRate}%
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase font-semibold">Win Rate</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-riot-darkest rounded-full overflow-hidden mt-3 mb-3">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isHighWinrate
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-neon-win"
                          : isLowWinrate
                          ? "bg-rose-500"
                          : "bg-slate-400"
                      }`}
                      style={{ width: `${teammate.winRate}%` }}
                    />
                  </div>

                  {/* Champion Combos with this teammate */}
                  {teammate.topCombos.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Swords className="w-3 h-3 text-riot-accent" />
                        <span>Champion Combos with this Partner:</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {teammate.topCombos.slice(0, 2).map((combo, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-riot-surface/60 border border-riot-border/40 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              {/* Pair icons */}
                              <div className="flex items-center -space-x-1">
                                <img
                                  src={getChampionIconUrl(combo.myChampion)}
                                  alt={combo.myChampion}
                                  className="w-5 h-5 rounded-full border border-pink-400 z-10"
                                  title={`Your ${combo.myChampion}`}
                                />
                                <img
                                  src={getChampionIconUrl(combo.theirChampion)}
                                  alt={combo.theirChampion}
                                  className="w-5 h-5 rounded-full border border-indigo-400"
                                  title={`Their ${combo.theirChampion}`}
                                />
                              </div>
                              <span className="font-medium text-slate-200">
                                {combo.myChampion} + {combo.theirChampion}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-slate-400 text-[11px]">
                                {combo.wins}W/{combo.losses}L ({combo.games}g)
                              </span>
                              <span
                                className={`font-bold text-[11px] ${
                                  combo.winRate >= 60
                                    ? "text-neon-win"
                                    : combo.winRate < 45
                                    ? "text-neon-loss"
                                    : "text-slate-300"
                                }`}
                              >
                                {combo.winRate}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer timestamp */}
                <div className="mt-3 pt-2 border-t border-riot-border/30 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-600" />
                    Last played {formatTimeAgo(teammate.lastPlayed)}
                  </span>
                  {isHighWinrate && teammate.gamesTogether >= 2 && (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" />
                      High Synergy
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
