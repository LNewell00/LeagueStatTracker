export interface LiveScores {
  assists: number;
  creepScore: number;
  deaths: number;
  kills: number;
  wardScore: number;
}

export interface LiveChampionStats {
  abilityHaste: number;
  abilityPower: number;
  armor: number;
  attackDamage: number;
  attackRange: number;
  attackSpeed: number;
  critChance: number;
  currentHealth: number;
  maxHealth: number;
  moveSpeed: number;
  magicResist: number;
  resourceValue: number;
  resourceMax: number;
}

export interface LiveActivePlayer {
  summonerName: string;
  riotId?: string;
  riotIdGameName?: string;
  riotIdTagLine?: string;
  championStats: LiveChampionStats;
  currentGold: number;
  level: number;
}

export interface LiveItem {
  canUse: boolean;
  consumable: boolean;
  count: number;
  displayName: string;
  itemID: number;
  price: number;
  rawDescription: string;
  slot: number;
}

export interface LivePlayerRunes {
  keystone?: {
    displayName: string;
    id?: number;
    rawDescription?: string;
  };
  primaryRuneTree?: {
    displayName: string;
    id?: number;
  };
  secondaryRuneTree?: {
    displayName: string;
    id?: number;
  };
  hasMagicalFootwear?: boolean;
  [key: string]: unknown;
}

export interface LivePlayer {
  championName: string;
  isBot: boolean;
  isDead: boolean;
  items: LiveItem[];
  level: number;
  position: string;
  respawnTimer: number;
  runes?: LivePlayerRunes | Record<string, unknown>;
  scores: LiveScores;
  skinID: number;
  summonerName: string;
  summonerSpells: {
    summonerSpellOne: { displayName: string; rawDescription: string };
    summonerSpellTwo: { displayName: string; rawDescription: string };
  };
  team: "ORDER" | "CHAOS";
}

export interface LiveGameData {
  activePlayer: LiveActivePlayer;
  allPlayers: LivePlayer[];
  events: {
    Events: Array<{
      EventID: number;
      EventName: string;
      EventTime: number;
      [key: string]: unknown;
    }>;
  };
  gameData: {
    gameMode: string;
    gameTime: number; // in seconds
    mapName: string;
    mapNumber: number;
    mapTerrain: string;
  };
}

export interface LivePollerState {
  isActive: boolean;
  isLoading: boolean;
  lastUpdated: number | null;
  data: LiveGameData | null;
  error: string | null;
}

