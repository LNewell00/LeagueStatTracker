import {
  ParsedMatch,
  MatchParticipant,
  PlayerStatsSummary,
  RiotAccount,
  SUPPORTED_REGIONS,
  RegionalRouting,
  RankedEntry,
  MmrDataPoint,
} from "../types/riot";
import {
  ParsedTimeline,
  SkillSlot,
  SkillLevelUpEvent,
  KillMapEvent,
  MinuteLeadFrame,
} from "../types/timeline";
import { isTauriEnvironment } from "./storage";

export function getRegionalRouting(regionId: string): RegionalRouting {
  const match = SUPPORTED_REGIONS.find((r) => r.id.toLowerCase() === regionId.toLowerCase());
  return match ? match.routing : "americas";
}

export function getPlatformId(regionId: string): string {
  const match = SUPPORTED_REGIONS.find((r) => r.id.toLowerCase() === regionId.toLowerCase());
  return match ? match.platform : "NA1";
}

export async function fetchLeagueEntries(
  puuid: string,
  platformId: string,
  apiKey: string
): Promise<RankedEntry[]> {
  if (isTauriEnvironment()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<RankedEntry[]>("get_league_entries", {
      puuid,
      platformRouting: platformId,
      apiKey,
    });
  }

  try {
    const url = `https://${platformId.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
    const res = await fetch(url, { headers: { "X-Riot-Token": apiKey } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchRiotAccount(
  gameName: string,
  tagLine: string,
  regionalRouting: string,
  apiKey: string
): Promise<RiotAccount> {
  if (isTauriEnvironment()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<RiotAccount>("get_riot_account", {
      gameName,
      tagLine,
      regionalRouting,
      apiKey,
    });
  }

  // Direct fetch fallback (Note: Browser requests might encounter CORS if not in desktop mode)
  const url = `https://${regionalRouting}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
    gameName
  )}/${encodeURIComponent(tagLine)}`;

  const res = await fetch(url, {
    headers: { "X-Riot-Token": apiKey },
  });

  if (!res.ok) {
    throw new Error(`Riot API error (${res.status}): ${await res.text()}`);
  }

  return await res.json();
}

export async function fetchMatchIds(
  puuid: string,
  regionalRouting: string,
  count: number = 20,
  apiKey: string,
  start: number = 0
): Promise<string[]> {
  if (isTauriEnvironment()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string[]>("get_match_ids", {
      puuid,
      regionalRouting,
      count,
      start,
      apiKey,
    });
  }

  const url = `https://${regionalRouting}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`;
  const res = await fetch(url, {
    headers: { "X-Riot-Token": apiKey },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch match IDs: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function fetchMatchDetail(
  matchId: string,
  regionalRouting: string,
  apiKey: string
): Promise<any> {
  if (isTauriEnvironment()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<any>("get_match_detail", {
      matchId,
      regionalRouting,
      apiKey,
    });
  }

  const url = `https://${regionalRouting}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    const res = await fetch(url, {
      headers: { "X-Riot-Token": apiKey },
    });

    if (res.status === 429) {
      // Respect Riot rate limit Retry-After header
      const retryAfter = Number(res.headers.get("Retry-After") || 2);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch match ${matchId}: HTTP ${res.status}`);
    }

    return await res.json();
  }
}

/**
 * Executes async tasks in paced chunks to comfortably adhere to Riot's rate limit:
 * - 20 requests every 1 second
 * - 100 requests every 2 minutes
 */
export async function batchFetchMatches<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  chunkSize: number = 5,
  delayMs: number = 80,
  onProgress?: (completed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map((item) => fn(item)));
    results.push(...chunkResults);
    if (onProgress) {
      onProgress(results.length, items.length);
    }
    if (i + chunkSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return results;
}

