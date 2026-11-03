import { ParsedMatch, PlayerStatsSummary } from "../types/riot";
import { LiveGameData } from "../types/live";

export const MOCK_MATCHES: ParsedMatch[] = [
  {
    matchId: "NA1_5100234891",
    gameCreation: Date.now() - 1000 * 60 * 45, // 45 mins ago
    gameDuration: 1824, // 30m 24s
    gameMode: "CLASSIC",
    queueId: 420, // Ranked Solo
    targetParticipant: {
      puuid: "mock-puuid-1",
      summonerName: "Faker",
      riotIdGameName: "Faker",
      riotIdTagline: "KR1",
      championId: 103,
      championName: "Ahri",
      champLevel: 16,
      kills: 12,
      deaths: 2,
      assists: 9,
      kda: 10.5,
      cs: 248,
      csPerMin: 8.2,
      win: true,
      item0: 6655, // Luden's Companion
      item1: 3089, // Rabadon's Deathcap
      item2: 3157, // Zhonya's Hourglass
      item3: 4645, // Shadowflame
      item4: 3020, // Sorcerer's Shoes
      item5: 1056, // Doran's Ring
      item6: 3364, // Oracle Lens
      summoner1Id: 4, // Flash
      summoner2Id: 14, // Ignite
      totalDamageDealtToChampions: 31450,
      goldEarned: 15400,
      visionScore: 28,
      teamId: 100,
    },
    allParticipants: [],
  },
  {
    matchId: "NA1_5100192842",
    gameCreation: Date.now() - 1000 * 60 * 130, // ~2 hours ago
    gameDuration: 1580, // 26m 20s
    gameMode: "CLASSIC",
    queueId: 420,
    targetParticipant: {
      puuid: "mock-puuid-1",
      summonerName: "Faker",
      riotIdGameName: "Faker",
      riotIdTagline: "KR1",
      championId: 222,
      championName: "Jinx",
      champLevel: 14,
      kills: 4,
      deaths: 7,
      assists: 3,
      kda: 1.0,
      cs: 210,
      csPerMin: 7.9,
      win: false,
      item0: 3031, // Infinity Edge
      item1: 3085, // Runaan's Hurricane
      item2: 3006, // Berserker's Greaves
      item3: 1055, // Doran's Blade
      item4: 1037, // Pickaxe
      item5: 0,
      item6: 3363, // Farsight Alteration
      summoner1Id: 4,
      summoner2Id: 7, // Heal
      totalDamageDealtToChampions: 18400,
      goldEarned: 10800,
      visionScore: 14,
      teamId: 100,
    },
    allParticipants: [],
  },
  {
    matchId: "NA1_5099849201",
    gameCreation: Date.now() - 1000 * 60 * 260, // ~4 hours ago
    gameDuration: 2110, // 35m 10s
    gameMode: "CLASSIC",
    queueId: 420,
    targetParticipant: {
      puuid: "mock-puuid-1",
      summonerName: "Faker",
      riotIdGameName: "Faker",
      riotIdTagline: "KR1",
      championId: 64,
      championName: "LeeSin",
      champLevel: 17,
      kills: 9,
      deaths: 3,
      assists: 14,
      kda: 7.67,
      cs: 185,
      csPerMin: 5.3,
      win: true,
      item0: 3078, // Trinity Force
      item1: 3053, // Sterak's Gage
      item2: 3071, // Black Cleaver
      item3: 3111, // Mercury's Treads
      item4: 3748, // Titanic Hydra
      item5: 2420, // Stopwatch
      item6: 3364,
      summoner1Id: 4,
      summoner2Id: 11, // Smite
      totalDamageDealtToChampions: 27800,
      goldEarned: 14900,
      visionScore: 42,
      teamId: 200,
    },
    allParticipants: [],
  },
  {
    matchId: "NA1_5099318921",
    gameCreation: Date.now() - 1000 * 60 * 600, // 10 hours ago
    gameDuration: 1320, // 22m
    gameMode: "CLASSIC",
    queueId: 420,
    targetParticipant: {
      puuid: "mock-puuid-1",
      summonerName: "Faker",
      riotIdGameName: "Faker",
      riotIdTagline: "KR1",
      championId: 266,
      championName: "Aatrox",
      champLevel: 13,
      kills: 8,
      deaths: 1,
      assists: 5,
      kda: 13.0,
      cs: 198,
      csPerMin: 9.0,
      win: true,
      item0: 3142, // Youmuu's
      item1: 3071, // Black Cleaver
      item2: 3158, // Ionian Boots
      item3: 3156, // Maw of Malmortius
      item4: 1054, // Doran's Shield
      item5: 0,
      item6: 3340,
      summoner1Id: 4,
      summoner2Id: 12, // Teleport
      totalDamageDealtToChampions: 23600,
      goldEarned: 12400,
      visionScore: 19,
      teamId: 100,
    },
    allParticipants: [],
  },
  {
    matchId: "NA1_5098912384",
    gameCreation: Date.now() - 1000 * 60 * 1440, // 1 day ago
    gameDuration: 1950, // 32m 30s
    gameMode: "CLASSIC",
    queueId: 420,
    targetParticipant: {
      puuid: "mock-puuid-1",
      summonerName: "Faker",
      riotIdGameName: "Faker",
      riotIdTagline: "KR1",
      championId: 412,
      championName: "Thresh",
      champLevel: 14,
      kills: 2,
      deaths: 6,
      assists: 18,
      kda: 3.33,
      cs: 45,
      csPerMin: 1.4,
      win: false,
      item0: 3869, // Celestial Opposition
      item1: 3109, // Knight's Vow
      item2: 3190, // Locket of the Iron Solari
      item3: 3117, // Boots of Mobility
      item4: 3024, // Glacial Shroud
      item5: 2055, // Control Ward
      item6: 3364,
      summoner1Id: 4,
      summoner2Id: 14,
      totalDamageDealtToChampions: 9800,
      goldEarned: 8900,
      visionScore: 68,
      teamId: 200,
    },
    allParticipants: [],
  },
];

