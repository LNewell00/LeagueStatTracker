import React, { useState, useMemo } from "react";
import { ParsedMatch } from "../types/riot";
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
} from "lucide-react";

interface MatchHistoryTableProps {
  matches: ParsedMatch[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  hasApiKey?: boolean;
  onOpenBreakdown?: (match: ParsedMatch) => void;
}

export const MatchHistoryTable: React.FC<MatchHistoryTableProps> = ({
  matches,
  isLoading,
  isLoadingMore = false,
  onLoadMore,
  hasApiKey = false,
  onOpenBreakdown,
}) => {
  const [filter, setFilter] = useState<"ALL" | "WIN" | "LOSS">("ALL");
  const [pageSize, setPageSize] = useState<number | "ALL">(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (filter === "WIN") return m.targetParticipant.win;
      if (filter === "LOSS") return !m.targetParticipant.win;
      return true;
    });
  }, [matches, filter]);

  // Reset to page 1 if filter or matches change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, matches.length, pageSize]);

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

  return (
    <div className="bg-riot-card/85 border border-riot-border rounded-2xl p-5 shadow-lg backdrop-blur-md space-y-4">
      {/* Table Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-riot-border/60">
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-riot-accent" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 tracking-wide">
                Recent Matches
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                ({filteredMatches.length} of {matches.length} matches)
              </span>
            </div>
            {filteredMatches.length > 0 && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Showing {startIndex}–{endIndex} of {filteredMatches.length}
              </p>
            )}
          </div>
        </div>

        {/* Filter Controls & Page Size */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          {/* Win / Loss Filter */}
          <div className="flex items-center gap-1 bg-riot-darkest p-1 rounded-xl border border-riot-border text-xs font-semibold">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === "ALL"
                  ? "bg-riot-surface text-slate-100 border border-riot-border shadow-sm font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({matches.length})
            </button>
            <button
              onClick={() => setFilter("WIN")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                filter === "WIN"
                  ? "bg-emerald-500/20 text-neon-win border border-emerald-500/40 shadow-neon-win font-bold"
                  : "text-slate-400 hover:text-neon-win"
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Victories</span>
            </button>
            <button
              onClick={() => setFilter("LOSS")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                filter === "LOSS"
                  ? "bg-rose-500/20 text-neon-loss border border-rose-500/40 shadow-neon-loss font-bold"
                  : "text-slate-400 hover:text-neon-loss"
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>Defeats</span>
            </button>
          </div>

          {/* Page Size Toggle */}
          <div className="flex items-center gap-1 bg-riot-darkest p-1 rounded-xl border border-riot-border text-xs font-semibold">
            <ListFilter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <button
              onClick={() => setPageSize(10)}
              className={`px-2 py-1 rounded-lg transition-all ${
                pageSize === 10
                  ? "bg-riot-accent text-white font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              10/pg
            </button>
            <button
              onClick={() => setPageSize(20)}
              className={`px-2 py-1 rounded-lg transition-all ${
                pageSize === 20
                  ? "bg-riot-accent text-white font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              20/pg
            </button>
            <button
              onClick={() => setPageSize("ALL")}
              className={`px-2 py-1 rounded-lg transition-all ${
                pageSize === "ALL"
                  ? "bg-riot-accent text-white font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Natural Page Flow (No inner nested scroll container!) */}
      <div className="space-y-3 pt-1">
        {isLoading && matches.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-riot-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              Fetching Match V5 history from Riot servers...
            </p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-riot-border rounded-xl">
            <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">
              No matches found for this filter
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Try selecting another filter or fetch fresh matches.
            </p>
          </div>
        ) : (
          paginatedMatches.map((match) => (
            <MatchRow
              key={match.matchId}
              match={match}
              onOpenBreakdown={onOpenBreakdown}
            />
          ))
        )}
      </div>

      {/* Pagination Footer Controls */}
      {filteredMatches.length > 0 && pageSize !== "ALL" && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-riot-border/50 text-xs">
          <div className="text-slate-400 font-mono">
            Page <strong className="text-slate-200">{currentPage}</strong> of{" "}
            <strong className="text-slate-200">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-riot-surface border border-riot-border text-slate-300 hover:text-white hover:border-riot-accent transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg)}
                className={`w-7 h-7 rounded-xl font-bold font-mono transition-all ${
                  currentPage === pg
                    ? "bg-riot-accent text-white shadow-neon-pink"
                    : "bg-riot-surface border border-riot-border text-slate-400 hover:text-slate-200"
                }`}
              >
                {pg}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-riot-surface border border-riot-border text-slate-300 hover:text-white hover:border-riot-accent transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Load More Matches from Riot API */}
      {onLoadMore && hasApiKey && (
        <div className="pt-2 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoading || isLoadingMore}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-riot-surface border border-riot-accent/30 hover:border-riot-accent/70 hover:bg-riot-accent/15 text-riot-accent hover:text-pink-300 text-xs font-bold tracking-wide uppercase shadow-lg shadow-riot-accent/10 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoadingMore ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-riot-accent border-t-transparent rounded-full animate-spin" />
                <span>Pulling More Matches from Riot...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 text-riot-accent" />
                <span>Load 10 Older Matches</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