export function parseRawMatch(raw: any, targetPuuid: string): ParsedMatch | null {
  try {
    const info = raw.info;
    const metadata = raw.metadata;
    if (!info || !info.participants) return null;

    const gameDurationMinutes = (info.gameDuration || 1) / 60;

    const allParticipants: MatchParticipant[] = info.participants.map((p: any) => {
      const cs = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
      const deaths = p.deaths === 0 ? 1 : p.deaths;
      const kda = Number(((p.kills + p.assists) / deaths).toFixed(2));
      const csPerMin = Number((cs / gameDurationMinutes).toFixed(1));

      return {
        puuid: p.puuid,
        summonerName: p.summonerName || p.riotIdGameName || "Summoner",
        riotIdGameName: p.riotIdGameName,
        riotIdTagline: p.riotIdTagline,
        championId: p.championId,
        championName: p.championName,
        champLevel: p.champLevel,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        kda,
        cs,
        csPerMin,
        win: !!p.win,
        item0: p.item0,
        item1: p.item1,
        item2: p.item2,
        item3: p.item3,
        item4: p.item4,
        item5: p.item5,
        item6: p.item6,
        summoner1Id: p.summoner1Id,
        summoner2Id: p.summoner2Id,
        totalDamageDealtToChampions: p.totalDamageDealtToChampions || 0,
        totalDamageTaken: p.totalDamageTaken || 0,
        damageSelfMitigated: p.damageSelfMitigated || 0,
        goldEarned: p.goldEarned || 0,
        visionScore: p.visionScore || 0,
        wardsPlaced: p.wardsPlaced || 0,
        wardsKilled: p.wardsKilled || 0,
        controlWardsPlaced: p.visionWardsBoughtInGame || p.detectorWardsPlaced || 0,
        individualPosition: p.individualPosition || p.teamPosition || "",
        turretKills: p.turretKills || 0,
        teamId: p.teamId,
        // Extended metrics
        physicalDamageDealtToChampions: p.physicalDamageDealtToChampions || 0,
        magicDamageDealtToChampions: p.magicDamageDealtToChampions || 0,
        trueDamageDealtToChampions: p.trueDamageDealtToChampions || 0,
        damageDealtToObjectives: p.damageDealtToObjectives || 0,
        damageDealtToTurrets: p.damageDealtToTurrets || 0,
        totalHealsOnTeammates: p.totalHealsOnTeammates || 0,
        totalDamageShieldedOnTeammates: p.totalDamageShieldedOnTeammates || 0,
        timeCCingOthers: p.timeCCingOthers || 0,
        doubleKills: p.doubleKills || 0,
        tripleKills: p.tripleKills || 0,
        quadraKills: p.quadraKills || 0,
        pentaKills: p.pentaKills || 0,
        firstBloodKill: !!p.firstBloodKill,
        firstBloodAssist: !!p.firstBloodAssist,
      };
    });

    const target = allParticipants.find((p) => p.puuid === targetPuuid) || allParticipants[0];

    // Compute team stats from info.teams or participants
    const teams = (info.teams || []).map((t: any) => {
      const teamPlayers = allParticipants.filter((p) => p.teamId === t.teamId);
      const totalKills = teamPlayers.reduce((acc, p) => acc + p.kills, 0);
      const totalGold = teamPlayers.reduce((acc, p) => acc + p.goldEarned, 0);
      return {
        teamId: t.teamId,
        win: !!t.win,
        baronKills: t.objectives?.baron?.kills || 0,
        dragonKills: t.objectives?.dragon?.kills || 0,
        towerKills: t.objectives?.tower?.kills || 0,
        totalKills,
        totalGold,
      };
    });

    return {
      matchId: metadata.matchId,
      gameCreation: info.gameCreation,
      gameDuration: info.gameDuration,
      gameMode: info.gameMode,
      queueId: info.queueId,
      targetParticipant: target,
      allParticipants,
      teams,
    };
  } catch (err) {
    console.error("Error parsing match data:", err);
    return null;
  }
}

