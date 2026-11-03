import React, { useState, useMemo } from "react";
import { ParsedMatch } from "../types/riot";
import { computeTeammateSynergies } from "../services/synergy";
import { getChampionIconUrl } from "../services/ddragon";
import {
  Users,
  Search,
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
    <div className="space-y-4 animate-in fade-in">
      {/* Top Banner & Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
        {/* Card 1: Overview */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">Teammate Synergy</h3>
              <p className="text-[11px] text-neutral-400">Tracked across {matches.length} matches</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-center tabular-nums">
            <div className="bg-neutral-50 dark:bg-[#12151f] rounded-sm p-2 border border-neutral-200 dark:border-neutral-800">
              <div className="text-[9px] uppercase font-bold text-neutral-400">Total Tracked</div>
              <div className="text-base font-black text-neutral-900 dark:text-neutral-100">
                {synergyStats.totalTeammatesTracked}
              </div>
            </div>
            <div className="bg-neutral-50 dark:bg-[#12151f] rounded-sm p-2 border border-neutral-200 dark:border-neutral-800">
              <div className="text-[9px] uppercase font-bold text-riot-red">5+ Duos</div>
              <div className="text-base font-black text-riot-red">
                {duos5PlusCount}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Strongest Champion Combo */}
        <div className="md:col-span-2 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                Peak Champion Pair Synergy
              </span>
            </div>
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Highest Win Rate
            </span>
          </div>

          {synergyStats.bestCombo ? (
            <div className="mt-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-50 dark:bg-[#12151f] border border-neutral-200 dark:border-neutral-800 p-2.5 rounded-sm">
              <div className="flex items-center gap-2.5">
                {/* My Champion */}
                <div className="relative">
                  <div className="w-9 h-9 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-900">
                    <img
                      src={getChampionIconUrl(synergyStats.bestCombo.myChampion)}
                      alt={synergyStats.bestCombo.myChampion}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 text-[7px] bg-neutral-950 text-neutral-200 px-0.5 font-bold">
                    You
                  </span>
                </div>

                <div className="flex flex-col items-center px-0.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-[8px] font-mono text-neutral-400">+</span>
                </div>

                {/* Their Champion */}
                <div className="relative">
                  <div className="w-9 h-9 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-900">
                    <img
                      src={getChampionIconUrl(synergyStats.bestCombo.theirChampion)}
                      alt={synergyStats.bestCombo.theirChampion}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 text-[7px] bg-neutral-950 text-neutral-200 px-0.5 font-bold">
                    Ally
                  </span>
                </div>

                <div className="ml-1.5">
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {synergyStats.bestCombo.myChampion} & {synergyStats.bestCombo.theirChampion}
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 tabular-nums">
                    {synergyStats.bestCombo.wins}W - {synergyStats.bestCombo.losses}L ({synergyStats.bestCombo.games} games)
                  </p>
                </div>
              </div>

              {/* Win Rate Badge */}
              <div className="text-right sm:border-l sm:border-neutral-200 dark:sm:border-neutral-800 sm:pl-4 tabular-nums">
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {synergyStats.bestCombo.winRate}%
                </div>
                <div className="text-[9px] text-neutral-400 uppercase font-semibold">Synergy WR</div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-neutral-400 font-mono">
              Gathering match telemetry for duo combo detection...
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white dark:bg-[#0c0e14] p-2.5 rounded border border-neutral-200 dark:border-neutral-800 font-mono">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search partner or champion..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700/80 rounded text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-riot-red"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-0.5 rounded-sm border border-neutral-200 dark:border-neutral-800 text-xs">
          <button
            onClick={() => setFilterMode("5_PLUS")}
            className={`px-2.5 py-1 rounded-sm text-xs font-bold transition-all ${
              filterMode === "5_PLUS"
                ? "bg-riot-red text-white"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            5+ Games ({duos5PlusCount})
          </button>
          <button
            onClick={() => setFilterMode("3_PLUS")}
            className={`px-2.5 py-1 rounded-sm text-xs font-bold transition-all ${
              filterMode === "3_PLUS"
                ? "bg-riot-red text-white"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            3+ Games ({duos3PlusCount})
          </button>
          <button
            onClick={() => setFilterMode("ALL")}
            className={`px-2.5 py-1 rounded-sm text-xs font-bold transition-all ${
              filterMode === "ALL"
                ? "bg-riot-red text-white"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            All ({synergyStats.teammates.length})
          </button>
        </div>
      </div>

      {/* Teammates Cards Grid */}
      {filteredTeammates.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-sm bg-white dark:bg-[#0c0e14] p-6 font-mono">
          <Users className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            {filterMode === "5_PLUS"
              ? "No partners with 5+ matches in current sample"
              : "No partners matching search criteria"}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Switch filter to '3+ Games' or 'All', or fetch more matches from the top bar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
          {filteredTeammates.map((teammate) => {
            const isHighWinrate = teammate.winRate >= 60;
            const isLowWinrate = teammate.winRate < 45;

            return (
              <div
                key={teammate.puuid || teammate.displayName}
                className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded p-3 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-9 h-9 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-900 shrink-0">
                        <img
                          src={getChampionIconUrl(teammate.mostPlayedChampion)}
                          alt={teammate.mostPlayedChampion}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 bg-neutral-950 text-[7px] font-bold px-0.5 text-neutral-200">
                          {teammate.mostPlayedChampion.slice(0, 3)}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{teammate.displayName}</h4>
                          {teammate.isFrequentDuo && (
                            <span className="text-[8px] uppercase font-bold px-1 py-0.2 rounded-sm bg-riot-red/10 text-riot-red border border-riot-red/30">
                              Duo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5 tabular-nums">
                          <span>{teammate.gamesTogether}g together</span>
                          <span>•</span>
                          <span>{teammate.wins}W - {teammate.losses}L</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right tabular-nums">
                      <div
                        className={`text-base font-black ${
                          isHighWinrate ? "text-emerald-600 dark:text-emerald-400" : isLowWinrate ? "text-riot-red" : "text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {teammate.winRate}%
                      </div>
                      <div className="text-[8px] text-neutral-400 uppercase font-semibold">Win Rate</div>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-none overflow-hidden mt-2.5 mb-2.5">
                    <div
                      className={`h-full transition-all ${
                        isHighWinrate
                          ? "bg-emerald-500"
                          : isLowWinrate
                          ? "bg-riot-red"
                          : "bg-neutral-400"
                      }`}
                      style={{ width: `${teammate.winRate}%` }}
                    />
                  </div>

                  {/* Champion Combos */}
                  {teammate.topCombos.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[9px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                        <Swords className="w-2.5 h-2.5 text-riot-red" />
                        <span>Pair Combos:</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {teammate.topCombos.slice(0, 2).map((combo, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-2 py-1 rounded-sm bg-neutral-50 dark:bg-[#12151f] border border-neutral-200 dark:border-neutral-800 text-[11px]"
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center -space-x-1">
                                <img
                                  src={getChampionIconUrl(combo.myChampion)}
                                  alt={combo.myChampion}
                                  className="w-4 h-4 rounded-none border border-neutral-400 z-10"
                                  title={`Your ${combo.myChampion}`}
                                />
                                <img
                                  src={getChampionIconUrl(combo.theirChampion)}
                                  alt={combo.theirChampion}
                                  className="w-4 h-4 rounded-none border border-neutral-400"
                                  title={`Their ${combo.theirChampion}`}
                                />
                              </div>
                              <span className="font-medium text-neutral-800 dark:text-neutral-200 text-xs">
                                {combo.myChampion} + {combo.theirChampion}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 tabular-nums text-[10px]">
                              <span className="text-neutral-400">
                                {combo.wins}W/{combo.losses}L
                              </span>
                              <span
                                className={`font-bold ${
                                  combo.winRate >= 60
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : combo.winRate < 45
                                    ? "text-riot-red"
                                    : "text-neutral-600 dark:text-neutral-300"
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
                <div className="mt-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[9px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    Last played {formatTimeAgo(teammate.lastPlayed)}
                  </span>
                  {isHighWinrate && teammate.gamesTogether >= 2 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" />
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
