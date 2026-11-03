import React, { useState, useMemo, useEffect } from "react";
import {
  CustomBuildPlan,
  EnemyThreatArchetype,
  AllySynergyArchetype,
  ChampionRole,
} from "../types/builds";
import {
  loadCustomBuilds,
  saveCustomBuilds,
  loadChampionPool,
  exportLlmDataset,
} from "../services/buildsStorage";
import {
  fetchAllItems,
  getChampionIconUrl,
  ItemInfo,
} from "../services/ddragon";
import { ItemTooltip } from "./ItemTooltip";
import {
  Package,
  Plus,
  Trash2,
  Sparkles,
  Search,
  Download,
  Copy,
  Check,
  Shield,
  HeartHandshake,
  Bot,
} from "lucide-react";

interface ItemBuildPlannerTabProps {
  initialChampion?: string;
}

const ENEMY_THREAT_LABELS: Record<EnemyThreatArchetype, { label: string; color: string }> = {
  HEAVY_ARMOR: { label: "Heavy Armor / Tanks", color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
  HEAVY_MAGIC: { label: "Heavy AP / Magic Burst", color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10" },
  HIGH_HEALING: { label: "High Healing / Sustain", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
  ASSASSIN_DIVE: { label: "High Burst / Assassins", color: "text-rose-400 border-rose-500/40 bg-rose-500/10" },
  HIGH_SHIELDS: { label: "Heavy Shields", color: "text-purple-400 border-purple-500/40 bg-purple-500/10" },
  HEAVY_CC: { label: "Heavy Lockdown CC", color: "text-indigo-400 border-indigo-500/40 bg-indigo-500/10" },
  STANDARD_BALANCED: { label: "Balanced Standard Comp", color: "text-slate-300 border-slate-500/40 bg-slate-500/10" },
};

const ALLY_SYNERGY_LABELS: Record<AllySynergyArchetype, { label: string; color: string }> = {
  ENGAGE_DIVE: { label: "Engage / Dive Frontline", color: "text-blue-300 border-blue-500/40 bg-blue-500/10" },
  ENCHANTER_PEEL: { label: "Enchanter / Peel Support", color: "text-pink-300 border-pink-500/40 bg-pink-500/10" },
  POKE_SIEGE: { label: "Poke / Long Range Siege", color: "text-amber-300 border-amber-500/40 bg-amber-500/10" },
  HYPERCARRY_COMP: { label: "Protect-The-Carry", color: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" },
};

export const ItemBuildPlannerTab: React.FC<ItemBuildPlannerTabProps> = ({
  initialChampion,
}) => {
  const [builds, setBuilds] = useState<CustomBuildPlan[]>(loadCustomBuilds);
  const pool = useMemo(() => loadChampionPool(), []);

  // Selected Champion Filter
  const [selectedChamp, setSelectedChamp] = useState<string>(() => {
    if (initialChampion) return initialChampion;
    if (pool.length > 0) return pool[0].championName;
    return "Caitlyn";
  });

  const [copiedDataset, setCopiedDataset] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // All Items from DataDragon
  const [allItemsList, setAllItemsList] = useState<ItemInfo[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [activeItemSlotType, setActiveItemSlotType] = useState<
    "starting" | "core" | "situational" | "boots" | null
  >(null);

  // Form State for new build
  const [formTitle, setFormTitle] = useState("");
  const [formRole, setFormRole] = useState<ChampionRole>("BOTTOM");
  const [formThreats, setFormThreats] = useState<EnemyThreatArchetype[]>(["HEAVY_ARMOR"]);
  const [formSynergies, setFormSynergies] = useState<AllySynergyArchetype[]>(["ENCHANTER_PEEL"]);
  const [formStarting, setFormStarting] = useState<number[]>([]);
  const [formCore, setFormCore] = useState<number[]>([]);
  const [formSituational, setFormSituational] = useState<number[]>([]);
  const [formBoots, setFormBoots] = useState<number[]>([]);
  const [formNotes, setFormNotes] = useState("");
  const [formReasoning, setFormReasoning] = useState("");

  useEffect(() => {
    fetchAllItems().then((itemsMap) => {
      const list = Object.values(itemsMap).filter((item) => {
        // Filter out obsolete/deprecated or map-specific non-standard items
        return (
          item.gold?.purchasable &&
          item.gold.total > 0 &&
          !item.name.includes("Quick Charge") &&
          !item.name.includes("Placeholder")
        );
      });
      list.sort((a, b) => (b.gold?.total || 0) - (a.gold?.total || 0));
      setAllItemsList(list);
    });
  }, []);

  const saveAndSetBuilds = (newBuilds: CustomBuildPlan[]) => {
    setBuilds(newBuilds);
    saveCustomBuilds(newBuilds);
  };

  const currentChampBuilds = useMemo(() => {
    return builds.filter(
      (b) => b.championName.toLowerCase() === selectedChamp.toLowerCase()
    );
  }, [builds, selectedChamp]);

  const handleDeleteBuild = (id: string) => {
    const updated = builds.filter((b) => b.id !== id);
    saveAndSetBuilds(updated);
  };

  const handleCopyDataset = () => {
    const dataset = exportLlmDataset(builds);
    navigator.clipboard.writeText(dataset);
    setCopiedDataset(true);
    setTimeout(() => setCopiedDataset(false), 2500);
  };

  const handleDownloadDataset = () => {
    const dataset = exportLlmDataset(builds);
    const blob = new Blob([dataset], { type: "application/jsonl" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `league_build_predictor_dataset_${Date.now()}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveBuild = () => {
    if (!formTitle.trim()) return;

    const newBuild: CustomBuildPlan = {
      id: `${selectedChamp.toLowerCase()}-${Date.now()}`,
      championName: selectedChamp,
      title: formTitle.trim(),
      role: formRole,
      enemyThreats: formThreats,
      allySynergies: formSynergies,
      startingItemIds: formStarting,
      coreItemIds: formCore,
      situationalItemIds: formSituational,
      bootItemIds: formBoots,
      runesOrNotes: formNotes.trim(),
      llmReasoningPrompt: formReasoning.trim(),
      updatedAt: Date.now(),
    };

    saveAndSetBuilds([...builds, newBuild]);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormTitle("");
    setFormThreats(["HEAVY_ARMOR"]);
    setFormSynergies(["ENCHANTER_PEEL"]);
    setFormStarting([]);
    setFormCore([]);
    setFormSituational([]);
    setFormBoots([]);
    setFormNotes("");
    setFormReasoning("");
    setActiveItemSlotType(null);
  };

  const toggleThreat = (threat: EnemyThreatArchetype) => {
    setFormThreats((prev) =>
      prev.includes(threat) ? prev.filter((t) => t !== threat) : [...prev, threat]
    );
  };

  const toggleSynergy = (synergy: AllySynergyArchetype) => {
    setFormSynergies((prev) =>
      prev.includes(synergy) ? prev.filter((s) => s !== synergy) : [...prev, synergy]
    );
  };

  const addItemToSlot = (itemId: number) => {
    if (activeItemSlotType === "starting") {
      setFormStarting((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
    } else if (activeItemSlotType === "core") {
      setFormCore((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
    } else if (activeItemSlotType === "situational") {
      setFormSituational((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
    } else if (activeItemSlotType === "boots") {
      setFormBoots((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
    }
  };

  const removeItemFromSlot = (slot: "starting" | "core" | "situational" | "boots", id: number) => {
    if (slot === "starting") setFormStarting((prev) => prev.filter((x) => x !== id));
    if (slot === "core") setFormCore((prev) => prev.filter((x) => x !== id));
    if (slot === "situational") setFormSituational((prev) => prev.filter((x) => x !== id));
    if (slot === "boots") setFormBoots((prev) => prev.filter((x) => x !== id));
  };

  const filteredItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return allItemsList.slice(0, 36);
    const q = itemSearchQuery.toLowerCase();
    return allItemsList
      .filter((it) => it.name.toLowerCase().includes(q) || (it.plaintext && it.plaintext.toLowerCase().includes(q)))
      .slice(0, 36);
  }, [allItemsList, itemSearchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner & AI Exporter */}
      <div className="bg-gradient-to-r from-riot-card via-riot-surface to-riot-card border border-riot-border rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-riot-accent" />
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
              Situational Build Strategist & Item Pool
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Design targeted item spikes and situational counters for each champion based on enemy
            threats and team synergies. Formatted for future AI build prediction training.
          </p>
        </div>

        {/* LLM Exporter Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyDataset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-riot-surface border border-riot-border text-slate-300 hover:text-white text-xs font-semibold hover:border-riot-accent transition-all cursor-pointer"
            title="Copy all custom build scenarios in JSONL format for LLM prompt training"
          >
            {copiedDataset ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-riot-accent" />
            )}
            <span>{copiedDataset ? "Dataset Copied!" : "Copy LLM JSONL"}</span>
          </button>

          <button
            onClick={handleDownloadDataset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-riot-surface border border-riot-border text-slate-300 hover:text-white text-xs font-semibold hover:border-riot-accent transition-all cursor-pointer"
            title="Download JSONL dataset file"
          >
            <Download className="w-3.5 h-3.5 text-riot-gold" />
            <span>Export Dataset</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-riot-accent text-white text-xs font-bold shadow-neon-pink hover:bg-pink-600 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Build</span>
          </button>
        </div>
      </div>

      {/* Champion Tabs Selector from Champion Pool */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {pool.map((c) => {
          const isSelected = selectedChamp.toLowerCase() === c.championName.toLowerCase();
          const count = builds.filter(
            (b) => b.championName.toLowerCase() === c.championName.toLowerCase()
          ).length;

          return (
            <button
              key={`${c.championName}-${c.role}`}
              onClick={() => setSelectedChamp(c.championName)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-gradient-to-r from-pink-500/25 to-indigo-500/25 border-pink-500/50 shadow-neon-pink text-slate-100"
                  : "bg-riot-card/80 border-riot-border text-slate-400 hover:text-slate-200 hover:bg-riot-surface"
              }`}
            >
              <div className="w-7 h-7 rounded-xl overflow-hidden border border-riot-border/70 shrink-0">
                <img
                  src={getChampionIconUrl(c.championName)}
                  alt={c.championName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">{c.championName}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {count} {count === 1 ? "build" : "builds"}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Build Plans for Selected Champion */}
      {currentChampBuilds.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-riot-border rounded-2xl bg-riot-card/30 p-6 space-y-3">
          <Bot className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">
            No situational builds created for {selectedChamp} yet
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create custom build branches based on who you're playing against (e.g. Tank Busters, Anti-Heal, Magic Resist) so you're always prepared in champion select.
          </p>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-riot-accent text-white text-xs font-bold shadow-neon-pink"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Build Plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {currentChampBuilds.map((b) => (
            <div
              key={b.id}
              className="bg-riot-card/85 border border-riot-border rounded-2xl p-5 shadow-lg backdrop-blur-md space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Build Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-riot-border shrink-0">
                      <img
                        src={getChampionIconUrl(b.championName)}
                        alt={b.championName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{b.title}</h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        {b.championName} • {b.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteBuild(b.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Build"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Matchup Archetype Tags */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-16">
                      Enemy:
                    </span>
                    {b.enemyThreats.map((threat) => {
                      const meta = ENEMY_THREAT_LABELS[threat];
                      return (
                        <span
                          key={threat}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      );
                    })}
                  </div>

                  {b.allySynergies.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-16">
                        Ally:
                      </span>
                      {b.allySynergies.map((syn) => {
                        const meta = ALLY_SYNERGY_LABELS[syn];
                        return (
                          <span
                            key={syn}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.color}`}
                          >
                            {meta.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Items Sections with Live Tooltips */}
                <div className="space-y-2.5 pt-1">
                  {/* Core Spikes */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider">
                      Core Spikes (1st, 2nd, 3rd Item)
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {b.coreItemIds.map((id) => (
                        <ItemTooltip key={id} itemId={id} size="md" />
                      ))}
                      {b.bootItemIds.map((id) => (
                        <div key={id} className="ml-1">
                          <ItemTooltip itemId={id} size="md" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Situational Counters */}
                  {b.situationalItemIds.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                        Situational Counters (4th, 5th, 6th Slot)
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        {b.situationalItemIds.map((id) => (
                          <ItemTooltip key={id} itemId={id} size="md" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Starting Items */}
                  {b.startingItemIds.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Starting Items
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {b.startingItemIds.map((id) => (
                          <ItemTooltip key={id} itemId={id} size="sm" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Reasoning Prompt / Strategy Notes */}
                {(b.llmReasoningPrompt || b.runesOrNotes) && (
                  <div className="bg-riot-surface/50 border border-riot-border/50 rounded-xl p-3 text-xs space-y-1.5 font-sans leading-relaxed">
                    {b.runesOrNotes && (
                      <div className="text-slate-300">
                        <strong className="text-pink-300">Runes / Playstyle:</strong>{" "}
                        {b.runesOrNotes}
                      </div>
                    )}
                    {b.llmReasoningPrompt && (
                      <div className="text-slate-400">
                        <strong className="text-riot-gold font-mono">AI Strategic Reasoning:</strong>{" "}
                        {b.llmReasoningPrompt}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-riot-border/30">
                Last updated {new Date(b.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Custom Build Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-riot-card border border-riot-border w-full max-w-2xl max-h-[90vh] rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-riot-border/60">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-riot-accent" />
                <h3 className="text-base font-bold text-slate-100">
                  Create Custom Build Scenario ({selectedChamp})
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 custom-scrollbar flex-1">
              {/* Build Title & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300 uppercase">
                    Build Scenario Title
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Anti-Tank Shred, Magic Resist Shielding, Anti-Burst..."
                    className="mt-1 w-full bg-riot-darkest border border-riot-border rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-riot-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase">
                    Role Position
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as ChampionRole)}
                    className="mt-1 w-full bg-riot-darkest border border-riot-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-riot-accent"
                  >
                    <option value="BOTTOM">Bot Carry (ADC)</option>
                    <option value="UTILITY">Support</option>
                    <option value="MIDDLE">Mid Lane</option>
                    <option value="TOP">Top Lane</option>
                    <option value="JUNGLE">Jungle</option>
                  </select>
                </div>
              </div>

              {/* Enemy Threats Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Enemy Matchup Threats (Select applicable):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(ENEMY_THREAT_LABELS) as EnemyThreatArchetype[]).map((t) => {
                    const isSelected = formThreats.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleThreat(t)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                          isSelected
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                            : "bg-riot-darkest text-slate-400 border-riot-border hover:text-slate-200"
                        }`}
                      >
                        {ENEMY_THREAT_LABELS[t].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ally Synergies Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-pink-400" />
                  Ally Composition Synergy (Select applicable):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(ALLY_SYNERGY_LABELS) as AllySynergyArchetype[]).map((s) => {
                    const isSelected = formSynergies.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSynergy(s)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                          isSelected
                            ? "bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-sm"
                            : "bg-riot-darkest text-slate-400 border-riot-border hover:text-slate-200"
                        }`}
                      >
                        {ALLY_SYNERGY_LABELS[s].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Item Pickers */}
              <div className="space-y-3 bg-riot-surface/60 border border-riot-border rounded-2xl p-4">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Item Inventory Setup (Click "+ Add" to browse items)
                </span>

                {/* Core Items Row */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-cyan-300 font-bold">Core Items (1st–3rd Item Spikes)</span>
                    <button
                      type="button"
                      onClick={() => setActiveItemSlotType("core")}
                      className="text-xs font-bold text-riot-accent hover:underline"
                    >
                      + Add Core Item
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 min-h-[38px] p-1.5 bg-riot-darkest rounded-xl border border-riot-border">
                    {formCore.length === 0 ? (
                      <span className="text-xs text-slate-500 pl-2">No core items added yet</span>
                    ) : (
                      formCore.map((id) => (
                        <div key={id} className="relative group">
                          <ItemTooltip itemId={id} size="md" />
                          <button
                            type="button"
                            onClick={() => removeItemFromSlot("core", id)}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Situational Items Row */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-amber-300 font-bold">Situational Counters (4th–6th Slot)</span>
                    <button
                      type="button"
                      onClick={() => setActiveItemSlotType("situational")}
                      className="text-xs font-bold text-riot-accent hover:underline"
                    >
                      + Add Situational Counter
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 min-h-[38px] p-1.5 bg-riot-darkest rounded-xl border border-riot-border">
                    {formSituational.length === 0 ? (
                      <span className="text-xs text-slate-500 pl-2">
                        No situational items added yet
                      </span>
                    ) : (
                      formSituational.map((id) => (
                        <div key={id} className="relative group">
                          <ItemTooltip itemId={id} size="md" />
                          <button
                            type="button"
                            onClick={() => removeItemFromSlot("situational", id)}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Boots and Starting Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 font-bold">Boots Option</span>
                      <button
                        type="button"
                        onClick={() => setActiveItemSlotType("boots")}
                        className="text-xs font-bold text-riot-accent hover:underline"
                      >
                        + Add Boots
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 min-h-[38px] p-1.5 bg-riot-darkest rounded-xl border border-riot-border">
                      {formBoots.map((id) => (
                        <div key={id} className="relative group">
                          <ItemTooltip itemId={id} size="md" />
                          <button
                            type="button"
                            onClick={() => removeItemFromSlot("boots", id)}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 font-bold">Starting Items</span>
                      <button
                        type="button"
                        onClick={() => setActiveItemSlotType("starting")}
                        className="text-xs font-bold text-riot-accent hover:underline"
                      >
                        + Add Starting
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 min-h-[38px] p-1.5 bg-riot-darkest rounded-xl border border-riot-border">
                      {formStarting.map((id) => (
                        <div key={id} className="relative group">
                          <ItemTooltip itemId={id} size="md" />
                          <button
                            type="button"
                            onClick={() => removeItemFromSlot("starting", id)}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Item Catalog Browser popup when slot is active */}
                {activeItemSlotType && (
                  <div className="p-3 bg-riot-darkest border border-riot-accent/40 rounded-xl space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">
                        Select item for:{" "}
                        <strong className="text-pink-300 uppercase">
                          {activeItemSlotType}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveItemSlotType(null)}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        Done Selecting
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                        placeholder="Search items (e.g. Infinity Edge, Mortal Reminder)..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-riot-surface border border-riot-border rounded-lg text-slate-200 focus:outline-none focus:border-riot-accent"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                      {filteredItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => addItemToSlot(item.id)}
                          className="cursor-pointer hover:scale-110 transition-transform"
                          title={`${item.name} (${item.gold?.total}g)`}
                        >
                          <ItemTooltip itemId={item.id} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Strategy & LLM Reasoning Textareas */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase">
                    Runes & Playstyle Notes
                  </label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. Lethal Tempo or Fleet Footwork. Take Cut Down against high HP frontlines..."
                    rows={2}
                    className="mt-1 w-full bg-riot-darkest border border-riot-border rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-riot-accent resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-riot-gold uppercase flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" />
                    AI Strategic Reasoning (For LLM Fine-Tuning & Prediction)
                  </label>
                  <textarea
                    value={formReasoning}
                    onChange={(e) => setFormReasoning(e.target.value)}
                    placeholder="e.g. When facing 2+ tanks stacking armor, rush Lord Dominik's Regards 2nd instead of Collector to prevent mid-game damage dropoff."
                    rows={2}
                    className="mt-1 w-full bg-riot-darkest border border-riot-border rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-riot-gold resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-riot-border/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBuild}
                disabled={!formTitle.trim()}
                className="px-5 py-2 rounded-xl bg-riot-accent text-white text-xs font-bold shadow-neon-pink disabled:opacity-50"
              >
                Save Build Scenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
