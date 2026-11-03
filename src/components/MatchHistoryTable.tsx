import React, { useState } from "react";
import { ParsedMatch } from "../types/riot";
import { MatchRow } from "./MatchRow";
import { History, Shield, CheckCircle2, XCircle } from "lucide-react";

interface MatchHistoryTableProps {
  matches: ParsedMatch[];
  isLoading: boolean;
}

export const MatchHistoryTable: React.FC<MatchHistoryTableProps> = ({ matches, isLoading }) => {
  const [filter, setFilter] = useState<"ALL" | "WIN" | "LOSS">("ALL");

  const filteredMatches = matches.filter((m) => {
    if (filter === "WIN") return m.targetParticipant.win;
    if (filter === "LOSS") return !m.targetParticipant.win;
    return true;
  });

  return (
    <div className="bg-riot-card/80 border border-riot-border rounded-2xl p-5 shadow-lg backdrop-blur-md">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-riot-border/60">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-riot-accent" />
          <h3 className="text-base font-bold text-slate-100 tracking-wide">Recent Matches</h3>
          <span className="text-xs text-slate-400 font-medium">({matches.length} tracked)</span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-riot-darkest p-1 rounded-xl border border-riot-border text-xs font-semibold">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === "ALL"
                ? "bg-riot-surface text-slate-100 border border-riot-border shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("WIN")}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
              filter === "WIN"
                ? "bg-emerald-500/20 text-neon-win border border-emerald-500/40 shadow-neon-win"
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
                ? "bg-rose-500/20 text-neon-loss border border-rose-500/40 shadow-neon-loss"
                : "text-slate-400 hover:text-neon-loss"
            }`}
          >
            <XCircle className="w-3 h-3" />
            <span>Defeats</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-4 space-y-3 max-h-[560px] overflow-y-auto pr-1.5 custom-scrollbar">
        {isLoading && matches.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-riot-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Fetching Match V5 history from Riot servers...</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-riot-border rounded-xl">
            <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No matches found for this filter</p>
            <p className="text-xs text-slate-500 mt-1">Try selecting another filter or fetch fresh matches.</p>
          </div>
        ) : (
          filteredMatches.map((match) => <MatchRow key={match.matchId} match={match} />)
        )}
      </div>
    </div>
  );
};

