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
  Sparkles,
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

  // All champions from DataDragon for search autocomplete
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

  // Compute live match stats for each champion in the pool
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
          bg: "bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-neon-pink",
        };
      case "A_TIER":
        return {
          label: "A-Tier Core",
          bg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
        };
      case "COUNTER":
        return {
          label: "Situational Counter",
          bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        };
      case "LEARNING":
        return {
          label: "In Training",
          bg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
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
        return "Bot Carry (ADC)";
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
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner & Pool Highlights */}
      <div className="bg-gradient-to-r from-riot-card via-riot-surface to-riot-card border border-riot-border rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-riot-accent" />
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
              Champion Pool & Mastery Roster
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Curate your active competitive pool by role and priority tier. Track live match
            performance and attach situational counter builds for every matchup.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-riot-accent text-white text-xs font-bold shadow-neon-pink hover:bg-pink-600 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Champion to Pool</span>
        </button>
      </div>

      {/* Role & Tier Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-riot-surface/80 p-3 rounded-2xl border border-riot-border">
        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
          {(
            [
              { id: "ALL", label: "All Roles" },
              { id: "BOTTOM", label: "Bot (ADC)" },
              { id: "UTILITY", label: "Support" },
              { id: "MIDDLE", label: "Mid" },
              { id: "TOP", label: "Top" },
              { id: "JUNGLE", label: "Jungle" },
            ] as const
          ).map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedRole === r.id
                  ? "bg-riot-accent text-white font-bold shadow-sm"
                  : "bg-riot-darkest text-slate-400 hover:text-slate-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Tier Filter */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
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
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedTier === t.id
                  ? "bg-riot-surface text-slate-100 border border-riot-border font-bold"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Champion Pool Cards Grid */}
      {filteredPool.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-riot-border rounded-2xl bg-riot-card/30">
          <Shield className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">No champions in this category</p>
          <p className="text-xs text-slate-500 mt-1">
            Click "Add Champion to Pool" to register your mains and counterpicks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className="bg-riot-card/85 border border-riot-border hover:border-riot-border/80 rounded-2xl p-4 shadow-lg backdrop-blur-md transition-all hover:shadow-xl flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-riot-gold/70 shadow-md shrink-0">
                        <img
                          src={getChampionIconUrl(c.championName)}
                          alt={c.championName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-slate-100">{c.championName}</h3>
                        </div>
                        <span className="text-[11px] font-medium text-slate-400">
                          {getRoleLabel(c.role)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveChampion(c.championName, c.role)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove from pool"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tier Badge */}
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${tierBadge.bg}`}
                    >
                      {tierBadge.label}
                    </span>
                    {liveStats ? (
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {liveStats.games} games tracked
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">
                        0 matches in current history
                      </span>
                    )}
                  </div>

                  {/* Live Match Stats Strip */}
                  {liveStats ? (
                    <div className="mt-3 grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-riot-darkest/70 border border-riot-border/50 text-center font-mono">
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase font-sans">Win Rate</div>
                        <div
                          className={`text-sm font-black ${
                            wr! >= 50 ? "text-neon-win" : "text-neon-loss"
                          }`}
                        >
                          {wr}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase font-sans">KDA Ratio</div>
                        <div className="text-sm font-black text-slate-100">{kda}:1</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase font-sans">CS / Min</div>
                        <div className="text-sm font-black text-amber-300">{csPerMin}</div>
                      </div>
                    </div>
                  ) : null}

                  {/* Strategy Notes */}
                  {c.notes && (
                    <div className="mt-3 text-xs text-slate-400 bg-riot-surface/50 border border-riot-border/40 p-2.5 rounded-xl leading-relaxed">
                      <p className="line-clamp-2">{c.notes}</p>
                    </div>
                  )}
                </div>

                {/* Footer Action: Go To Custom Builds */}
                <div className="pt-2 border-t border-riot-border/40">
                  <button
                    onClick={() => onNavigateToBuilds(c.championName)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-riot-accent/15 border border-riot-accent/40 text-riot-accent hover:bg-riot-accent hover:text-white text-xs font-bold tracking-wide transition-all active:scale-98"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>View / Create Builds</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Champion Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-riot-card border border-riot-border w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-riot-border/60">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-riot-accent" />
                Add Champion to Pool
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Champion Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase">
                Select Champion
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={champSearch}
                  onChange={(e) => setChampSearch(e.target.value)}
                  placeholder="Search champion name..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-riot-darkest border border-riot-border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-riot-accent"
                />
              </div>

              {/* Fast Autocomplete Chips */}
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-2 custom-scrollbar">
                {filteredSearchChamps.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setNewChampName(c.name);
                      setChampSearch(c.name);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border transition-all ${
                      newChampName === c.name
                        ? "bg-riot-accent text-white border-riot-accent font-bold shadow-sm"
                        : "bg-riot-surface border-riot-border text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    <img
                      src={getChampionIconUrl(c.id)}
                      alt={c.name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Role & Tier Selectors */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as ChampionRole)}
                  className="mt-1 w-full bg-riot-darkest border border-riot-border rounded-xl text-slate-200 text-xs px-3 py-2 focus:outline-none focus:border-riot-accent"
                >
                  <option value="BOTTOM">Bot Carry (ADC)</option>
                  <option value="UTILITY">Support</option>
                  <option value="MIDDLE">Mid Lane</option>
                  <option value="TOP">Top Lane</option>
                  <option value="JUNGLE">Jungle</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase">Proficiency</label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value as PoolTier)}
                  className="mt-1 w-full bg-riot-darkest border border-riot-border rounded-xl text-slate-200 text-xs px-3 py-2 focus:outline-none focus:border-riot-accent"
                >
                  <option value="S_TIER">S-Tier (Main)</option>
                  <option value="A_TIER">A-Tier (Core)</option>
                  <option value="COUNTER">Situational Counter</option>
                  <option value="LEARNING">In Training</option>
                </select>
              </div>
            </div>

            {/* Strategy Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase">
                Strategy Notes & Synergies
              </label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Pick with enchanters vs heavy dive comps. Focus on wave control..."
                rows={3}
                className="w-full bg-riot-darkest border border-riot-border rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-riot-accent resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddChampion}
                disabled={!newChampName}
                className="px-5 py-2 rounded-xl bg-riot-accent text-white text-xs font-bold shadow-neon-pink disabled:opacity-50"
              >
                Add to Pool
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
