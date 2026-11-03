import React, { useState, useMemo } from "react";
import { ParsedMatch, MmrDataPoint } from "../types/riot";
import { MatchRow } from "./MatchRow";
import {
  History,
  Shield,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Layers,
  TrendingUp,
} from "lucide-react";

interface MatchHistoryTableProps {
  matches: ParsedMatch[];
  mmrPoints?: MmrDataPoint[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  hasApiKey?: boolean;
  onOpenBreakdown?: (match: ParsedMatch) => void;
}

export const MatchHistoryTable: React.FC<MatchHistoryTableProps> = ({
  matches,
  mmrPoints,
  isLoading,
  isLoadingMore = false,
  onLoadMore,
  hasApiKey = false,
  onOpenBreakdown,
}) => {
  const [filter, setFilter] = useState<"ALL" | "WIN" | "LOSS">("ALL");
  const [queueFilter, setQueueFilter] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Map MMR points by match ID for instant O(1) delta lookup
  const mmrMap = useMemo(() => {
    return new Map(mmrPoints?.map((p) => [p.matchId, p]) || []);
  }, [mmrPoints]);

  // Count matches per queue
  const queueCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: matches.length };
    matches.forEach((m) => {
      const q = String(m.queueId);
      counts[q] = (counts[q] || 0) + 1;
    });
    return counts;
  }, [matches]);

  // Filter matches by both Win/Loss and Queue
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Win/Loss filter
      if (filter === "WIN" && !m.targetParticipant.win) return false;
      if (filter === "LOSS" && m.targetParticipant.win) return false;

      // Queue filter
      if (queueFilter !== "ALL") {
        if (queueFilter === "420" && m.queueId !== 420) return false;
        if (queueFilter === "440" && m.queueId !== 440) return false;
        if (queueFilter === "400" && m.queueId !== 400 && m.queueId !== 430) return false;
        if (queueFilter === "450" && m.queueId !== 450) return false;
        if (
          queueFilter === "OTHER" &&
          [420, 440, 400, 430, 450].includes(m.queueId)
        )
          return false;
      }

      return true;
    });
  }, [matches, filter, queueFilter]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, queueFilter, matches.length, pageSize]);

  // Pagination calculation
  const totalPages =
    pageSize === "ALL" ? 1 : Math.max(1, Math.ceil(filteredMatches.length / pageSize));

  const paginatedMatches = useMemo(() => {
    if (pageSize === "ALL") return filteredMatches;
    const start = (currentPage - 1) * pageSize;
    return filteredMatches.slice(start, start + pageSize);
  }, [filteredMatches, currentPage, pageSize]);

  const startIndex = pageSize === "ALL" ? 1 : (currentPage - 1) * pageSize + 1;
  const endIndex =
    pageSize === "ALL"
      ? filteredMatches.length
      : Math.min(currentPage * pageSize, filteredMatches.length);

  // Filtered telemetry summary
  const winsCount = filteredMatches.filter((m) => m.targetParticipant.win).length;
  const lossesCount = filteredMatches.length - winsCount;
  const winRate = filteredMatches.length > 0 ? Math.round((winsCount / filteredMatches.length) * 100) : 0;

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded p-4 sm:p-5 shadow-sm space-y-3.5">
      {/* Table Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3.5 pb-3.5 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-riot-red" />
          <div>
            <div className="flex items-center gap-2.5 font-mono">
              <span className="text-base font-black uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                Match History
              </span>
              <span className="text-xs sm:text-sm text-neutral-500 tabular-nums">
                ({filteredMatches.length} / {matches.length} Total)
              </span>
              {filteredMatches.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-sm font-bold bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                  {winsCount}W - {lossesCount}L ({winRate}%)
                </span>
              )}
            </div>
            {filteredMatches.length > 0 && (
              <p className="text-xs font-mono text-neutral-400 mt-0.5 tabular-nums">
                Showing {startIndex}–{endIndex} of {filteredMatches.length}
              </p>
            )}
          </div>
        </div>

        {/* Filter Controls & Page Size */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end font-mono">
          {/* Win / Loss Filter */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-sm border border-neutral-200 dark:border-neutral-800 text-xs">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                filter === "ALL"
                  ? "bg-white dark:bg-[#1a1f2c] text-neutral-900 dark:text-neutral-100 shadow-sm border border-neutral-300 dark:border-neutral-700"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("WIN")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                filter === "WIN"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "text-neutral-500 hover:text-emerald-600"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Victories</span>
            </button>
            <button
              onClick={() => setFilter("LOSS")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                filter === "LOSS"
                  ? "bg-riot-red/15 text-riot-red border border-riot-red/30"
                  : "text-neutral-500 hover:text-riot-red"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Defeats</span>
            </button>
          </div>

          {/* Page Size Toggle */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-sm border border-neutral-200 dark:border-neutral-800 text-xs font-mono">
            <ListFilter className="w-3.5 h-3.5 text-neutral-400 ml-1" />
            <button
              onClick={() => setPageSize(10)}
              className={`px-2.5 py-1.5 rounded-sm transition-all cursor-pointer ${
                pageSize === 10
                  ? "bg-riot-red text-white font-bold"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              }`}
            >
              10/p
            </button>
            <button
              onClick={() => setPageSize(20)}
              className={`px-2.5 py-1.5 rounded-sm transition-all cursor-pointer ${
                pageSize === 20
                  ? "bg-riot-red text-white font-bold"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              }`}
            >
              20/p
            </button>
            <button
              onClick={() => setPageSize("ALL")}
              className={`px-2.5 py-1.5 rounded-sm transition-all cursor-pointer ${
                pageSize === "ALL"
                  ? "bg-riot-red text-white font-bold"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Queue Mode Filter Subbar */}
      <div className="flex flex-wrap items-center gap-2 pb-2.5 border-b border-neutral-200 dark:border-neutral-800 text-xs font-mono">
        <span className="text-xs uppercase font-bold text-neutral-400 mr-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" /> Queue:
        </span>
        <button
          onClick={() => setQueueFilter("ALL")}
          className={`px-2.5 py-1 rounded-sm transition-all cursor-pointer ${
            queueFilter === "ALL"
              ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold"
              : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-neutral-200 dark:border-neutral-800"
          }`}
        >
          All Modes ({matches.length})
        </button>
        <button
          onClick={() => setQueueFilter("420")}
          className={`px-2.5 py-1 rounded-sm transition-all flex items-center gap-1 cursor-pointer ${
            queueFilter === "420"
              ? "bg-riot-red text-white font-bold"
              : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-riot-red border border-neutral-200 dark:border-neutral-800"
          }`}
        >
          <TrendingUp className="w-3 h-3" />
          Ranked Solo ({queueCounts["420"] || 0})
        </button>
        <button
          onClick={() => setQueueFilter("440")}
          className={`px-2.5 py-1 rounded-sm transition-all cursor-pointer ${
            queueFilter === "440"
              ? "bg-purple-600 text-white font-bold"
              : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-purple-400 border border-neutral-200 dark:border-neutral-800"
          }`}
        >
          Ranked Flex ({queueCounts["440"] || 0})
        </button>
        <button
          onClick={() => setQueueFilter("400")}
          className={`px-2.5 py-1 rounded-sm transition-all cursor-pointer ${
            queueFilter === "400"
              ? "bg-sky-600 text-white font-bold"
              : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-sky-400 border border-neutral-200 dark:border-neutral-800"
          }`}
        >
          Normal Draft ({ (queueCounts["400"] || 0) + (queueCounts["430"] || 0) })
        </button>
        <button
          onClick={() => setQueueFilter("450")}
          className={`px-2.5 py-1 rounded-sm transition-all cursor-pointer ${
            queueFilter === "450"
              ? "bg-amber-600 text-white font-bold"
              : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-amber-400 border border-neutral-200 dark:border-neutral-800"
          }`}
        >
          ARAM ({queueCounts["450"] || 0})
        </button>
      </div>

      {/* Content Area */}
      <div className="space-y-2 pt-0.5">
        {isLoading && matches.length === 0 ? (
          <div className="py-16 text-center font-mono">
            <div className="w-6 h-6 border-2 border-riot-red border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-neutral-500">
              Querying Match V5 records from Riot CDN...
            </p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-sm">
            <Shield className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
            <p className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
              No matching games found in current telemetry batch
            </p>
            <p className="text-[11px] font-mono text-neutral-400 mt-1">
              Select another filter or trigger an active sync.
            </p>
          </div>
        ) : (
          paginatedMatches.map((match) => (
            <MatchRow
              key={match.matchId}
              match={match}
              mmrPoint={mmrMap.get(match.matchId)}
              onOpenBreakdown={onOpenBreakdown}
            />
          ))
        )}
      </div>

      {/* Pagination Footer Controls */}
      {filteredMatches.length > 0 && pageSize !== "ALL" && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs font-mono">
          <div className="text-neutral-500 tabular-nums">
            Page <strong className="text-neutral-800 dark:text-neutral-200">{currentPage}</strong> /{" "}
            <strong className="text-neutral-800 dark:text-neutral-200">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-riot-red transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Prev</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg)}
                className={`w-6 h-6 rounded-sm font-bold font-mono transition-all text-xs ${
                  currentPage === pg
                    ? "bg-riot-red text-white"
                    : "bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                {pg}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-riot-red transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>Next</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Load More Matches */}
      {onLoadMore && hasApiKey && (
        <div className="pt-2 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoading || isLoadingMore}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:border-riot-red text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoadingMore ? (
              <>
                <div className="w-3 h-3 border-2 border-riot-red border-t-transparent rounded-full animate-spin" />
                <span>Pulling Records...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-3.5 h-3.5 text-riot-red" />
                <span>Pull 10 Older Matches</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
