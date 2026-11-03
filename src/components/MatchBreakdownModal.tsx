import React, { useEffect, useState, useCallback } from "react";
import { ParsedMatch, MatchParticipant } from "../types/riot";
import { ParsedTimeline } from "../types/timeline";
import {
  getChampionIconUrl,
  getItemIconUrl,
  getSummonerSpellIconUrl,
} from "../services/ddragon";
import {
  fetchMatchTimeline,
  parseMatchTimeline,
  timelineMemoryCache,
  fetchMatchDetail,
  parseRawMatch,
} from "../services/riotApi";
import { generateFallbackTimeline } from "../services/timelineFallback";
import { GoldLeadGraph } from "./timeline/GoldLeadGraph";
import { SkillOrderView } from "./timeline/SkillOrderView";
import { KillMap } from "./timeline/KillMap";
import {
  X,
  Trophy,
  Eye,
  Clock,
  Heart,
  Swords,
  Crosshair,
  Flame,
  TrendingUp,
  MapPin,
  Zap,
  RefreshCw,
  Loader2,
  Info,
} from "lucide-react";

interface MatchBreakdownModalProps {
  match: ParsedMatch | null;
  onClose: () => void;
  apiKey?: string;
  regionalRouting?: string;
  onMatchUpdated?: (updatedMatch: ParsedMatch) => void;
}

type ModalTab = "overview" | "timeline" | "killmap" | "skillorder";

