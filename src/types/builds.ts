export type ChampionRole = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";
export type PoolTier = "S_TIER" | "A_TIER" | "COUNTER" | "LEARNING";

export interface PoolChampion {
  championName: string;
  role: ChampionRole;
  tier: PoolTier;
  notes: string;
  addedAt: number;
}

export type EnemyThreatArchetype =
  | "HEAVY_ARMOR"
  | "HEAVY_MAGIC"
  | "HIGH_HEALING"
  | "ASSASSIN_DIVE"
  | "HIGH_SHIELDS"
  | "HEAVY_CC"
  | "STANDARD_BALANCED";

export type AllySynergyArchetype =
  | "ENGAGE_DIVE"
  | "ENCHANTER_PEEL"
  | "POKE_SIEGE"
  | "HYPERCARRY_COMP";

export interface CustomBuildPlan {
  id: string;
  championName: string;
  title: string;
  role: ChampionRole;
  enemyThreats: EnemyThreatArchetype[];
  allySynergies: AllySynergyArchetype[];
  startingItemIds: number[];
  coreItemIds: number[];
  situationalItemIds: number[];
  bootItemIds: number[];
  runesOrNotes: string;
  llmReasoningPrompt: string;
  updatedAt: number;
}

export interface LlmTrainingExample {
  champion: string;
  role: string;
  enemy_threats: string[];
  ally_synergies: string[];
  starting_items: string[];
  core_build: string[];
  situational_options: string[];
  boots: string[];
  strategic_reasoning: string;
}

