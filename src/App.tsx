import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { StatsOverview } from "./components/StatsOverview";
import { MmrGraph } from "./components/MmrGraph";
import { LiveGameCard } from "./components/LiveGameCard";
import { MatchHistoryTable } from "./components/MatchHistoryTable";
import { SettingsModal } from "./components/SettingsModal";
import { ParsedMatch, PlayerStatsSummary, RankedEntry, MmrDataPoint } from "./types/riot";
import { LivePollerState } from "./types/live";
import {
  fetchRiotAccount,
  fetchMatchIds,
  fetchMatchDetail,
  parseRawMatch,
  computeSummaryStats,
  getRegionalRouting,
  getPlatformId,
  fetchLeagueEntries,
  calculateMmrProgression,
  batchFetchMatches,
} from "./services/riotApi";
import { liveClientService } from "./services/liveClient";
import {
  loadPreferences,
  saveMatchesToCache,
  loadMatchesFromCache,
  AppPreferences,
} from "./services/storage";
import { initDDragonVersion } from "./services/ddragon";
import { MOCK_MATCHES, MOCK_SUMMARY } from "./services/mockData";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export const App: React.FC = () => {
  const [preferences, setPreferences] = useState<AppPreferences>(loadPreferences);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeAccount, setActiveAccount] = useState<{
    puuid: string;
    gameName: string;
    tagLine: string;
    region: string;
    regionalRouting: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "info" | "success" | "error";
    text: string;
  } | null>(null);

  // Match State
  const [matches, setMatches] = useState<ParsedMatch[]>([]);
  const [summary, setSummary] = useState<PlayerStatsSummary>(MOCK_SUMMARY);
  const [rankedEntry, setRankedEntry] = useState<RankedEntry | null>({
    queueType: "RANKED_SOLO_5x5",
    tier: "GOLD",
    rank: "IV",
    leaguePoints: 45,
    wins: 48,
    losses: 36,
  });
  const [mmrDataPoints, setMmrDataPoints] = useState<MmrDataPoint[]>([]);

  // Live Poller State
  const [liveState, setLiveState] = useState<LivePollerState>({
    isActive: false,
    isLoading: false,
    lastUpdated: null,
    data: null,
    error: null,
  });
  const [isMockLiveActive, setIsMockLiveActive] = useState(false);

  // Initialize Data Dragon & Live Client Poller
  useEffect(() => {
    initDDragonVersion();
    liveClientService.start();

    const unsubscribe = liveClientService.subscribe((state) => {
      setLiveState(state);
    });

    // Load initial cached matches or mock fallback
    loadInitialData();

    return () => {
      unsubscribe();
      liveClientService.stop();
    };
  }, []);

  const loadInitialData = async () => {
    const cached = await loadMatchesFromCache();
    if (cached && cached.length > 0) {
      setMatches(cached);
      setSummary(computeSummaryStats(cached));
      setMmrDataPoints(calculateMmrProgression(cached, rankedEntry || undefined));
    } else {
      // Use high-fidelity mock matches for initial visual display
      setMatches(MOCK_MATCHES);
      setSummary(MOCK_SUMMARY);
      setMmrDataPoints(calculateMmrProgression(MOCK_MATCHES, rankedEntry || undefined));
    }
  };

  const handleFetchMatches = useCallback(
    async (gameName: string, tagLine: string, region: string, count: number = preferences.matchCount || 20) => {
      if (!preferences.apiKey) {
        setStatusMessage({
          type: "info",
          text: "No Riot API Key configured. Displaying demo preview matches. Click 'API Key' to add your key.",
        });
        setMatches(MOCK_MATCHES);
        setSummary(MOCK_SUMMARY);
        return;
      }

      setIsLoading(true);
      setStatusMessage({ type: "info", text: `Resolving PUUID for ${gameName}#${tagLine}...` });

      try {
        const regionalRouting = getRegionalRouting(region);

        // 1. Fetch Account PUUID
        const account = await fetchRiotAccount(
          gameName,
          tagLine,
          regionalRouting,
          preferences.apiKey
        );

        setActiveAccount({
          puuid: account.puuid,
          gameName: account.gameName,
          tagLine: account.tagLine,
          region,
          regionalRouting,
        });

        // Fetch official Ranked Tier & LP from League-v4
        let currentSoloRank: RankedEntry | null = null;
        try {
          const platformId = getPlatformId(region);
          const entries = await fetchLeagueEntries(account.puuid, platformId, preferences.apiKey);
          currentSoloRank =
            entries.find((e) => e.queueType === "RANKED_SOLO_5x5") || entries[0] || null;
          if (currentSoloRank) {
            setRankedEntry(currentSoloRank);
          }
        } catch {
          // ignore if unranked or lookup fails
        }

        setStatusMessage({
          type: "info",
          text: `Found ${account.gameName}#${account.tagLine}. Pulling last ${count} match IDs...`,
        });

        // 2. Fetch Match IDs with chosen count
        const matchIds = await fetchMatchIds(
          account.puuid,
          regionalRouting,
          count,
          preferences.apiKey,
          0
        );

        if (matchIds.length === 0) {
          setStatusMessage({
            type: "info",
            text: `No recent Match V5 records found for ${account.gameName} on ${region.toUpperCase()}.`,
          });
          setIsLoading(false);
          return;
        }

        // 3. Smart Cache Lookup: Check what's already cached locally to save rate-limits & time
        const cachedMap = new Map<string, ParsedMatch>();
        matches.forEach((m) => cachedMap.set(m.matchId, m));
        const persisted = await loadMatchesFromCache();
        persisted.forEach((m) => cachedMap.set(m.matchId, m));

        const missingIds = matchIds.filter((id) => !cachedMap.has(id));

        // 4. If all matches are already cached, load them instantly with zero network overhead!
        if (missingIds.length === 0) {
          const resolvedMatches = matchIds
            .map((id) => cachedMap.get(id))
            .filter((m): m is ParsedMatch => m !== undefined);

          setMatches(resolvedMatches);
          setSummary(computeSummaryStats(resolvedMatches));
          setMmrDataPoints(
            calculateMmrProgression(resolvedMatches, currentSoloRank || rankedEntry || undefined)
          );

          setStatusMessage({
            type: "success",
            text: `Loaded all ${resolvedMatches.length} matches instantly from local cache (0 API calls)!`,
          });
          setIsLoading(false);
          return;
        }

        // 5. Fetch ONLY missing matches with rate-limit friendly batch pacing
        setStatusMessage({
          type: "info",
          text: `Found ${matchIds.length - missingIds.length} matches in local cache. Fetching ${missingIds.length} new matches from Riot servers...`,
        });

        const newResults = await batchFetchMatches(
          missingIds,
          async (mId) => {
            try {
              const raw = await fetchMatchDetail(mId, regionalRouting, preferences.apiKey);
              return parseRawMatch(raw, account.puuid);
            } catch {
              return null;
            }
          },
          5, // chunk size of 5 requests
          100, // 100ms pause between chunks to safely stay well under 20 req/1s
          (completed, total) => {
            setStatusMessage({
              type: "info",
              text: `Fetching new match details (${completed}/${total})...`,
            });
          }
        );

        newResults.forEach((m) => {
          if (m) cachedMap.set(m.matchId, m);
        });

        const resolvedMatches = matchIds
          .map((id) => cachedMap.get(id))
          .filter((m): m is ParsedMatch => m !== undefined);

        if (resolvedMatches.length > 0) {
          setMatches(resolvedMatches);
          const computed = computeSummaryStats(resolvedMatches);
          setSummary(computed);
          setMmrDataPoints(
            calculateMmrProgression(resolvedMatches, currentSoloRank || rankedEntry || undefined)
          );

          // Save combined cache so we retain all matches (both current and previously cached)
          const allCachedMatches = Array.from(cachedMap.values());
          await saveMatchesToCache(allCachedMatches);

          setStatusMessage({
            type: "success",
            text: `Successfully synced! Showing ${resolvedMatches.length} matches (${missingIds.length} new fetched, ${matchIds.length - missingIds.length} from cache).`,
          });
        } else {
          setStatusMessage({
            type: "error",
            text: "Could not parse match details from Riot API response.",
          });
        }
      } catch (err: any) {
        console.error(err);
        setStatusMessage({
          type: "error",
          text: err?.message || "Failed to fetch data from Riot API. Check key and region.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [preferences.apiKey, preferences.matchCount, rankedEntry]
  );

  const handleLoadMoreMatches = useCallback(async () => {
    if (!preferences.apiKey) return;
    if (isLoadingMore || isLoading) return;

    let targetAccount = activeAccount;

    // If activeAccount not set yet, attempt to resolve from preferences
    if (!targetAccount) {
      try {
        const regionalRouting = getRegionalRouting(preferences.region);
        const acc = await fetchRiotAccount(
          preferences.gameName,
          preferences.tagLine,
          regionalRouting,
          preferences.apiKey
        );
        targetAccount = {
          puuid: acc.puuid,
          gameName: acc.gameName,
          tagLine: acc.tagLine,
          region: preferences.region,
          regionalRouting,
        };
        setActiveAccount(targetAccount);
      } catch {
        setStatusMessage({
          type: "error",
          text: "Could not verify account to load more matches.",
        });
        return;
      }
    }

    setIsLoadingMore(true);
    setStatusMessage({
      type: "info",
      text: `Pulling next batch of 10 matches (offset: ${matches.length})...`,
    });

    try {
      const existingIds = new Set(matches.map((m) => m.matchId));
      const nextBatchIds = await fetchMatchIds(
        targetAccount.puuid,
        targetAccount.regionalRouting,
        10,
        preferences.apiKey,
        matches.length
      );

      const uniqueNewIds = nextBatchIds.filter((id) => !existingIds.has(id));

      if (uniqueNewIds.length === 0) {
        setStatusMessage({
          type: "info",
          text: "No more older matches found on Riot servers.",
        });
        setIsLoadingMore(false);
        return;
      }

      // Check persistent cache first for any matches already retrieved previously
      const cachedMap = new Map<string, ParsedMatch>();
      const persisted = await loadMatchesFromCache();
      persisted.forEach((m) => cachedMap.set(m.matchId, m));

      const missingBatchIds = uniqueNewIds.filter((id) => !cachedMap.has(id));

      if (missingBatchIds.length > 0) {
        const results = await batchFetchMatches(
          missingBatchIds,
          async (mId) => {
            try {
              const raw = await fetchMatchDetail(mId, targetAccount!.regionalRouting, preferences.apiKey);
              return parseRawMatch(raw, targetAccount!.puuid);
            } catch {
              return null;
            }
          },
          5,
          100,
          (done, total) => {
            setStatusMessage({
              type: "info",
              text: `Pulling older matches (${done}/${total})...`,
            });
          }
        );

        results.forEach((m) => {
          if (m) cachedMap.set(m.matchId, m);
        });
      }

      const newlyAdded = uniqueNewIds
        .map((id) => cachedMap.get(id))
        .filter((m): m is ParsedMatch => m !== undefined);

      if (newlyAdded.length > 0) {
        const combined = [...matches, ...newlyAdded];
        setMatches(combined);
        setSummary(computeSummaryStats(combined));
        setMmrDataPoints(
          calculateMmrProgression(combined, rankedEntry || undefined)
        );

        // Keep all matches cached
        await saveMatchesToCache(Array.from(cachedMap.values()));

        setStatusMessage({
          type: "success",
          text: `Added ${newlyAdded.length} older matches (${missingBatchIds.length} downloaded, ${newlyAdded.length - missingBatchIds.length} from cache)! Now tracking ${combined.length} total games.`,
        });
      } else {
        setStatusMessage({
          type: "info",
          text: "No additional match details could be retrieved.",
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to load additional matches.",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [preferences, activeAccount, matches, isLoadingMore, isLoading, rankedEntry]);

  const handleToggleMockLive = () => {
    const next = !isMockLiveActive;
    setIsMockLiveActive(next);
    liveClientService.setMockMode(next);
  };

  const handleCacheCleared = () => {
    setMatches([]);
    setSummary({
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
    });
    setStatusMessage({ type: "info", text: "Match cache cleared successfully." });
  };

  return (
    <div className="min-h-screen flex flex-col bg-riot-darkest">
      {/* Top Header */}
      <Header
        gameName={preferences.gameName}
        tagLine={preferences.tagLine}
        region={preferences.region}
        matchCount={preferences.matchCount || 20}
        isLoading={isLoading}
        isLiveGameActive={liveState.isActive}
        onSearch={handleFetchMatches}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasApiKey={Boolean(preferences.apiKey)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Status notification toast/banner */}
        {statusMessage && (
          <div
            className={`flex items-center justify-between p-3.5 rounded-xl border text-sm transition-all animate-in fade-in ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : statusMessage.type === "error"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-riot-surface border-riot-border text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {statusMessage.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {statusMessage.type === "info" && <Info className="w-4 h-4 text-riot-accent" />}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-white/10"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Summary Header */}
        <StatsOverview
          summary={summary}
          summonerName={`${preferences.gameName}#${preferences.tagLine}`}
        />

        {/* 2. Ranked MMR Trend Graph */}
        <MmrGraph dataPoints={mmrDataPoints} currentRank={rankedEntry} />

        {/* 3. Live Client Status Widget */}
        <LiveGameCard
          liveState={liveState}
          isMockActive={isMockLiveActive}
          onToggleMock={handleToggleMockLive}
        />

        {/* 4. Recent Matches Table */}
        <MatchHistoryTable
          matches={matches}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMoreMatches}
          hasApiKey={Boolean(preferences.apiKey)}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onSavePreferences={(newPrefs) => setPreferences(newPrefs)}
        onCacheCleared={handleCacheCleared}
      />
    </div>
  );
};

export default App;