export function computeSummaryStats(matches: ParsedMatch[]): PlayerStatsSummary {
  if (matches.length === 0) {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgKills: 0,
      avgDeaths: 0,
      avgAssists: 0,
      kdaRatio: 0,
      avgCsPerMin: 0,
      topChampions: [],
    };
  }

  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalCsPerMin = 0;
  let wins = 0;

  const champMap: Record<string, { games: number; wins: number }> = {};

  matches.forEach((m) => {
    const p = m.targetParticipant;
    totalKills += p.kills;
    totalDeaths += p.deaths;
    totalAssists += p.assists;
    totalCsPerMin += p.csPerMin;
    if (p.win) wins++;

    const c = p.championName;
    if (!champMap[c]) {
      champMap[c] = { games: 0, wins: 0 };
    }
    champMap[c].games++;
    if (p.win) champMap[c].wins++;
  });

  const total = matches.length;
  const losses = total - wins;
  const winRate = Math.round((wins / total) * 100);
  const avgDeaths = Number((totalDeaths / total).toFixed(1));
  const kdaRatio = Number(
    ((totalKills + totalAssists) / Math.max(1, totalDeaths)).toFixed(2)
  );

  const topChampions = Object.entries(champMap)
    .map(([championName, stat]) => ({
      championName,
      games: stat.games,
      winRate: Math.round((stat.wins / stat.games) * 100),
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 5);

  return {
    totalGames: total,
    wins,
    losses,
    winRate,
    avgKills: Number((totalKills / total).toFixed(1)),
    avgDeaths,
    avgAssists: Number((totalAssists / total).toFixed(1)),
    kdaRatio,
    avgCsPerMin: Number((totalCsPerMin / total).toFixed(1)),
    topChampions,
  };
}

const TIER_BASE_MMR: Record<string, number> = {
  IRON: 400,
  BRONZE: 800,
  SILVER: 1200,
  GOLD: 1600,
  PLATINUM: 2000,
  EMERALD: 2400,
  DIAMOND: 2800,
  MASTER: 3200,
  GRANDMASTER: 3600,
  CHALLENGER: 4000,
};

const DIVISION_OFFSET: Record<string, number> = {
  IV: 0,
  III: 100,
  II: 200,
  I: 300,
};

export function mmrToTierAndRank(mmr: number): { tier: string; rank: string; lp: number } {
  if (mmr >= 4000) return { tier: "CHALLENGER", rank: "I", lp: mmr - 4000 };
  if (mmr >= 3600) return { tier: "GRANDMASTER", rank: "I", lp: mmr - 3600 };
  if (mmr >= 3200) return { tier: "MASTER", rank: "I", lp: mmr - 3200 };

  const tiers = ["DIAMOND", "EMERALD", "PLATINUM", "GOLD", "SILVER", "BRONZE", "IRON"];
  for (const t of tiers) {
    const base = TIER_BASE_MMR[t];
    if (mmr >= base) {
      const diff = mmr - base;
      const divIdx = Math.min(3, Math.floor(diff / 100));
      const divs = ["IV", "III", "II", "I"];
      const rank = divs[divIdx];
      const lp = diff % 100;
      return { tier: t, rank, lp };
    }
  }

  return { tier: "IRON", rank: "IV", lp: Math.max(0, mmr) };
}

export function calculateMmrProgression(
  matches: ParsedMatch[],
  currentRank?: RankedEntry
): MmrDataPoint[] {
  if (matches.length === 0) return [];

  // Sort matches chronologically (oldest to newest) to plot progress forward
  const sorted = [...matches].sort((a, b) => a.gameCreation - b.gameCreation);

  // Determine current starting MMR
  let endMmr = 1640; // Default Gold IV baseline
  if (currentRank && currentRank.tier) {
    const base = TIER_BASE_MMR[currentRank.tier.toUpperCase()] || 1600;
    const div = DIVISION_OFFSET[currentRank.rank] || 0;
    endMmr = base + div + (currentRank.leaguePoints || 0);
  }

  // Work backwards from endMmr to find startMmr
  let totalDelta = 0;
  sorted.forEach((m) => {
    const isWin = m.targetParticipant.win;
    const delta = isWin ? 22 : -19;
    totalDelta += delta;
  });

  let runningMmr = endMmr - totalDelta;

  return sorted.map((m, idx) => {
    const p = m.targetParticipant;
    const delta = p.win ? 22 : -19;
    runningMmr += delta;
    const { tier, rank, lp } = mmrToTierAndRank(runningMmr);

    return {
      matchIndex: idx + 1,
      matchId: m.matchId,
      gameCreation: m.gameCreation,
      championName: p.championName,
      win: p.win,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      mmr: runningMmr,
      delta,
      tier,
      rank,
      lp,
    };
  });
}

// In-memory cache for timeline responses to prevent duplicate calls
export const timelineMemoryCache: Record<string, ParsedTimeline> = {};

export async function fetchMatchTimeline(
  matchId: string,
  regionalRouting: string,
  apiKey: string
): Promise<any> {
  if (isTauriEnvironment()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<any>("get_match_timeline", {
      matchId,
      regionalRouting,
      apiKey,
    });
  }

  const url = `https://${regionalRouting}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;
  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    const res = await fetch(url, {
      headers: { "X-Riot-Token": apiKey },
    });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After") || 2);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch timeline for ${matchId}: HTTP ${res.status}`);
    }

    return await res.json();
  }
}

