import React, { useState, useMemo, useEffect } from "react";
import { ParsedMatch } from "../types/riot";
import { PoolChampion, ChampionRole, PoolTier } from "../types/builds";
import { loadChampionPool, saveChampionPool } from "../services/buildsStorage";
import {
  getChampionIconUrl,
  fetchAllChampions,
  ChampionBasicInfo,
} from "../services/ddragon";
import {
  Shield,
  Plus,
  Trash2,
  Search,
  Filter,
  Package,
} from "lucide-react";

interface ChampionPoolTabProps {
  matches: ParsedMatch[];
  onNavigateToBuilds: (championName: string) => void;
}

export const ChampionPoolTab: React.FC<ChampionPoolTabProps> = ({
  matches,
  onNavigateToBuilds,
}) => {
  const [pool, setPool] = useState<PoolChampion[]>(loadChampionPool);
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [allChamps, setAllChamps] = useState<ChampionBasicInfo[]>([]);
  const [champSearch, setChampSearch] = useState("");
  const [newChampName, setNewChampName] = useState("");
  const [newRole, setNewRole] = useState<ChampionRole>("BOTTOM");
  const [newTier, setNewTier] = useState<PoolTier>("S_TIER");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    fetchAllChampions().then(setAllChamps);
  }, []);

  const saveAndSetPool = (newPool: PoolChampion[]) => {
    setPool(newPool);
    saveChampionPool(newPool);
  };

  const handleRemoveChampion = (champName: string, role: ChampionRole) => {
    const updated = pool.filter(
      (c) => !(c.championName === champName && c.role === role)
    );
    saveAndSetPool(updated);
  };

  const handleAddChampion = () => {
    if (!newChampName.trim()) return;
    const exists = pool.some(
      (c) => c.championName.toLowerCase() === newChampName.toLowerCase() && c.role === newRole
    );
    if (exists) return;

    const updated: PoolChampion[] = [
      ...pool,
      {
        championName: newChampName.trim(),
        role: newRole,
        tier: newTier,
        notes: newNotes.trim(),
        addedAt: Date.now(),
      },
    ];
    saveAndSetPool(updated);
    setIsAddModalOpen(false);
    setNewChampName("");
    setNewNotes("");
  };

  const championStatsMap = useMemo(() => {
    const stats: Record<
      string,
      { games: number; wins: number; kills: number; deaths: number; assists: number; cs: number; duration: number }
    > = {};

    matches.forEach((m) => {
      const p = m.targetParticipant;
      if (!p) return;
      const name = p.championName;
      if (!stats[name]) {
        stats[name] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, cs: 0, duration: 0 };
      }
      stats[name].games++;
      if (p.win) stats[name].wins++;
      stats[name].kills += p.kills;
      stats[name].deaths += p.deaths;
      stats[name].assists += p.assists;
      stats[name].cs += p.cs;
      stats[name].duration += m.gameDuration;
    });

    return stats;
  }, [matches]);

  const filteredPool = useMemo(() => {
    return pool.filter((c) => {
      if (selectedRole !== "ALL" && c.role !== selectedRole) return false;
      if (selectedTier !== "ALL" && c.tier !== selectedTier) return false;
      return true;
    });
  }, [pool, selectedRole, selectedTier]);

  const getTierBadge = (tier: PoolTier) => {
    switch (tier) {
      case "S_TIER":
        return {
          label: "S-Tier Main",
          bg: "bg-riot-red/10 text-riot-red border-riot-red/30",
        };
      case "A_TIER":
        return {
          label: "A-Tier Core",
          bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
        };
      case "COUNTER":
        return {
          label: "Situational",
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        };
      case "LEARNING":
        return {
          label: "In Training",
          bg: "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700",
        };
    }
  };

  const getRoleLabel = (role: ChampionRole) => {
    switch (role) {
      case "TOP":
        return "Top Lane";
      case "JUNGLE":
        return "Jungle";
      case "MIDDLE":
        return "Mid Lane";
      case "BOTTOM":
        return "Bot Carry";
      case "UTILITY":
        return "Support";
    }
  };

  const filteredSearchChamps = useMemo(() => {
    if (!champSearch.trim()) return allChamps.slice(0, 15);
    const q = champSearch.toLowerCase();
    return allChamps.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 15);
  }, [allChamps, champSearch]);

  return (
    <div className="space-y-4 animate-in fade-in font-mono">
      {/* Top Banner & Pool Highlights */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-riot-red" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              Champion Pool & Performance Roster
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">
            Organize your competitive pool by role and priority tier with integrated match telemetry.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-riot-red text-white text-xs font-bold hover:bg-riot-redHover active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Champion</span>
        </button>
      </div>

      {/* Role & Tier Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-[#0c0e14] p-2.5 rounded border border-neutral-200 dark:border-neutral-800 text-xs">
        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-1">
          <Filter className="w-3 h-3 text-neutral-400 mr-1" />
          {(
            [
              { id: "ALL", label: "All Roles" },
              { id: "BOTTOM", label: "Bot" },
              { id: "UTILITY", label: "Support" },
              { id: "MIDDLE", label: "Mid" },
              { id: "TOP", label: "Top" },
              { id: "JUNGLE", label: "Jungle" },
            ] as const
          ).map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`px-2.5 py-1 rounded-sm transition-all font-bold ${
                selectedRole === r.id
                  ? "bg-riot-red text-white"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Tier Filter */}
        <div className="flex items-center gap-1">
          {(
            [
              { id: "ALL", label: "All Tiers" },
              { id: "S_TIER", label: "S-Tier" },
              { id: "A_TIER", label: "A-Tier" },
              { id: "COUNTER", label: "Counters" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTier(t.id)}
              className={`px-2.5 py-1 rounded-sm transition-all font-bold ${
                selectedTier === t.id
                  ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Champion Pool Cards Grid */}
      {filteredPool.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-sm bg-white dark:bg-[#0c0e14]">
          <Shield className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">No champions in this category</p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Click "Add Champion" to register your mains and counterpicks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPool.map((c) => {
            const tierBadge = getTierBadge(c.tier);
            const liveStats = championStatsMap[c.championName];
            const wr = liveStats && liveStats.games > 0 ? Math.round((liveStats.wins / liveStats.games) * 100) : null;
            const deaths = liveStats ? (liveStats.deaths === 0 ? 1 : liveStats.deaths) : 1;
            const kda = liveStats
              ? ((liveStats.kills + liveStats.assists) / deaths).toFixed(2)
              : null;
            const csPerMin =
              liveStats && liveStats.duration > 0
                ? (liveStats.cs / (liveStats.duration / 60)).toFixed(1)
                : null;

            return (
              <div
                key={`${c.championName}-${c.role}`}
                className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded p-3 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-10 h-10 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-900 shrink-0">
                        <img
                          src={getChampionIconUrl(c.championName)}
                          alt={c.championName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{c.championName}</h3>
                        <span className="text-[10px] text-neutral-400">
                          {getRoleLabel(c.role)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveChampion(c.championName, c.role)}
                      className="p-1 rounded-sm text-neutral-400 hover:text-riot-red hover:bg-riot-red/10 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Tier Badge */}
                  <div className="mt-2.5 flex items-center justify-between">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-sm border ${tierBadge.bg}`}
                    >
                      {tierBadge.label}
                    </span>
                    {liveStats ? (
                      <span className="text-[10px] font-bold text-neutral-500 tabular-nums">
                        {liveStats.games}g tracked
                      </span>
                    ) : (
                      <span className="text-[9px] text-neutral-400">
                        0 matches
                      </span>
                    )}
                  </div>

                  {/* Live Match Stats Strip */}
                  {liveStats ? (
                    <div className="mt-2.5 grid grid-cols-3 gap-1 p-1.5 rounded-sm bg-neutral-50 dark:bg-[#12151f] border border-neutral-200 dark:border-neutral-800 text-center tabular-nums">
                      <div>
                        <div className="text-[8px] text-neutral-400 uppercase">Win Rate</div>
                        <div
                          className={`text-xs font-black ${
                            wr! >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-riot-red"
                          }`}
                        >
                          {wr}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[8px] text-neutral-400 uppercase">KDA</div>
                        <div className="text-xs font-black text-neutral-800 dark:text-neutral-200">{kda}:1</div>
                      </div>
                      <div>
                        <div className="text-[8px] text-neutral-400 uppercase">CS / M</div>
                        <div className="text-xs font-black text-amber-500">{csPerMin}</div>
                      </div>
                    </div>
                  ) : null}

                  {/* Strategy Notes */}
                  {c.notes && (
                    <div className="mt-2.5 text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-[#12151f] border border-neutral-200 dark:border-neutral-800 p-2 rounded-sm leading-relaxed">
                      <p className="line-clamp-2">{c.notes}</p>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    onClick={() => onNavigateToBuilds(c.championName)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-riot-red hover:text-white border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all"
                  >
                    <Package className="w-3 h-3" />
                    <span>Build Matrix</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Champion Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0e1118] border border-neutral-300 dark:border-neutral-700 w-full max-w-md rounded p-5 shadow-xl space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200 dark:border-neutral-800">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                Register Champion to Pool
              </span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Champion Picker */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">
                Search Roster
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={champSearch}
                  onChange={(e) => setChampSearch(e.target.value)}
                  placeholder="Champion name..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-riot-red"
                />
              </div>

              {/* Fast Autocomplete Chips */}
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pt-1.5 custom-scrollbar">
                {filteredSearchChamps.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setNewChampName(c.name);
                      setChampSearch(c.name);
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs border transition-all ${
                      newChampName === c.name
                        ? "bg-riot-red text-white border-riot-red font-bold"
                        : "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <img
                      src={getChampionIconUrl(c.id)}
                      alt={c.name}
                      className="w-3.5 h-3.5 rounded-none object-cover"
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Role & Tier Selectors */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as ChampionRole)}
                  className="mt-1 w-full bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 text-xs px-2 py-1.5 focus:outline-none focus:border-riot-red"
                >
                  <option value="BOTTOM">Bot Carry (ADC)</option>
                  <option value="UTILITY">Support</option>
                  <option value="MIDDLE">Mid Lane</option>
                  <option value="TOP">Top Lane</option>
                  <option value="JUNGLE">Jungle</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Tier</label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value as PoolTier)}
                  className="mt-1 w-full bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 text-xs px-2 py-1.5 focus:outline-none focus:border-riot-red"
                >
                  <option value="S_TIER">S-Tier (Main)</option>
                  <option value="A_TIER">A-Tier (Core)</option>
                  <option value="COUNTER">Counterpick</option>
                  <option value="LEARNING">In Training</option>
                </select>
              </div>
            </div>

            {/* Strategy Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">
                Tactical Notes
              </label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Focus on wave control, weak vs heavy poke..."
                rows={2}
                className="w-full bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded p-2 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-riot-red resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1.5">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded-sm text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddChampion}
                disabled={!newChampName}
                className="px-4 py-1.5 rounded bg-riot-red text-white text-xs font-bold hover:bg-riot-redHover disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
