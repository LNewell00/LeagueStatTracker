import { PoolChampion, CustomBuildPlan, LlmTrainingExample } from "../types/builds";
import { getItemDataSync } from "./ddragon";

const POOL_STORAGE_KEY = "league_tracker_champion_pool";
const BUILDS_STORAGE_KEY = "league_tracker_custom_builds";

// Starter presets for champion pool
const DEFAULT_POOL: PoolChampion[] = [
  {
    championName: "Seraphine",
    role: "BOTTOM",
    tier: "S_TIER",
    notes: "Primary AP Carry Bot / Mid. Strong waveclear and huge teamfight ultimate.",
    addedAt: Date.now() - 3600000 * 24 * 7,
  },
  {
    championName: "Yuumi",
    role: "UTILITY",
    tier: "S_TIER",
    notes: "Best duo partner with hypercarry ADCs (Zeri, Twitch, Caitlyn). Untargetable enchanter.",
    addedAt: Date.now() - 3600000 * 24 * 6,
  },
  {
    championName: "Caitlyn",
    role: "BOTTOM",
    tier: "S_TIER",
    notes: "Main AD Carry. Long range poke, zone control with traps, early tower plate pressure.",
    addedAt: Date.now() - 3600000 * 24 * 5,
  },
];

// Starter custom builds tailored for specific team comp scenarios
const DEFAULT_BUILDS: CustomBuildPlan[] = [
  {
    id: "caitlyn-anti-tank",
    championName: "Caitlyn",
    title: "Anti-Tank & Armor Shred",
    role: "BOTTOM",
    enemyThreats: ["HEAVY_ARMOR", "HEAVY_CC"],
    allySynergies: ["ENCHANTER_PEEL"],
    startingItemIds: [1055, 2003], // Doran's Blade, Potion
    coreItemIds: [3031, 3036, 3094], // Infinity Edge, Lord Dominik's, Rapid Firecannon
    situationalItemIds: [3072, 3139, 3026], // Bloodthirster, Mercurial Scimitar, Guardian Angel
    bootItemIds: [3006], // Berserker's Greaves
    runesOrNotes: "Lethal Tempo or Fleet Footwork. Take Cut Down in Precision against high HP tanks.",
    llmReasoningPrompt:
      "When facing multiple heavy tanks stacking Armor & HP (e.g. Zac, K'Sante, Leona), rush Lord Dominik's Regards as 2nd or 3rd item instead of Collector. Maintain maximum range with Rapid Firecannon.",
    updatedAt: Date.now(),
  },
  {
    id: "seraphine-burn-poke",
    championName: "Seraphine",
    title: "Liandry's Teamfight Burn & Utility",
    role: "BOTTOM",
    enemyThreats: ["HEAVY_ARMOR", "HIGH_SHIELDS"],
    allySynergies: ["ENGAGE_DIVE"],
    startingItemIds: [1056, 2003], // Doran's Ring, Potion
    coreItemIds: [6653, 3003, 3157], // Liandry's Torment, Archangel's Staff, Zhonya's
    situationalItemIds: [3116, 3089, 3165], // Rylai's Crystal Scepter, Rabadon's, Morellonomicon
    bootItemIds: [3158], // Ionian Boots of Lucidity
    runesOrNotes: "Aery or Comet + Manaflow Band + Transcendence. Focus on maxing Q then E for wave control.",
    llmReasoningPrompt:
      "Against durable tanky frontlines, Liandry's Torment percentage health burn combined with Rylai's perma-slow turns Seraphine into an unkillable kite engine with her Echo E roots.",
    updatedAt: Date.now(),
  },
];

export function loadChampionPool(): PoolChampion[] {
  try {
    const raw = localStorage.getItem(POOL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("Failed to load champion pool from storage:", err);
  }
  return DEFAULT_POOL;
}

export function saveChampionPool(pool: PoolChampion[]): void {
  try {
    localStorage.setItem(POOL_STORAGE_KEY, JSON.stringify(pool));
  } catch (err) {
    console.error("Failed to save champion pool:", err);
  }
}

export function loadCustomBuilds(): CustomBuildPlan[] {
  try {
    const raw = localStorage.getItem(BUILDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("Failed to load custom builds from storage:", err);
  }
  return DEFAULT_BUILDS;
}

export function saveCustomBuilds(builds: CustomBuildPlan[]): void {
  try {
    localStorage.setItem(BUILDS_STORAGE_KEY, JSON.stringify(builds));
  } catch (err) {
    console.error("Failed to save custom builds:", err);
  }
}

/**
 * Converts custom build plans into an LLM training / prompt fine-tuning dataset
 */
export function exportLlmDataset(builds: CustomBuildPlan[]): string {
  const examples: LlmTrainingExample[] = builds.map((b) => {
    const getItemName = (id: number) => getItemDataSync(id)?.name || `Item #${id}`;

    return {
      champion: b.championName,
      role: b.role,
      enemy_threats: b.enemyThreats.map((t) => t.replace(/_/g, " ").toLowerCase()),
      ally_synergies: b.allySynergies.map((s) => s.replace(/_/g, " ").toLowerCase()),
      starting_items: b.startingItemIds.map(getItemName),
      core_build: b.coreItemIds.map(getItemName),
      situational_options: b.situationalItemIds.map(getItemName),
      boots: b.bootItemIds.map(getItemName),
      strategic_reasoning: b.llmReasoningPrompt || b.runesOrNotes,
    };
  });

  // Export as JSON Lines (JSONL) standard for LLM fine-tuning
  return examples.map((ex) => JSON.stringify(ex)).join("\n");
}