export const MOCK_SUMMARY: PlayerStatsSummary = {
  totalGames: 5,
  wins: 3,
  losses: 2,
  winRate: 60,
  avgKills: 7.0,
  avgDeaths: 3.8,
  avgAssists: 9.8,
  kdaRatio: 4.42,
  avgCsPerMin: 6.36,
  topChampions: [
    { championName: "Ahri", games: 1, winRate: 100 },
    { championName: "Aatrox", games: 1, winRate: 100 },
    { championName: "LeeSin", games: 1, winRate: 100 },
    { championName: "Jinx", games: 1, winRate: 0 },
    { championName: "Thresh", games: 1, winRate: 0 },
  ],
};

export const MOCK_LIVE_GAME: LiveGameData = {
  activePlayer: {
    summonerName: "Faker",
    level: 11,
    currentGold: 1450,
    championStats: {
      abilityHaste: 25,
      abilityPower: 140,
      armor: 56,
      attackDamage: 82,
      attackRange: 550,
      attackSpeed: 0.82,
      critChance: 0,
      currentHealth: 1180,
      maxHealth: 1420,
      magicResist: 42,
      moveSpeed: 380,
      resourceValue: 620,
      resourceMax: 950,
    },
  },
  allPlayers: [
    {
      championName: "Ahri",
      isBot: false,
      isDead: false,
      items: [
        {
          canUse: true,
          consumable: false,
          count: 1,
          displayName: "Lost Chapter",
          itemID: 3802,
          price: 1200,
          rawDescription: "",
          slot: 0,
        },
        {
          canUse: true,
          consumable: false,
          count: 1,
          displayName: "Sorcerer's Shoes",
          itemID: 3020,
          price: 1100,
          rawDescription: "",
          slot: 1,
        },
      ],
      level: 11,
      position: "MIDDLE",
      respawnTimer: 0,
      runes: {},
      scores: {
        kills: 4,
        deaths: 1,
        assists: 3,
        creepScore: 118,
        wardScore: 12,
      },
      skinID: 0,
      summonerName: "Faker",
      summonerSpells: {
        summonerSpellOne: { displayName: "Flash", rawDescription: "" },
        summonerSpellTwo: { displayName: "Ignite", rawDescription: "" },
      },
      team: "ORDER",
    },
  ],
  events: {
    Events: [
      { EventID: 1, EventName: "GameStart", EventTime: 0 },
      { EventID: 2, EventName: "FirstBlood", EventTime: 185 },
      { EventID: 3, EventName: "DragonKill", EventTime: 420 },
    ],
  },
  gameData: {
    gameMode: "CLASSIC",
    gameTime: 874, // 14m 34s
    mapName: "Summoner's Rift",
    mapNumber: 11,
    mapTerrain: "Default",
  },
};