export const MatchBreakdownModal: React.FC<MatchBreakdownModalProps> = ({
  match,
  onClose,
  apiKey,
  regionalRouting,
  onMatchUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>("overview");
  const [timeline, setTimeline] = useState<ParsedTimeline | null>(null);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [isRefreshingMatch, setIsRefreshingMatch] = useState(false);
  const [timelineNotice, setTimelineNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Load or fetch timeline
  const loadTimeline = useCallback(
    async (targetMatch: ParsedMatch, forceRefresh: boolean = false) => {
      if (!targetMatch) return;

      const matchId = targetMatch.matchId;

      if (!forceRefresh && timelineMemoryCache[matchId]) {
        setTimeline(timelineMemoryCache[matchId]);
        return;
      }

      setIsLoadingTimeline(true);
      setTimelineNotice(null);

      if (apiKey && regionalRouting) {
        try {
          const rawTimeline = await fetchMatchTimeline(matchId, regionalRouting, apiKey);
          const parsed = parseMatchTimeline(rawTimeline, targetMatch);
          if (parsed) {
            timelineMemoryCache[matchId] = parsed;
            setTimeline(parsed);
            setIsLoadingTimeline(false);
            return;
          }
        } catch (err: any) {
          console.warn("Riot Timeline API fetch failed, falling back to match reconstruction:", err);
          setTimelineNotice(
            "Note: Loaded high-fidelity reconstructed timeline (Riot API rate limit or timeline endpoint unavailable)."
          );
        }
      }

      // Fallback: Generate timeline from match data
      const fallback = generateFallbackTimeline(targetMatch);
      timelineMemoryCache[matchId] = fallback;
      setTimeline(fallback);
      setIsLoadingTimeline(false);
    },
    [apiKey, regionalRouting]
  );

  // If match has missing extended combat fields (e.g. from an older cache version), auto-refresh
  const refreshMatchDetailData = useCallback(
    async (targetMatch: ParsedMatch) => {
      if (!apiKey || !regionalRouting || isRefreshingMatch) return;
      setIsRefreshingMatch(true);
      try {
        const raw = await fetchMatchDetail(targetMatch.matchId, regionalRouting, apiKey);
        if (raw) {
          const updated = parseRawMatch(raw, targetMatch.targetParticipant.puuid);
          if (updated && onMatchUpdated) {
            onMatchUpdated(updated);
          }
        }
      } catch (err) {
        console.warn("Failed to refresh match details:", err);
      } finally {
        setIsRefreshingMatch(false);
      }
    },
    [apiKey, regionalRouting, onMatchUpdated, isRefreshingMatch]
  );

  useEffect(() => {
    if (match) {
      loadTimeline(match);
      // Auto-heal if cached match lacked physical damage breakdown
      if (
        match.targetParticipant.physicalDamageDealtToChampions === undefined &&
        apiKey &&
        regionalRouting
      ) {
        refreshMatchDetailData(match);
      }
    }
  }, [match?.matchId]);

  if (!match) return null;

  const target = match.targetParticipant;
  const isWin = target.win;
  const durationMin = Math.floor(match.gameDuration / 60);
  const durationSec = Math.floor(match.gameDuration % 60);

  const blueTeam = match.allParticipants.filter((p) => p.teamId === 100);
  const redTeam = match.allParticipants.filter((p) => p.teamId === 200);

  const blueTotalDamage = blueTeam.reduce((acc, p) => acc + p.totalDamageDealtToChampions, 0) || 1;
  const redTotalDamage = redTeam.reduce((acc, p) => acc + p.totalDamageDealtToChampions, 0) || 1;

  const blueTotalKills = blueTeam.reduce((acc, p) => acc + p.kills, 0);
  const redTotalKills = redTeam.reduce((acc, p) => acc + p.kills, 0);

  // Damage distribution percentages
  const physicalDmg = target.physicalDamageDealtToChampions || 0;
  const magicDmg = target.magicDamageDealtToChampions || 0;
  const trueDmg = target.trueDamageDealtToChampions || 0;
  const totalDmg = Math.max(1, target.totalDamageDealtToChampions);

  const isLegacyDamageMissing =
    physicalDmg === 0 && magicDmg === 0 && trueDmg === 0 && target.totalDamageDealtToChampions > 0;

  const physicalPct = isLegacyDamageMissing ? 0 : Math.round((physicalDmg / totalDmg) * 100);
  const magicPct = isLegacyDamageMissing ? 0 : Math.round((magicDmg / totalDmg) * 100);
  const truePct = isLegacyDamageMissing ? 0 : Math.round((trueDmg / totalDmg) * 100);

  const renderTeamTable = (
    team: MatchParticipant[],
    teamName: string,
    teamColor: "blue" | "red",
    teamDamage: number,
    teamKills: number
  ) => {
    const isTeamWin = team.length > 0 && team[0].win;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-riot-surface/90 border border-riot-border">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                teamColor === "blue"
                  ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                  : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
              }`}
            />
            <span className="text-xs font-black uppercase tracking-wider text-slate-200">
              {teamName}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isTeamWin
                  ? "bg-emerald-500/20 text-neon-win border border-emerald-500/30"
                  : "bg-rose-500/20 text-neon-loss border border-rose-500/30"
              }`}
            >
              {isTeamWin ? "VICTORY" : "DEFEAT"}
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Total Kills: <span className="font-bold text-slate-100">{teamKills}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-riot-border/50">
                <th className="py-2 px-2.5">Champion</th>
                <th className="py-2 px-2.5">KDA</th>
                <th className="py-2 px-2.5">Damage</th>
                <th className="py-2 px-2.5">Wards</th>
                <th className="py-2 px-2.5">CS</th>
                <th className="py-2 px-2.5">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-riot-border/30">
              {team.map((p) => {
                const isTarget = p.puuid === target.puuid;
                const dmgPct = Math.round((p.totalDamageDealtToChampions / teamDamage) * 100);
                const items = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5];

                return (
                  <tr
                    key={p.puuid}
                    className={`transition-colors ${
                      isTarget
                        ? "bg-riot-accent/15 border-l-2 border-riot-accent font-medium"
                        : "hover:bg-riot-surface/40"
                    }`}
                  >
                    {/* Champion & Summoner */}
                    <td className="py-2 px-2.5">
                      <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-riot-border shrink-0">
                          <img
                            src={getChampionIconUrl(p.championName)}
                            alt={p.championName}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 text-[8px] bg-black/80 font-bold px-0.5 rounded-tl text-slate-300">
                            {p.champLevel}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 max-w-[110px] truncate">
                          <span
                            className={`text-xs truncate ${
                              isTarget ? "text-riot-accent font-bold" : "text-slate-200"
                            }`}
                          >
                            {p.riotIdGameName || p.summonerName}
                          </span>
                          <div className="flex items-center gap-1">
                            {p.summoner1Id > 0 && (
                              <img
                                src={getSummonerSpellIconUrl(p.summoner1Id)}
                                alt="Spell 1"
                                className="w-3 h-3 rounded"
                              />
                            )}
                            {p.summoner2Id > 0 && (
                              <img
                                src={getSummonerSpellIconUrl(p.summoner2Id)}
                                alt="Spell 2"
                                className="w-3 h-3 rounded"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* KDA */}
                    <td className="py-2 px-2.5 font-mono whitespace-nowrap">
                      <span className="text-slate-100 font-bold">{p.kills}</span>/
                      <span className="text-rose-400 font-bold">{p.deaths}</span>/
                      <span className="text-slate-300 font-bold">{p.assists}</span>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {p.kda.toFixed(2)}:1
                      </div>
                    </td>

                    {/* Damage */}
                    <td className="py-2 px-2.5 min-w-[120px]">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-0.5">
                        <span>{p.totalDamageDealtToChampions.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500">{dmgPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-riot-darkest rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            teamColor === "blue"
                              ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                              : "bg-gradient-to-r from-rose-500 to-pink-500"
                          }`}
                          style={{ width: `${Math.min(100, dmgPct * 2.5)}%` }}
                        />
                      </div>
                    </td>

                    {/* Vision */}
                    <td className="py-2 px-2.5 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      <div>{p.visionScore} score</div>
                      <div className="text-[10px] text-slate-500">
                        {p.wardsPlaced}w / {p.wardsKilled}k
                      </div>
                    </td>

                    {/* CS */}
                    <td className="py-2 px-2.5 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      <div>{p.cs} CS</div>
                      <div className="text-[10px] text-slate-500">{p.csPerMin.toFixed(1)}/m</div>
                    </td>

                    {/* Items */}
                    <td className="py-2 px-2.5">
                      <div className="flex items-center gap-0.5">
                        {items.map((it, idx) => (
                          <div
                            key={idx}
                            className="w-5 h-5 rounded bg-riot-darkest/90 border border-riot-border/70 overflow-hidden shrink-0"
                          >
                            {it > 0 && (
                              <img
                                src={getItemIconUrl(it)}
                                alt={`Item ${it}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                        {/* Trinket */}
                        <div className="w-5 h-5 rounded-full bg-riot-darkest/90 border border-riot-gold/40 overflow-hidden shrink-0 ml-1">
                          {p.item6 > 0 && (
                            <img
                              src={getItemIconUrl(p.item6)}
                              alt="Trinket"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-riot-card border border-riot-border w-full max-w-5xl max-h-[94vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Top Header Banner */}
        <div
          className={`px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b ${
            isWin
              ? "border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-riot-surface to-riot-surface"
              : "border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-riot-surface to-riot-surface"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-riot-gold/80 shadow-neon-gold shrink-0">
              <img
                src={getChampionIconUrl(target.championName)}
                alt={target.championName}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 bg-black/80 text-[10px] font-bold px-1 rounded-tl text-slate-200">
                Lv{target.champLevel}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-sm font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                    isWin
                      ? "bg-emerald-500/20 text-neon-win border border-emerald-500/40"
                      : "bg-rose-500/20 text-neon-loss border border-rose-500/40"
                  }`}
                >
                  {isWin ? "Victory" : "Defeat"}
                </span>
                <h2 className="text-lg font-bold text-slate-100">
                  {target.championName} Full Match Breakdown
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                <span className="font-sans text-slate-300">{match.gameMode}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {durationMin}m {durationSec}s
                </span>
                <span>•</span>
                <span>
                  KDA: <strong className="text-slate-100">{target.kills}</strong>/
                  <strong className="text-rose-400">{target.deaths}</strong>/
                  <strong className="text-slate-200">{target.assists}</strong> ({target.kda.toFixed(2)})
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons (Refresh & Close) */}
          <div className="flex items-center gap-2">
            {apiKey && regionalRouting && (
              <button
                onClick={() => {
                  refreshMatchDetailData(match);
                  loadTimeline(match, true);
                }}
                disabled={isRefreshingMatch || isLoadingTimeline}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-riot-surface border border-riot-border text-slate-300 hover:text-white hover:border-riot-accent transition-all disabled:opacity-50"
                title="Refresh complete match details & timeline from Riot API"
              >
                {isRefreshingMatch || isLoadingTimeline ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-riot-accent" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-riot-accent" />
                )}
                <span>Refresh Data</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation Bar */}
        <div className="px-6 py-2.5 bg-riot-surface/90 border-b border-riot-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "overview"
                  ? "bg-riot-accent text-white shadow-neon-pink"
                  : "text-slate-400 hover:text-slate-200 hover:bg-riot-surface"
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              Combat & Scoreboard
            </button>

            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "timeline"
                  ? "bg-riot-accent text-white shadow-neon-pink"
                  : "text-slate-400 hover:text-slate-200 hover:bg-riot-surface"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Gold & XP Lead Graph
            </button>

            <button
              onClick={() => setActiveTab("killmap")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "killmap"
                  ? "bg-riot-accent text-white shadow-neon-pink"
                  : "text-slate-400 hover:text-slate-200 hover:bg-riot-surface"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Summoner's Rift Kill Map
            </button>

            <button
              onClick={() => setActiveTab("skillorder")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "skillorder"
                  ? "bg-riot-accent text-white shadow-neon-pink"
                  : "text-slate-400 hover:text-slate-200 hover:bg-riot-surface"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Skill Level-Up Order
            </button>
          </div>

          {isLoadingTimeline && (
            <div className="flex items-center gap-1.5 text-xs text-riot-accent font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading Match Timeline...
            </div>
          )}
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {timelineNotice && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-riot-surface border border-riot-border text-xs text-slate-300 font-mono">
              <Info className="w-4 h-4 text-riot-gold shrink-0" />
              <span>{timelineNotice}</span>
            </div>
          )}

          {/* TAB 1: Combat & Scoreboard Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in">
              {/* Key Metric Highlights Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Multi-kills & Combat */}
                <div className="bg-riot-surface/70 border border-riot-border rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase font-semibold mb-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Multikill Milestones</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(target.pentaKills || 0) > 0 && (
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-neon-gold">
                        PENTAKILL
                      </span>
                    )}
                    {(target.quadraKills || 0) > 0 && (
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/40">
                        QUADRA
                      </span>
                    )}
                    {(target.tripleKills || 0) > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        TRIPLE
                      </span>
                    )}
                    {(target.doubleKills || 0) > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        DOUBLE (x{target.doubleKills})
                      </span>
                    )}
                    {target.firstBloodKill && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        FIRST BLOOD
                      </span>
                    )}
                    {!(
                      target.doubleKills ||
                      target.tripleKills ||
                      target.quadraKills ||
                      target.pentaKills ||
                      target.firstBloodKill
                    ) && (
                      <span className="text-xs text-slate-500 italic">No multikills this game</span>
                    )}
                  </div>
                </div>

                {/* Support & Utility */}
                <div className="bg-riot-surface/70 border border-riot-border rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase font-semibold mb-2">
                    <Heart className="w-4 h-4 text-pink-400" />
                    <span>Ally Support & Utility</span>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Ally Shields:</span>
                      <strong className="text-pink-300">
                        {(target.totalDamageShieldedOnTeammates || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Ally Heals:</span>
                      <strong className="text-emerald-300">
                        {(target.totalHealsOnTeammates || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>CC Dealt:</span>
                      <strong className="text-indigo-300">{target.timeCCingOthers || 0}s</strong>
                    </div>
                  </div>
                </div>

                {/* Vision Control */}
                <div className="bg-riot-surface/70 border border-riot-border rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase font-semibold mb-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>Vision Control</span>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Vision Score:</span>
                      <strong className="text-cyan-300">{target.visionScore}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Control Wards:</span>
                      <strong className="text-riot-gold">{target.controlWardsPlaced}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Placed / Killed:</span>
                      <strong className="text-slate-200">
                        {target.wardsPlaced} / {target.wardsKilled}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Objectives & Economy */}
                <div className="bg-riot-surface/70 border border-riot-border rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase font-semibold mb-2">
                    <Trophy className="w-4 h-4 text-riot-gold" />
                    <span>Objectives & Gold</span>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Objective Dmg:</span>
                      <strong className="text-amber-300">
                        {(target.damageDealtToObjectives || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Turret Dmg:</span>
                      <strong className="text-amber-200">
                        {(target.damageDealtToTurrets || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Total Gold:</span>
                      <strong className="text-riot-gold">
                        {target.goldEarned.toLocaleString()}g
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Damage Composition Split */}
              <div className="bg-riot-surface/60 border border-riot-border rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-riot-accent" />
                    Damage Type Breakdown
                  </span>
                  <span className="font-mono text-slate-300">
                    Total: <strong className="text-slate-100">{totalDmg.toLocaleString()}</strong>{" "}
                    to champions
                  </span>
                </div>

                {isLegacyDamageMissing ? (
                  <div className="py-2 px-3 rounded-xl bg-riot-surface/80 border border-riot-border text-xs text-slate-300 flex items-center justify-between">
                    <span>
                      Legacy cached match: physical/magic/true split not captured in older save.
                    </span>
                    {apiKey && regionalRouting && (
                      <button
                        onClick={() => refreshMatchDetailData(match)}
                        disabled={isRefreshingMatch}
                        className="px-2.5 py-1 rounded-lg bg-riot-accent/20 border border-riot-accent/40 text-riot-accent font-bold hover:bg-riot-accent hover:text-white transition-all"
                      >
                        {isRefreshingMatch ? "Fetching..." : "Fetch Split"}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Tri-color progress bar */}
                    <div className="w-full h-3 bg-riot-darkest rounded-full overflow-hidden flex shadow-inner">
                      <div
                        className="h-full bg-orange-500 transition-all"
                        style={{ width: `${physicalPct}%` }}
                        title={`Physical Damage: ${physicalDmg.toLocaleString()} (${physicalPct}%)`}
                      />
                      <div
                        className="h-full bg-cyan-400 transition-all"
                        style={{ width: `${magicPct}%` }}
                        title={`Magic Damage: ${magicDmg.toLocaleString()} (${magicPct}%)`}
                      />
                      <div
                        className="h-full bg-white transition-all"
                        style={{ width: `${truePct}%` }}
                        title={`True Damage: ${trueDmg.toLocaleString()} (${truePct}%)`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        Physical: {physicalDmg.toLocaleString()} ({physicalPct}%)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        Magic: {magicDmg.toLocaleString()} ({magicPct}%)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-white" />
                        True: {trueDmg.toLocaleString()} ({truePct}%)
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* 10-Player Comparative Scoreboards */}
              <div className="space-y-6 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-riot-accent" />
                  10-Player Comparative Scoreboard
                </h3>
                {renderTeamTable(blueTeam, "Blue Team", "blue", blueTotalDamage, blueTotalKills)}
                {renderTeamTable(redTeam, "Red Team", "red", redTotalDamage, redTotalKills)}
              </div>
            </div>
          )}

          {/* TAB 2: Minute-by-Minute Gold & XP Lead */}
          {activeTab === "timeline" && timeline && (
            <div className="animate-in fade-in">
              <GoldLeadGraph
                timeline={timeline}
                targetChampionName={target.championName}
              />
            </div>
          )}

          {/* TAB 3: Summoner's Rift Kill Map */}
          {activeTab === "killmap" && timeline && (
            <div className="animate-in fade-in">
              <KillMap
                kills={timeline.kills}
                targetChampionName={target.championName}
              />
            </div>
          )}

          {/* TAB 4: Skill Level-Up Order */}
          {activeTab === "skillorder" && timeline && (
            <div className="animate-in fade-in">
              <SkillOrderView
                skillLevelUps={timeline.skillLevelUps}
                championName={target.championName}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