export function parseMatchTimeline(raw: any, match: ParsedMatch): ParsedTimeline | null {
  try {
    const info = raw.info;
    const metadata = raw.metadata;
    if (!info || !info.frames) return null;

    const targetPuuid = match.targetParticipant.puuid;

    // Resolve target participant ID (1..10)
    let targetParticipantId = 1;
    if (info.participants && Array.isArray(info.participants)) {
      const found = info.participants.find((p: any) => p.puuid === targetPuuid);
      if (found) targetParticipantId = found.participantId;
    } else if (metadata?.participants && Array.isArray(metadata.participants)) {
      const idx = metadata.participants.indexOf(targetPuuid);
      if (idx !== -1) targetParticipantId = idx + 1;
    }

    // Map participant IDs (1..10) to champion names, teams, and summoners
    const participantMap: Record<
      number,
      { puuid: string; championName: string; summonerName: string; teamId: number }
    > = {};

    match.allParticipants.forEach((p, idx) => {
      // Typically participantId is 1-indexed in Riot match v5
      const pid = idx + 1;
      participantMap[pid] = {
        puuid: p.puuid,
        championName: p.championName,
        summonerName: p.summonerName || p.riotIdGameName || "Summoner",
        teamId: p.teamId,
      };
    });

    // If info.participants provided puuids, link precisely by puuid
    if (info.participants && Array.isArray(info.participants)) {
      info.participants.forEach((ip: any) => {
        const matched = match.allParticipants.find((p) => p.puuid === ip.puuid);
        if (matched) {
          participantMap[ip.participantId] = {
            puuid: matched.puuid,
            championName: matched.championName,
            summonerName: matched.summonerName || matched.riotIdGameName || "Summoner",
            teamId: matched.teamId,
          };
        }
      });
    }

    const targetTeamId = match.targetParticipant.teamId;

    const minuteFrames: MinuteLeadFrame[] = [];
    const skillLevelUps: SkillLevelUpEvent[] = [];
    const kills: KillMapEvent[] = [];

    let currentSkillLevel = 0;
    const skillSlotNames: Record<number, SkillSlot> = {
      1: "Q",
      2: "W",
      3: "E",
      4: "R",
    };

    let maxBlueLead = { lead: 0, minute: 0 };
    let maxRedLead = { lead: 0, minute: 0 };
    let goldAt15m = 0;

    info.frames.forEach((frame: any, frameIdx: number) => {
      const minute = frameIdx;
      const pFrames = frame.participantFrames || {};

      let blueGold = 0;
      let redGold = 0;
      let blueXp = 0;
      let redXp = 0;
      let targetGold = 0;
      let targetLevel = 1;
      let targetCs = 0;

      for (let pid = 1; pid <= 10; pid++) {
        const pf = pFrames[String(pid)];
        if (!pf) continue;

        const infoObj = participantMap[pid];
        const isBlue = infoObj ? infoObj.teamId === 100 : pid <= 5;

        if (isBlue) {
          blueGold += pf.totalGold || 0;
          blueXp += pf.xp || 0;
        } else {
          redGold += pf.totalGold || 0;
          redXp += pf.xp || 0;
        }

        if (pid === targetParticipantId) {
          targetGold = pf.totalGold || 0;
          targetLevel = pf.level || 1;
          targetCs = (pf.minionsKilled || 0) + (pf.jungleMinionsKilled || 0);
        }
      }

      const goldDiff = blueGold - redGold;
      const xpDiff = blueXp - redXp;

      if (goldDiff > maxBlueLead.lead) {
        maxBlueLead = { lead: goldDiff, minute };
      }
      if (-goldDiff > maxRedLead.lead) {
        maxRedLead = { lead: -goldDiff, minute };
      }
      if (minute === 15) {
        goldAt15m = goldDiff;
      }

      minuteFrames.push({
        minute,
        blueGold,
        redGold,
        goldDiff,
        blueXp,
        redXp,
        xpDiff,
        targetGold,
        targetLevel,
        targetCs,
      });

      // Process Events
      const events = frame.events || [];
      events.forEach((evt: any) => {
        // Skill Level Up
        if (evt.type === "SKILL_LEVEL_UP" && evt.participantId === targetParticipantId) {
          const slot = evt.skillSlot;
          if (slot in skillSlotNames) {
            currentSkillLevel++;
            skillLevelUps.push({
              level: currentSkillLevel,
              skillSlot: slot,
              skillKey: skillSlotNames[slot],
              timestamp: evt.timestamp,
            });
          }
        }

        // Champion Kill
        if (evt.type === "CHAMPION_KILL") {
          const killerId = evt.killerId || 0;
          const victimId = evt.victimId || 0;
          const assists: number[] = evt.assistingParticipantIds || [];
          const pos = evt.position || { x: 7500, y: 7500 };

          const killerInfo = participantMap[killerId];
          const victimInfo = participantMap[victimId];

          const isTargetKill = killerId === targetParticipantId;
          const isTargetDeath = victimId === targetParticipantId;
          const isTargetAssist = assists.includes(targetParticipantId);

          const timeSec = Math.floor((evt.timestamp || 0) / 1000);
          const evMin = Math.floor(timeSec / 60);
          const evSec = timeSec % 60;

          kills.push({
            killerId,
            victimId,
            assistingParticipantIds: assists,
            killerChampion: killerInfo?.championName || (killerId === 0 ? "Minion/Turret" : "Champion"),
            victimChampion: victimInfo?.championName || "Champion",
            killerName: killerInfo?.summonerName || "Unknown",
            victimName: victimInfo?.summonerName || "Unknown",
            killerTeamId: killerInfo?.teamId || 100,
            victimTeamId: victimInfo?.teamId || 200,
            position: pos,
            timestamp: evt.timestamp || 0,
            minute: evMin,
            second: evSec,
            isTargetKill,
            isTargetDeath,
            isTargetAssist,
          });
        }
      });
    });

    return {
      matchId: metadata?.matchId || match.matchId,
      targetParticipantId,
      targetTeamId,
      maxBlueGoldLead: maxBlueLead,
      maxRedGoldLead: maxRedLead,
      goldAt15m,
      minuteFrames,
      skillLevelUps,
      kills,
    };
  } catch (err) {
    console.error("Error parsing match timeline:", err);
    return null;
  }
}

