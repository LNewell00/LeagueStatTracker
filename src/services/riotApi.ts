import {
  ParsedMatch,
  MatchParticipant,
  PlayerStatsSummary,
  RiotAccount,
  SUPPORTED_REGIONS,
  RegionalRouting,
} from "../types/riot";
import { isTauriEnvironment } from "./storage";

export function getRegionalRouting(regionId: string): RegionalRouting {
  const match = SUPPORTED_REGIONS.find((r) => r.id.toLowerCase() === regionId.toLowerCase());
  return match ? match.routing : "americas";
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
  count: number = 10,
  apiKey: string
): Promise<string[]> {
  if (isTauriEnvironment()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string[]>("get_match_ids", {
      puuid,
      regionalRouting,
      count,
      apiKey,
    });
  }

  const url = `https://${regionalRouting}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
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
  delayMs: number = 80
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map((item) => fn(item)));
    results.push(...chunkResults);
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
        goldEarned: p.goldEarned || 0,
        visionScore: p.visionScore || 0,
        teamId: p.teamId,
      };
    });

    const target = allParticipants.find((p) => p.puuid === targetPuuid) || allParticipants[0];

    return {
      matchId: metadata.matchId,
      gameCreation: info.gameCreation,
      gameDuration: info.gameDuration,
      gameMode: info.gameMode,
      queueId: info.queueId,
      targetParticipant: target,
      allParticipants,
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

