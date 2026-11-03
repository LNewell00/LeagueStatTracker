import { ParsedMatch, RankedEntry, MmrDataPoint } from "../types/riot";

export type QueueCategory = "ALL" | "RANKED_SOLO" | "RANKED_FLEX" | "NORMAL" | "ARAM" | "ARENA" | "OTHER";

export interface QueueMeta {
  queueId: number;
  name: string;
  shortLabel: string;
  category: QueueCategory;
  isRanked: boolean;
  color: string;
  bg: string;
  border: string;
}

export function getQueueMeta(queueId: number, gameMode?: string): QueueMeta {
  switch (queueId) {
    case 420:
      return {
        queueId,
        name: "Ranked Solo/Duo",
        shortLabel: "Solo/Duo",
        category: "RANKED_SOLO",
        isRanked: true,
        color: "text-amber-500 dark:text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
      };
    case 440:
      return {
        queueId,
        name: "Ranked Flex",
        shortLabel: "Flex",
        category: "RANKED_FLEX",
        isRanked: true,
        color: "text-blue-500 dark:text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
      };
    case 400:
      return {
        queueId,
        name: "Normal Draft",
        shortLabel: "Draft",
        category: "NORMAL",
        isRanked: false,
        color: "text-neutral-600 dark:text-neutral-400",
        bg: "bg-neutral-100 dark:bg-neutral-800",
        border: "border-neutral-300 dark:border-neutral-700",
      };
    case 430:
      return {
        queueId,
        name: "Normal Blind",
        shortLabel: "Blind",
        category: "NORMAL",
        isRanked: false,
        color: "text-neutral-600 dark:text-neutral-400",
        bg: "bg-neutral-100 dark:bg-neutral-800",
        border: "border-neutral-300 dark:border-neutral-700",
      };
    case 490:
      return {
        queueId,
        name: "Quickplay",
        shortLabel: "Quickplay",
        category: "NORMAL",
        isRanked: false,
        color: "text-neutral-600 dark:text-neutral-400",
        bg: "bg-neutral-100 dark:bg-neutral-800",
        border: "border-neutral-300 dark:border-neutral-700",
      };
    case 450:
      return {
        queueId,
        name: "ARAM (Howling Abyss)",
        shortLabel: "ARAM",
        category: "ARAM",
        isRanked: false,
        color: "text-cyan-600 dark:text-cyan-400",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/30",
      };
    case 1700:
      return {
        queueId,
        name: "Arena (2v2v2v2)",
        shortLabel: "Arena",
        category: "ARENA",
        isRanked: false,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/30",
      };
    case 700:
      return {
        queueId,
        name: "Clash Tournament",
        shortLabel: "Clash",
        category: "OTHER",
        isRanked: true,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
      };
    case 830:
    case 840:
    case 850:
      return {
        queueId,
        name: "Co-op vs AI",
        shortLabel: "Bots",
        category: "OTHER",
        isRanked: false,
        color: "text-neutral-500",
        bg: "bg-neutral-100 dark:bg-neutral-800",
        border: "border-neutral-300 dark:border-neutral-700",
      };
    default:
      if (gameMode === "ARAM") {
        return {
          queueId,
          name: "ARAM",
          shortLabel: "ARAM",
          category: "ARAM",
          isRanked: false,
          color: "text-cyan-600 dark:text-cyan-400",
          bg: "bg-cyan-500/10",
          border: "border-cyan-500/30",
        };
      }
      if (gameMode === "CHERRY") {
        return {
          queueId,
          name: "Arena",
          shortLabel: "Arena",
          category: "ARENA",
          isRanked: false,
          color: "text-purple-600 dark:text-purple-400",
          bg: "bg-purple-500/10",
          border: "border-purple-500/30",
        };
      }
      if (gameMode === "PRACTICETOOL") {
        return {
          queueId,
          name: "Practice Tool",
          shortLabel: "Practice",
          category: "OTHER",
          isRanked: false,
          color: "text-neutral-500",
          bg: "bg-neutral-100 dark:bg-neutral-800",
          border: "border-neutral-300 dark:border-neutral-700",
        };
      }
      return {
        queueId,
        name: gameMode ? gameMode.charAt(0) + gameMode.slice(1).toLowerCase() : "Normal Game",
        shortLabel: gameMode || "Normal",
        category: "NORMAL",
        isRanked: false,
        color: "text-neutral-600 dark:text-neutral-400",
        bg: "bg-neutral-100 dark:bg-neutral-800",
        border: "border-neutral-300 dark:border-neutral-700",
      };
  }
}

