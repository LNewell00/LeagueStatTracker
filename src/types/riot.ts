export type RegionalRouting = "americas" | "asia" | "europe" | "esports";

export interface RegionOption {
  id: string;
  name: string;
  platform: string;
  routing: RegionalRouting;
}

export const SUPPORTED_REGIONS: RegionOption[] = [
  { id: "na", name: "North America (NA)", platform: "NA1", routing: "americas" },
  { id: "euw", name: "Europe West (EUW)", platform: "EUW1", routing: "europe" },
  { id: "eune", name: "Europe Nordic & East (EUNE)", platform: "EUN1", routing: "europe" },
  { id: "kr", name: "Korea (KR)", platform: "KR", routing: "asia" },
  { id: "br", name: "Brazil (BR)", platform: "BR1", routing: "americas" },
  { id: "las", name: "Latin America South (LAS)", platform: "LA2", routing: "americas" },
  { id: "lan", name: "Latin America North (LAN)", platform: "LA1", routing: "americas" },
  { id: "oce", name: "Oceania (OCE)", platform: "OC1", routing: "asia" },
  { id: "jp", name: "Japan (JP)", platform: "JP1", routing: "asia" },
  { id: "vn", name: "Vietnam (VN)", platform: "VN2", routing: "asia" },
  { id: "sg", name: "Singapore (SG)", platform: "SG2", routing: "asia" },
];

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface MatchParticipant {
  puuid: string;
  summonerName: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  championId: number;
  championName: string;
  champLevel: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  csPerMin: number;
  win: boolean;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number; // Trinket
  summoner1Id: number;
  summoner2Id: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  damageSelfMitigated: number;
  goldEarned: number;
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
  controlWardsPlaced: number;
  individualPosition: string;
  turretKills: number;
  teamId: number;
}

export interface MatchTeamStats {
  teamId: number;
  win: boolean;
  baronKills: number;
  dragonKills: number;
  towerKills: number;
  totalKills: number;
  totalGold: number;
}

export interface ParsedMatch {
  matchId: string;
  gameCreation: number;
  gameDuration: number; // in seconds
  gameMode: string;
  queueId: number;
  targetParticipant: MatchParticipant;
  allParticipants: MatchParticipant[];
  teams?: MatchTeamStats[];
}

export interface PlayerStatsSummary {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kdaRatio: number;
  avgCsPerMin: number;
  topChampions: {
    championName: string;
    games: number;
    winRate: number;
  }[];
}

