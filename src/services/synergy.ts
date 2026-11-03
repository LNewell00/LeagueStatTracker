import { ParsedMatch } from "../types/riot";

export interface ChampionCombo {
  myChampion: string;
  theirChampion: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface TeammateSynergy {
  puuid: string;
  displayName: string;
  summonerName: string;
  tagLine: string;
  gamesTogether: number;
  wins: number;
  losses: number;
  winRate: number;
  mostPlayedChampion: string;
  topCombos: ChampionCombo[];
  lastPlayed: number;
  isFrequentDuo: boolean;
}

export interface OverallSynergyStats {
  totalTeammatesTracked: number;
  frequentDuosCount: number;
  bestCombo: ChampionCombo | null;
  teammates: TeammateSynergy[];
}

export function computeTeammateSynergies(
  matches: ParsedMatch[],
  _targetPuuid?: string
): OverallSynergyStats {
  if (!matches || matches.length === 0) {
    return {
      totalTeammatesTracked: 0,
      frequentDuosCount: 0,
      bestCombo: null,
      teammates: [],
    };
  }

  // Map of teammateKey -> data
  const teammateMap = new Map<
    string,
    {
      puuid: string;
      displayName: string;
      summonerName: string;
      tagLine: string;
      wins: number;
      losses: number;
      lastPlayed: number;
      championsPlayed: Map<string, number>;
      combosMap: Map<string, { myChamp: string; theirChamp: string; wins: number; total: number }>;
    }
  >();

  const allCombosMap = new Map<string, { myChamp: string; theirChamp: string; wins: number; total: number }>();

  matches.forEach((match) => {
    const target = match.targetParticipant;
    if (!target) return;

    const targetTeam = target.teamId;
    const isWin = target.win;
    const myChamp = target.championName;

    const teammates = match.allParticipants.filter(
      (p) => p.teamId === targetTeam && p.puuid !== target.puuid
    );

    teammates.forEach((t) => {
      const name = t.riotIdGameName || t.summonerName || "Unknown";
      const tag = t.riotIdTagline || "";
      const teammateKey = t.puuid || `${name}#${tag}`;
      const theirChamp = t.championName;

      if (!teammateMap.has(teammateKey)) {
        teammateMap.set(teammateKey, {
          puuid: t.puuid,
          displayName: tag ? `${name}#${tag}` : name,
          summonerName: name,
          tagLine: tag,
          wins: 0,
          losses: 0,
          lastPlayed: match.gameCreation,
          championsPlayed: new Map(),
          combosMap: new Map(),
        });
      }

      const record = teammateMap.get(teammateKey)!;
      if (isWin) {
        record.wins++;
      } else {
        record.losses++;
      }

      if (match.gameCreation > record.lastPlayed) {
        record.lastPlayed = match.gameCreation;
      }

      // Track teammate's champion frequency
      record.championsPlayed.set(
        theirChamp,
        (record.championsPlayed.get(theirChamp) || 0) + 1
      );

      // Track combo with this specific teammate
      const comboKey = `${myChamp}+${theirChamp}`;
      if (!record.combosMap.has(comboKey)) {
        record.combosMap.set(comboKey, { myChamp, theirChamp, wins: 0, total: 0 });
      }
      const c = record.combosMap.get(comboKey)!;
      c.total++;
      if (isWin) c.wins++;

      // Track overall combo across all games
      if (!allCombosMap.has(comboKey)) {
        allCombosMap.set(comboKey, { myChamp, theirChamp, wins: 0, total: 0 });
      }
      const globalCombo = allCombosMap.get(comboKey)!;
      globalCombo.total++;
      if (isWin) globalCombo.wins++;
    });
  });

  const teammates: TeammateSynergy[] = Array.from(teammateMap.values()).map((rec) => {
    const totalGames = rec.wins + rec.losses;
    const winRate = totalGames > 0 ? Math.round((rec.wins / totalGames) * 100) : 0;

    // Determine their most played champion
    let mostPlayedChamp = "Yuumi";
    let maxCount = 0;
    rec.championsPlayed.forEach((count, champ) => {
      if (count > maxCount) {
        maxCount = count;
        mostPlayedChamp = champ;
      }
    });

    // Sort combos by games played then winRate
    const combos: ChampionCombo[] = Array.from(rec.combosMap.values())
      .map((c) => ({
        myChampion: c.myChamp,
        theirChampion: c.theirChamp,
        games: c.total,
        wins: c.wins,
        losses: c.total - c.wins,
        winRate: Math.round((c.wins / c.total) * 100),
      }))
      .sort((a, b) => b.games - a.games || b.winRate - a.winRate);

    return {
      puuid: rec.puuid,
      displayName: rec.displayName,
      summonerName: rec.summonerName,
      tagLine: rec.tagLine,
      gamesTogether: totalGames,
      wins: rec.wins,
      losses: rec.losses,
      winRate,
      mostPlayedChampion: mostPlayedChamp,
      topCombos: combos,
      lastPlayed: rec.lastPlayed,
      isFrequentDuo: totalGames >= 2,
    };
  });

  // Sort teammates: Duos (>=2 games) first, then by games together descending, then winRate
  teammates.sort((a, b) => {
    if (a.isFrequentDuo !== b.isFrequentDuo) {
      return a.isFrequentDuo ? -1 : 1;
    }
    if (b.gamesTogether !== a.gamesTogether) {
      return b.gamesTogether - a.gamesTogether;
    }
    return b.winRate - a.winRate;
  });

  // Find best global duo combo with at least 2 games (or 1 if few matches)
  const threshold = matches.length >= 10 ? 2 : 1;
  const validCombos = Array.from(allCombosMap.values())
    .filter((c) => c.total >= threshold)
    .map((c) => ({
      myChampion: c.myChamp,
      theirChampion: c.theirChamp,
      games: c.total,
      wins: c.wins,
      losses: c.total - c.wins,
      winRate: Math.round((c.wins / c.total) * 100),
    }))
    .sort((a, b) => b.winRate - a.winRate || b.games - a.games);

  const bestCombo = validCombos.length > 0 ? validCombos[0] : null;

  return {
    totalTeammatesTracked: teammates.length,
    frequentDuosCount: teammates.filter((t) => t.isFrequentDuo).length,
    bestCombo,
    teammates,
  };
}