const TIER_ORDER = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"];
const DIVISION_ORDER = ["IV", "III", "II", "I"];

export const TIER_COLORS: Record<string, { text: string; bg: string; border: string; hex: string }> = {
  IRON: { text: "text-neutral-400", bg: "bg-neutral-500/10", border: "border-neutral-500/30", hex: "#71717a" },
  BRONZE: { text: "text-amber-700 dark:text-amber-600", bg: "bg-amber-800/10", border: "border-amber-800/30", hex: "#b45309" },
  SILVER: { text: "text-slate-400 dark:text-slate-300", bg: "bg-slate-400/10", border: "border-slate-400/30", hex: "#94a3b8" },
  GOLD: { text: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", hex: "#f59e0b" },
  PLATINUM: { text: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/30", hex: "#14b8a6" },
  EMERALD: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", hex: "#10b981" },
  DIAMOND: { text: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", hex: "#3b82f6" },
  MASTER: { text: "text-purple-500 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", hex: "#a855f7" },
  GRANDMASTER: { text: "text-red-500 dark:text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", hex: "#ef4444" },
  CHALLENGER: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", hex: "#eab308" },
};

export function getNextRank(tier: string, rank: string): { nextTier: string; nextRank: string; label: string } {
  const normTier = tier.toUpperCase();
  const divIndex = DIVISION_ORDER.indexOf(rank.toUpperCase());

  // If in division IV, III, II -> step up in same tier (e.g. Gold IV -> Gold III)
  if (divIndex !== -1 && divIndex < DIVISION_ORDER.length - 1) {
    const nextRank = DIVISION_ORDER[divIndex + 1];
    return {
      nextTier: normTier,
      nextRank,
      label: `${normTier.charAt(0) + normTier.slice(1).toLowerCase()} ${nextRank}`,
    };
  }

  // If in division I -> advance to next Tier division IV (e.g. Gold I -> Platinum IV)
  const tierIndex = TIER_ORDER.indexOf(normTier);
  if (tierIndex !== -1 && tierIndex < TIER_ORDER.length - 1) {
    const nextTier = TIER_ORDER[tierIndex + 1];
    if (nextTier === "MASTER" || nextTier === "GRANDMASTER" || nextTier === "CHALLENGER") {
      return {
        nextTier,
        nextRank: "I",
        label: `${nextTier.charAt(0) + nextTier.slice(1).toLowerCase()}`,
      };
    }
    return {
      nextTier,
      nextRank: "IV",
      label: `${nextTier.charAt(0) + nextTier.slice(1).toLowerCase()} IV`,
    };
  }

  return { nextTier: normTier, nextRank: "I", label: `${normTier} Peak` };
}

export interface RankUpForecast {
  currentTier: string;
  currentRank: string;
  currentLp: number;
  lpToPromote: number;
  targetTier: string;
  targetRank: string;
  targetLabel: string;
  avgLpGain: number;
  avgLpLoss: number;
  netWinsNeeded: number;
  scenarios: {
    record: string;
    netGain: number;
    promotes: boolean;
  }[];
  demotionRisk: boolean;
  demotionWarning?: string;
  rankedWinRate: number;
  rankedTotalGames: number;
}

export function calculateRankUpForecast(
  currentRank: RankedEntry | null,
  matches: ParsedMatch[],
  mmrPoints: MmrDataPoint[] = []
): RankUpForecast {
  const tier = currentRank?.tier?.toUpperCase() || "GOLD";
  const rank = currentRank?.rank?.toUpperCase() || "IV";
  const currentLp = currentRank?.leaguePoints ?? 45;
  const wins = currentRank?.wins || 0;
  const losses = currentRank?.losses || 0;
  const totalRankedGames = Math.max(1, wins + losses);
  const rankedWinRate = Math.round((wins / totalRankedGames) * 100);

  // Calculate actual LP gains from recent matches if available
  const rankedMatches = matches.filter((m) => m.queueId === 420 || m.queueId === 440);
  const mmrMap = new Map(mmrPoints.map((d) => [d.matchId, d]));

  let totalWinGains = 0;
  let winCount = 0;
  let totalLossDeltas = 0;
  let lossCount = 0;

  rankedMatches.forEach((m) => {
    const pt = mmrMap.get(m.matchId);
    if (pt) {
      if (pt.win) {
        totalWinGains += pt.delta;
        winCount++;
      } else {
        totalLossDeltas += Math.abs(pt.delta);
        lossCount++;
      }
    } else {
      if (m.targetParticipant.win) {
        totalWinGains += 22;
        winCount++;
      } else {
        totalLossDeltas += 19;
        lossCount++;
      }
    }
  });

  const avgLpGain = winCount > 0 ? Math.round(totalWinGains / winCount) : 22;
  const avgLpLoss = lossCount > 0 ? Math.round(totalLossDeltas / lossCount) : 19;

  const lpToPromote = Math.max(1, 100 - currentLp);
  const netWinsNeeded = Math.max(1, Math.ceil(lpToPromote / Math.max(15, avgLpGain)));

  const { nextTier, nextRank, label: targetLabel } = getNextRank(tier, rank);

  // Compute realistic match record scenarios
  const scenarios = [
    {
      record: `${netWinsNeeded}-0`,
      netGain: netWinsNeeded * avgLpGain,
      promotes: netWinsNeeded * avgLpGain >= lpToPromote,
    },
    {
      record: `${netWinsNeeded + 1}-1`,
      netGain: (netWinsNeeded + 1) * avgLpGain - avgLpLoss,
      promotes: (netWinsNeeded + 1) * avgLpGain - avgLpLoss >= lpToPromote,
    },
    {
      record: `${netWinsNeeded + 2}-2`,
      netGain: (netWinsNeeded + 2) * avgLpGain - 2 * avgLpLoss,
      promotes: (netWinsNeeded + 2) * avgLpGain - 2 * avgLpLoss >= lpToPromote,
    },
  ];

  const demotionRisk = currentLp <= 15;
  const demotionWarning =
    currentLp === 0
      ? "At 0 LP: Loss may trigger demotion warning shield."
      : currentLp <= 15
      ? `Low LP Warning: ~1 defeat will place you at 0 LP.`
      : undefined;

  return {
    currentTier: tier,
    currentRank: rank,
    currentLp,
    lpToPromote,
    targetTier: nextTier,
    targetRank: nextRank,
    targetLabel,
    avgLpGain,
    avgLpLoss,
    netWinsNeeded,
    scenarios,
    demotionRisk,
    demotionWarning,
    rankedWinRate,
    rankedTotalGames: wins + losses,
  };
}

export function calculateLpDeltaForMatch(
  match: ParsedMatch,
  mmrPoint?: MmrDataPoint
): { isRanked: boolean; deltaText: string; deltaNumber: number; isGain: boolean } {
  const isRanked = match.queueId === 420 || match.queueId === 440;
  const isWin = match.targetParticipant.win;

  if (!isRanked) {
    const meta = getQueueMeta(match.queueId, match.gameMode);
    return {
      isRanked: false,
      deltaText: meta.shortLabel,
      deltaNumber: 0,
      isGain: isWin,
    };
  }

  const delta = mmrPoint ? mmrPoint.delta : isWin ? 22 : -19;
  const isGain = delta >= 0;
  const deltaText = isGain ? `+${delta} LP` : `${delta} LP`;

  return {
    isRanked: true,
    deltaText,
    deltaNumber: delta,
    isGain,
  };
}

