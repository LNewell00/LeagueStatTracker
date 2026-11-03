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
  HEAVY_ARMOR: { label: "Armor Tanks", color: "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10" },
  HEAVY_MAGIC: { label: "Magic Burst", color: "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10" },
  HIGH_HEALING: { label: "Sustain / Healing", color: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  ASSASSIN_DIVE: { label: "Assassins / Dive", color: "text-riot-red border-riot-red/30 bg-riot-red/10" },
  HIGH_SHIELDS: { label: "Heavy Shields", color: "text-purple-600 dark:text-purple-400 border-purple-500/30 bg-purple-500/10" },
  HEAVY_CC: { label: "Lockdown CC", color: "text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/10" },
  STANDARD_BALANCED: { label: "Standard Balanced", color: "text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800" },
};

const ALLY_SYNERGY_LABELS: Record<AllySynergyArchetype, { label: string; color: string }> = {
  ENGAGE_DIVE: { label: "Engage Frontline", color: "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10" },
  ENCHANTER_PEEL: { label: "Enchanter Peel", color: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  POKE_SIEGE: { label: "Long Range Poke", color: "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10" },
  HYPERCARRY_COMP: { label: "Protect Carry", color: "text-purple-600 dark:text-purple-400 border-purple-500/30 bg-purple-500/10" },
};

export const ItemBuildPlannerTab: React.FC<ItemBuildPlannerTabProps> = ({
  initialChampion,
}) => {
  const [builds, setBuilds] = useState<CustomBuildPlan[]>(loadCustomBuilds);
  const pool = useMemo(() => loadChampionPool(), []);

  const [selectedChamp, setSelectedChamp] = useState<string>(() => {
    if (initialChampion) return initialChampion;
    if (pool.length > 0) return pool[0].championName;
    return "Caitlyn";
  });

  const [allItemsList, setAllItemsList] = useState<ItemInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedDataset, setCopiedDataset] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formRole, setFormRole] = useState<ChampionRole>("BOTTOM");
  const [formThreats, setFormThreats] = useState<EnemyThreatArchetype[]>(["HEAVY_ARMOR"]);
  const [formSynergies, setFormSynergies] = useState<AllySynergyArchetype[]>([]);
  const [formStarting, setFormStarting] = useState<number[]>([]);
  const [formCore, setFormCore] = useState<number[]>([]);
  const [formSituational, setFormSituational] = useState<number[]>([]);
  const [formBoots, setFormBoots] = useState<number[]>([]);
  const [formNotes, setFormNotes] = useState("");
  const [formReasoning, setFormReasoning] = useState("");

  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [activeSlotPicker, setActiveSlotPicker] = useState<
    "starting" | "core" | "situational" | "boots" | null
  >(null);

  useEffect(() => {
    fetchAllItems().then((itemsMap) => {
      setAllItemsList(Object.values(itemsMap));
    });
  }, []);

  const currentChampBuilds = useMemo(() => {
    return builds.filter(
      (b) => b.championName.toLowerCase() === selectedChamp.toLowerCase()
    );
  }, [builds, selectedChamp]);

  const saveAndSetBuilds = (newBuilds: CustomBuildPlan[]) => {
    setBuilds(newBuilds);
    saveCustomBuilds(newBuilds);
  };

  const handleDeleteBuild = (id: string) => {
    const updated = builds.filter((b) => b.id !== id);
    saveAndSetBuilds(updated);
  };

  const handleCopyDataset = () => {
    const jsonl = exportLlmDataset(builds);
    navigator.clipboard.writeText(jsonl);
    setCopiedDataset(true);
    setTimeout(() => setCopiedDataset(false), 2000);
  };

  const handleDownloadDataset = () => {
    const jsonl = exportLlmDataset(builds);
    const blob = new Blob([jsonl], { type: "application/x-jsonlines" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `league_build_dataset_${Date.now()}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormTitle("");
    setFormRole("BOTTOM");
    setFormThreats(["HEAVY_ARMOR"]);
    setFormSynergies([]);
    setFormStarting([]);
    setFormCore([]);
    setFormSituational([]);
    setFormBoots([]);
    setFormNotes("");
    setFormReasoning("");
  };

  const handleSaveBuild = () => {
    if (!formTitle.trim()) return;

    const newBuild: CustomBuildPlan = {
      id: `build_${Date.now()}`,
      championName: selectedChamp,
      role: formRole,
      title: formTitle.trim(),
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

  const toggleThreat = (t: EnemyThreatArchetype) => {
    setFormThreats((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const toggleSynergy = (s: AllySynergyArchetype) => {
    setFormSynergies((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const addItemToSlot = (id: number) => {
    if (!activeSlotPicker) return;
    if (activeSlotPicker === "starting") setFormStarting((prev) => [...prev, id]);
    if (activeSlotPicker === "core") setFormCore((prev) => [...prev, id]);
    if (activeSlotPicker === "situational") setFormSituational((prev) => [...prev, id]);
    if (activeSlotPicker === "boots") setFormBoots((prev) => [...prev, id]);
    setActiveSlotPicker(null);
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
    <div className="space-y-4 animate-in fade-in font-mono">
      {/* Top Banner & Exporter */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-riot-red" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              Situational Build Matrix
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">
            Configure counter itemization matrices by enemy threat profile and team composition.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyDataset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-riot-red text-xs font-semibold transition-all cursor-pointer"
            title="Copy JSONL dataset"
          >
            {copiedDataset ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedDataset ? "Copied" : "Copy JSONL"}</span>
          </button>

          <button
            onClick={handleDownloadDataset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-riot-red text-xs font-semibold transition-all cursor-pointer"
            title="Export JSONL file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-riot-red text-white text-xs font-bold hover:bg-riot-redHover active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Build</span>
          </button>
        </div>
      </div>

      {/* Champion Tabs Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
        {pool.map((c) => {
          const isSelected = selectedChamp.toLowerCase() === c.championName.toLowerCase();
          const count = builds.filter(
            (b) => b.championName.toLowerCase() === c.championName.toLowerCase()
          ).length;

          return (
            <button
              key={`${c.championName}-${c.role}`}
              onClick={() => setSelectedChamp(c.championName)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border transition-all shrink-0 cursor-pointer text-xs ${
                isSelected
                  ? "bg-riot-red text-white border-riot-red font-bold"
                  : "bg-white dark:bg-[#0c0e14] border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
              }`}
            >
              <div className="w-5 h-5 rounded-none overflow-hidden shrink-0">
                <img
                  src={getChampionIconUrl(c.championName)}
                  alt={c.championName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <span className="leading-tight">{c.championName}</span>
                <span className="text-[10px] opacity-75 ml-1 font-mono">
                  ({count})
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Build Plans for Selected Champion */}
      {currentChampBuilds.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-sm bg-white dark:bg-[#0c0e14] p-6 space-y-2">
          <Bot className="w-8 h-8 text-neutral-400 mx-auto" />
          <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
            No situational scenarios configured for {selectedChamp}
          </h3>
          <p className="text-[11px] text-neutral-400 max-w-md mx-auto">
            Build situational loadouts based on enemy team composition (e.g. Tank Busters, Magic Resist, Healing Cut).
          </p>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-riot-red text-white text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {currentChampBuilds.map((b) => (
            <div
              key={b.id}
              className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded p-3.5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Build Header */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-900 shrink-0">
                      <img
                        src={getChampionIconUrl(b.championName)}
                        alt={b.championName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{b.title}</h3>
                      <span className="text-[10px] text-neutral-400">
                        {b.championName} • {b.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteBuild(b.id)}
                    className="p-1 rounded-sm text-neutral-400 hover:text-riot-red hover:bg-riot-red/10 transition-colors"
                    title="Delete Build"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Archetype Tags */}
                <div className="space-y-1 text-[10px]">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-bold uppercase text-neutral-400 w-14">Enemy:</span>
                    {b.enemyThreats.map((threat) => {
                      const meta = ENEMY_THREAT_LABELS[threat];
                      return (
                        <span
                          key={threat}
                          className={`font-bold px-1.5 py-0.2 rounded-sm border ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      );
                    })}
                  </div>

                  {b.allySynergies.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="font-bold uppercase text-neutral-400 w-14">Ally:</span>
                      {b.allySynergies.map((syn) => {
                        const meta = ALLY_SYNERGY_LABELS[syn];
                        return (
                          <span
                            key={syn}
                            className={`font-bold px-1.5 py-0.2 rounded-sm border ${meta.color}`}
                          >
                            {meta.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Items Sections */}
                <div className="space-y-2 pt-1">
                  {/* Core Spikes */}
                  <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">
                      Core Spikes
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {b.coreItemIds.map((id) => (
                        <ItemTooltip key={id} itemId={id} size="sm" />
                      ))}
                      {b.bootItemIds.map((id) => (
                        <div key={id} className="ml-1">
                          <ItemTooltip itemId={id} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Situational Counters */}
                  {b.situationalItemIds.length > 0 && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-amber-500 tracking-wider">
                        Situational Counters
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {b.situationalItemIds.map((id) => (
                          <ItemTooltip key={id} itemId={id} size="sm" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Starting Items */}
                  {b.startingItemIds.length > 0 && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">
                        Starters
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {b.startingItemIds.map((id) => (
                          <ItemTooltip key={id} itemId={id} size="xs" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tactical Notes */}
                {(b.llmReasoningPrompt || b.runesOrNotes) && (
                  <div className="bg-neutral-50 dark:bg-[#12151f] border border-neutral-200 dark:border-neutral-800 rounded-sm p-2 text-[11px] space-y-1 leading-relaxed">
                    {b.runesOrNotes && (
                      <div className="text-neutral-700 dark:text-neutral-300">
                        <strong className="text-neutral-900 dark:text-neutral-100 font-bold">Notes:</strong> {b.runesOrNotes}
                      </div>
                    )}
                    {b.llmReasoningPrompt && (
                      <div className="text-neutral-500 dark:text-neutral-400">
                        <strong className="text-amber-500 font-bold">Tactics:</strong> {b.llmReasoningPrompt}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="text-[9px] text-neutral-400 pt-1.5 border-t border-neutral-200 dark:border-neutral-800">
                Updated {new Date(b.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Custom Build Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0e1118] border border-neutral-300 dark:border-neutral-700 w-full max-w-2xl max-h-[90vh] rounded p-5 shadow-xl flex flex-col space-y-3 overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <span className="font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                Create Scenario ({selectedChamp})
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 custom-scrollbar flex-1">
              {/* Build Title & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">
                    Scenario Title
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Anti-Tank Shred, Magic Resist Shielding..."
                    className="mt-1 w-full bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-riot-red"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">
                    Role Position
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as ChampionRole)}
                    className="mt-1 w-full bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1.5 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-riot-red"
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
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-500" />
                  Enemy Matchup Threats:
                </label>
                <div className="flex flex-wrap gap-1">
                  {(Object.keys(ENEMY_THREAT_LABELS) as EnemyThreatArchetype[]).map((t) => {
                    const isSelected = formThreats.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleThreat(t)}
                        className={`text-[10px] px-2 py-0.5 rounded-sm border font-semibold transition-all ${
                          isSelected
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-300 dark:border-neutral-700"
                        }`}
                      >
                        {ENEMY_THREAT_LABELS[t].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ally Synergies Tags */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                  <HeartHandshake className="w-3 h-3 text-blue-500" />
                  Ally Composition Synergy:
                </label>
                <div className="flex flex-wrap gap-1">
                  {(Object.keys(ALLY_SYNERGY_LABELS) as AllySynergyArchetype[]).map((s) => {
                    const isSelected = formSynergies.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSynergy(s)}
                        className={`text-[10px] px-2 py-0.5 rounded-sm border font-semibold transition-all ${
                          isSelected
                            ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-300 dark:border-neutral-700"
                        }`}
                      >
                        {ALLY_SYNERGY_LABELS[s].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Item Slots Config */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Core Items */}
                <div className="p-2.5 rounded-sm bg-neutral-50 dark:bg-[#12151f] border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-neutral-500">Core Spikes</span>
                    <button
                      type="button"
                      onClick={() => setActiveSlotPicker("core")}
                      className="text-[10px] text-riot-red font-bold hover:underline"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 min-h-[30px]">
                    {formCore.map((id) => (
                      <div key={id} className="relative group">
                        <ItemTooltip itemId={id} size="sm" />
                        <button
                          type="button"
                          onClick={() => removeItemFromSlot("core", id)}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-riot-red text-white rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Boots */}
                <div className="p-2.5 rounded-sm bg-neutral-50 dark:bg-[#12151f] border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-neutral-500">Boots</span>
                    <button
                      type="button"
                      onClick={() => setActiveSlotPicker("boots")}
                      className="text-[10px] text-riot-red font-bold hover:underline"
                    >
                      + Add Boots
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 min-h-[30px]">
                    {formBoots.map((id) => (
                      <div key={id} className="relative group">
                        <ItemTooltip itemId={id} size="sm" />
                        <button
                          type="button"
                          onClick={() => removeItemFromSlot("boots", id)}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-riot-red text-white rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Situational Items */}
                <div className="p-2.5 rounded-sm bg-neutral-50 dark:bg-[#12151f] border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-neutral-500">Situational</span>
                    <button
                      type="button"
                      onClick={() => setActiveSlotPicker("situational")}
                      className="text-[10px] text-riot-red font-bold hover:underline"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 min-h-[30px]">
                    {formSituational.map((id) => (
                      <div key={id} className="relative group">
                        <ItemTooltip itemId={id} size="sm" />
                        <button
                          type="button"
                          onClick={() => removeItemFromSlot("situational", id)}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-riot-red text-white rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Starters */}
                <div className="p-2.5 rounded-sm bg-neutral-50 dark:bg-[#12151f] border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-neutral-500">Starters</span>
                    <button
                      type="button"
                      onClick={() => setActiveSlotPicker("starting")}
                      className="text-[10px] text-riot-red font-bold hover:underline"
                    >
                      + Add Starter
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 min-h-[30px]">
                    {formStarting.map((id) => (
                      <div key={id} className="relative group">
                        <ItemTooltip itemId={id} size="sm" />
                        <button
                          type="button"
                          onClick={() => removeItemFromSlot("starting", id)}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-riot-red text-white rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Item Picker Popup if active */}
              {activeSlotPicker && (
                <div className="p-2.5 rounded-sm border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-[#151924] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-neutral-700 dark:text-neutral-300">
                      Select Item for {activeSlotPicker}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSlotPicker(null)}
                      className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      placeholder="Search items..."
                      className="w-full pl-8 pr-3 py-1 text-xs bg-white dark:bg-[#0c0e14] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-riot-red"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto custom-scrollbar pt-1">
                    {filteredItems.map((it) => (
                      <div
                        key={it.id}
                        onClick={() => addItemToSlot(it.id)}
                        className="cursor-pointer hover:scale-105 transition-transform"
                      >
                        <ItemTooltip itemId={it.id} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">
                    Playstyle & Runes
                  </label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. Lethal Tempo or Fleet Footwork..."
                    rows={2}
                    className="mt-1 w-full bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded p-2 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-riot-red resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                    <Bot className="w-3 h-3 text-amber-500" />
                    Tactical Reasoning
                  </label>
                  <textarea
                    value={formReasoning}
                    onChange={(e) => setFormReasoning(e.target.value)}
                    placeholder="e.g. When facing heavy tanks, prioritize Lord Dominik's Regards 2nd."
                    rows={2}
                    className="mt-1 w-full bg-neutral-100 dark:bg-[#141721] border border-neutral-300 dark:border-neutral-700 rounded p-2 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-riot-red resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 rounded-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBuild}
                disabled={!formTitle.trim()}
                className="px-4 py-1.5 rounded bg-riot-red text-white font-bold hover:bg-riot-redHover disabled:opacity-50"
              >
                Save Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
