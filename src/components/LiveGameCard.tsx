import React, { useState } from "react";
import { LivePollerState, LivePlayer, LiveItem } from "../types/live";
import {
  Activity,
  Clock,
  Zap,
  Shield,
  Swords,
  Coins,
  PlayCircle,
  StopCircle,
  Sparkles,
  Footprints,
  Eye,
  Layers,
} from "lucide-react";
import { getChampionIconUrl } from "../services/ddragon";
import { ItemTooltip } from "./ItemTooltip";

interface LiveGameCardProps {
  liveState: LivePollerState;
  isMockActive: boolean;
  onToggleMock: () => void;
}

// Support & Jungle Quest Item IDs
const QUEST_ITEM_IDS = new Set([
  // 2024 Support quest items & upgrades
  3865, 3866, 3867, 3869, 3870, 3871, 3876, 3877,
  // Older support starters
  3850, 3851, 3853, 3854, 3855, 3857, 3858, 3859, 3860, 3862, 3863, 3864,
  // Jungle Pet companions
  1101, 1102, 1103,
  // Tear stacking quest items
  3070, 3004, 3003, 3119,
]);

// Trinket Item IDs
const TRINKET_ITEM_IDS = new Set([
  3340, // Stealth Ward (Yellow)
  3364, // Oracle Lens (Red)
  3363, // Farsight Alteration (Blue)
]);

// Keystone Styling Map
const KEYSTONE_STYLES: Record<string, { color: string; bg: string; icon: string }> = {
  "Lethal Tempo": { color: "text-amber-300 border-amber-400/40", bg: "bg-amber-500/15", icon: "⚡" },
  "First Strike": { color: "text-yellow-300 border-yellow-400/40", bg: "bg-yellow-500/15", icon: "💰" },
  "Dark Harvest": { color: "text-purple-300 border-purple-400/40", bg: "bg-purple-500/15", icon: "💀" },
  "Conqueror": { color: "text-orange-300 border-orange-400/40", bg: "bg-orange-500/15", icon: "⚔️" },
  "Electrocute": { color: "text-rose-300 border-rose-400/40", bg: "bg-rose-500/15", icon: "⚡" },
  "Hail of Blades": { color: "text-red-300 border-red-400/40", bg: "bg-red-500/15", icon: "🗡️" },
  "Summon Aery": { color: "text-pink-300 border-pink-400/40", bg: "bg-pink-500/15", icon: "✨" },
  "Arcane Comet": { color: "text-cyan-300 border-cyan-400/40", bg: "bg-cyan-500/15", icon: "☄️" },
  "Phase Rush": { color: "text-sky-300 border-sky-400/40", bg: "bg-sky-500/15", icon: "💨" },
  "Grasp of the Undying": { color: "text-emerald-300 border-emerald-400/40", bg: "bg-emerald-500/15", icon: "🛡️" },
  "Aftershock": { color: "text-teal-300 border-teal-400/40", bg: "bg-teal-500/15", icon: "💥" },
  "Fleet Footwork": { color: "text-amber-200 border-amber-300/40", bg: "bg-amber-500/15", icon: "👟" },
  "Press the Attack": { color: "text-orange-300 border-orange-400/40", bg: "bg-orange-500/15", icon: "🎯" },
  "Glacial Augment": { color: "text-cyan-200 border-cyan-300/40", bg: "bg-cyan-500/15", icon: "❄️" },
};

const POSITION_ORDER = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
const POSITION_LABELS: Record<string, string> = {
  TOP: "Top Lane",
  JUNGLE: "Jungle",
  MIDDLE: "Mid Lane",
  BOTTOM: "Bot Carry",
  UTILITY: "Support",
};

export const LiveGameCard: React.FC<LiveGameCardProps> = ({
  liveState,
  isMockActive,
  onToggleMock,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"faceoff" | "personal">("faceoff");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!liveState.isActive || !liveState.data) {
    return (
      <div className="bg-riot-card/60 border border-riot-border/70 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-riot-surface border border-riot-border">
              <span className="absolute w-3 h-3 rounded-full bg-slate-500 animate-ping opacity-75" />
              <Activity className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-200 text-sm tracking-wide">
                  Live Client Radar
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  127.0.0.1:2999
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Listening for active League match... (Works with Practice Tool, Bots, ARAM, and Ranked)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMock}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isMockActive
                  ? "bg-riot-accent/20 border-riot-accent text-riot-accent shadow-neon-pink"
                  : "bg-riot-surface border-riot-border text-slate-300 hover:border-slate-500"
              }`}
            >
              <PlayCircle className="w-4 h-4 text-riot-accent" />
              <span>Simulate 10-Player Live Game</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { activePlayer, allPlayers = [], events, gameData } = liveState.data;

  // Match the active user in allPlayers
  const activeUserInGame =
    allPlayers.find((p) => p.summonerName === activePlayer.summonerName) || allPlayers[0];
  const userTeam = activeUserInGame?.team || "ORDER";
  const userPosition = activeUserInGame?.position || "MIDDLE";

  const orderTeam = allPlayers.filter((p) => p.team === "ORDER");
  const chaosTeam = allPlayers.filter((p) => p.team === "CHAOS");

  const isUserOrder = userTeam === "ORDER";
  const allyTeam = isUserOrder ? orderTeam : chaosTeam;
  const enemyTeam = isUserOrder ? chaosTeam : orderTeam;

  // Calculate estimated gold for each player based on items + kills/assists/CS
  const calculatePlayerGold = (p: LivePlayer): number => {
    const isPlayerSelf = p.summonerName === activePlayer.summonerName;
    const itemsTotal = (p.items || []).reduce((acc, it) => acc + (it.price || 0), 0);
    const scoreGold = (p.scores?.kills || 0) * 300 + (p.scores?.assists || 0) * 100 + (p.scores?.creepScore || 0) * 21;
    if (isPlayerSelf && activePlayer.currentGold !== undefined) {
      return itemsTotal + Math.round(activePlayer.currentGold);
    }
    return itemsTotal + scoreGold;
  };

  const allyTotalGold = allyTeam.reduce((acc, p) => acc + calculatePlayerGold(p), 0);
  const enemyTotalGold = enemyTeam.reduce((acc, p) => acc + calculatePlayerGold(p), 0);
  const teamGoldDiff = allyTotalGold - enemyTotalGold;

  const allyKills = allyTeam.reduce((acc, p) => acc + (p.scores?.kills || 0), 0);
  const enemyKills = enemyTeam.reduce((acc, p) => acc + (p.scores?.kills || 0), 0);

  // Parse Live In-Game Objectives from events.Events
  const allEvents = events?.Events || [];
  const allyDragons = allEvents.filter(
    (e) => e.EventName === "DragonKill" && allyTeam.some((p) => p.summonerName === (e as any).KillerName)
  ).length;
  const enemyDragons = allEvents.filter(
    (e) => e.EventName === "DragonKill" && enemyTeam.some((p) => p.summonerName === (e as any).KillerName)
  ).length;

  const allyTowers = allEvents.filter(
    (e) => e.EventName === "TurretKilled" && allyTeam.some((p) => p.summonerName === (e as any).KillerName)
  ).length;
  const enemyTowers = allEvents.filter(
    (e) => e.EventName === "TurretKilled" && enemyTeam.some((p) => p.summonerName === (e as any).KillerName)
  ).length;

  // Direct 1v1 Lane Opponent
  const laneOpponent =
    enemyTeam.find((p) => p.position === userPosition) ||
    enemyTeam[0];

  const userGold = calculatePlayerGold(activeUserInGame);
  const opponentGold = laneOpponent ? calculatePlayerGold(laneOpponent) : 0;
  const laneGoldDiff = userGold - opponentGold;
  const laneLevelDiff = (activeUserInGame?.level || 1) - (laneOpponent?.level || 1);
  const laneCsDiff = (activeUserInGame?.scores?.creepScore || 0) - (laneOpponent?.scores?.creepScore || 0);

  interface SegregatedItems {
    questItem: LiveItem | null;
    normalItems: LiveItem[];
    trinketItem: LiveItem | null;
  }

  // Helper to separate items into: Quest Item, Regular 6 slots, and Trinket
  const segregatePlayerItems = (rawItems: LiveItem[] = []): SegregatedItems => {
    let questItem: LiveItem | null = null;
    let trinketItem: LiveItem | null = null;
    const normalItems: LiveItem[] = [];

    rawItems.forEach((it) => {
      if (TRINKET_ITEM_IDS.has(it.itemID) || it.slot === 6) {
        trinketItem = it;
      } else if (
        !questItem &&
        (QUEST_ITEM_IDS.has(it.itemID) ||
          it.displayName?.includes("Atlas") ||
          it.displayName?.includes("Compass") ||
          it.displayName?.includes("Bounty") ||
          it.displayName?.includes("Hatchling") ||
          it.displayName?.includes("Seedling") ||
          it.displayName?.includes("Pup"))
      ) {
        questItem = it;
      } else {
        normalItems.push(it);
      }
    });

    return { questItem, normalItems, trinketItem };
  };

  // Helper to render keystones and secondary boots rune
  const renderRuneBadges = (p: LivePlayer) => {
    const rawRunes = (p.runes as any) || {};
    const keystoneName = rawRunes?.keystone?.displayName || "";
    const style = KEYSTONE_STYLES[keystoneName] || {
      color: "text-slate-300 border-slate-500/40",
      bg: "bg-slate-500/10",
      icon: "✨",
    };

    // Check if player has Magical Footwear rune or item
    const hasBootsRune =
      rawRunes?.hasMagicalFootwear ||
      (p.items || []).some((it) => it.itemID === 2422 || it.displayName?.includes("Footwear"));

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {keystoneName && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${style.color} ${style.bg}`}
            title={`Keystone: ${keystoneName}`}
          >
            <span>{style.icon}</span>
            <span>{keystoneName}</span>
          </span>
        )}
        {hasBootsRune && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border text-cyan-300 border-cyan-400/40 bg-cyan-500/15 flex items-center gap-1"
            title="Magical Footwear Rune Active (Free 300g Boots)"
          >
            <Footprints className="w-3 h-3 text-cyan-300" />
            <span>Boots Rune</span>
          </span>
        )}
      </div>
    );
  };

  // Helper to render a player's item row: [QUEST] | [SLOT 1..6] | [TRINKET]
  const renderItemBar = (p: LivePlayer) => {
    const { questItem, normalItems, trinketItem } = segregatePlayerItems(p.items || []);

    return (
      <div className="flex items-center gap-1.5">
        {/* Quest Item Slot (Left) */}
        <div
          className={`w-7 h-7 rounded-lg overflow-hidden border flex items-center justify-center shrink-0 relative ${
            questItem
              ? "border-riot-gold shadow-[0_0_8px_rgba(251,191,36,0.25)] bg-riot-darkest"
              : "border-dashed border-riot-border/50 bg-riot-darkest/40"
          }`}
          title={questItem ? `Quest Item: ${(questItem as LiveItem).displayName}` : "Empty Quest Slot (Support / Jungle)"}
        >
          {questItem ? (
            <ItemTooltip itemId={(questItem as LiveItem).itemID} size="sm" />
          ) : (
            <span className="text-[8px] font-mono text-slate-600 uppercase font-black">Q</span>
          )}
          {questItem && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-riot-gold animate-pulse" />
          )}
        </div>

        <div className="h-5 w-[1px] bg-riot-border/50 mx-0.5" />

        {/* 6 Normal Item Slots (Middle) */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 6 }).map((_, idx) => {
            const it = normalItems[idx];
            return (
              <div
                key={idx}
                className="w-7 h-7 rounded-lg bg-riot-darkest border border-riot-border/70 overflow-hidden flex items-center justify-center shrink-0"
              >
                {it && it.itemID > 0 ? (
                  <ItemTooltip itemId={it.itemID} size="sm" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                )}
              </div>
            );
          })}
        </div>

        <div className="h-5 w-[1px] bg-riot-border/50 mx-0.5" />

        {/* Dedicated Trinket Slot (Right) */}
        <div
          className="w-7 h-7 rounded-full bg-riot-darkest border border-riot-gold/50 overflow-hidden flex items-center justify-center shrink-0"
          title={trinketItem ? `Trinket: ${(trinketItem as LiveItem).displayName}` : "No Trinket"}
        >
          {trinketItem ? (
            <ItemTooltip itemId={(trinketItem as LiveItem).itemID} size="sm" isTrinket />
          ) : (
            <Eye className="w-3 h-3 text-slate-600" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. TOP BANNER: LIVE CLOCK & TEAM OBJECTIVES FACE-OFF       */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-riot-card via-riot-surface to-riot-card border border-pink-500/40 rounded-3xl p-5 shadow-neon-pink relative overflow-hidden transition-all">
        {/* Seraphine Cosmic Glow */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-pink-500/10 via-indigo-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-riot-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-win opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-win"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-neon-win">
                  Live Match Active
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-xs font-semibold text-slate-300">
                  {gameData.gameMode || "Summoner's Rift"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time 10-player radar polling local League client engine
              </p>
            </div>
          </div>

          {/* Sub-tabs & Simulation Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-riot-darkest/80 border border-riot-border/70 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveSubTab("faceoff")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeSubTab === "faceoff"
                    ? "bg-riot-accent text-white shadow-neon-pink"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                10-Player Face-Off
              </button>
              <button
                onClick={() => setActiveSubTab("personal")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeSubTab === "personal"
                    ? "bg-riot-accent text-white shadow-neon-pink"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                My Champion Stats
              </button>
            </div>

            {isMockActive && (
              <button
                onClick={onToggleMock}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold hover:bg-rose-500/20"
                title="Stop Simulation"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>Stop Sim</span>
              </button>
            )}
          </div>
        </div>

        {/* Big Team Face-Off Header (Kills, Gold, Dragons, Towers, Clock) */}
        <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Blue / Order Team Stats */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black uppercase text-slate-100">
                  {isUserOrder ? "Your Team (Blue)" : "Enemy Team (Blue)"}
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {allyTotalGold.toLocaleString()}g
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                <span>Kills: <strong className="text-slate-100">{allyKills}</strong></span>
                <span>•</span>
                <span>🐉 Dragons: <strong className="text-slate-200">{allyDragons}</strong></span>
                <span>•</span>
                <span>🏰 Turrets: <strong className="text-slate-200">{allyTowers}</strong></span>
              </div>
            </div>
          </div>

          {/* Center: Live Clock & Team Gold Diff */}
          <div className="flex flex-col items-center shrink-0">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-riot-darkest border border-riot-border text-sm text-slate-100 font-mono shadow-inner">
              <Clock className="w-4 h-4 text-riot-accent animate-pulse" />
              <span className="font-extrabold tracking-wider">{formatTime(gameData.gameTime || 0)}</span>
            </div>
            <div className="mt-1.5 text-xs font-mono font-bold">
              {teamGoldDiff > 0 ? (
                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  +{teamGoldDiff.toLocaleString()}g Team Lead
                </span>
              ) : teamGoldDiff < 0 ? (
                <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {teamGoldDiff.toLocaleString()}g Team Deficit
                </span>
              ) : (
                <span className="text-slate-400">Even Team Gold</span>
              )}
            </div>
          </div>

          {/* Red / Chaos Team Stats */}
          <div className="flex items-center justify-end gap-4 w-full md:w-auto text-right">
            <div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs font-mono font-bold text-rose-300">
                  {enemyTotalGold.toLocaleString()}g
                </span>
                <span className="text-sm font-black uppercase text-slate-100">
                  {!isUserOrder ? "Your Team (Red)" : "Enemy Team (Red)"}
                </span>
              </div>
              <div className="flex items-center justify-end gap-3 text-xs text-slate-400 mt-1 font-mono">
                <span>🏰 Turrets: <strong className="text-slate-200">{enemyTowers}</strong></span>
                <span>•</span>
                <span>🐉 Dragons: <strong className="text-slate-200">{enemyDragons}</strong></span>
                <span>•</span>
                <span>Kills: <strong className="text-slate-100">{enemyKills}</strong></span>
              </div>
            </div>
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e] shrink-0" />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. FEATURED SPOTLIGHT: 1v1 LANE FACE-OFF                  */}
      {/* ========================================================= */}
      {laneOpponent && (
        <div className="bg-riot-surface/70 border border-riot-accent/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-riot-border/50 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-riot-accent" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">
                Lane Face-Off: {POSITION_LABELS[userPosition] || userPosition} Matchup
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Direct Opponent Telemetry
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
            {/* Left: YOU */}
            <div className="lg:col-span-5 bg-riot-darkest/70 border border-riot-accent/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-riot-accent shrink-0">
                    <img
                      src={getChampionIconUrl(activeUserInGame.championName)}
                      alt={activeUserInGame.championName}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 bg-black/85 text-[9px] font-bold px-1 rounded-tl text-slate-200">
                      Lv {activeUserInGame.level}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-100">
                        {activeUserInGame.championName}
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-riot-accent/20 text-riot-accent border border-riot-accent/30 font-semibold">
                        You
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                      {activeUserInGame.scores.kills} / <span className="text-neon-loss">{activeUserInGame.scores.deaths}</span> / {activeUserInGame.scores.assists} • {activeUserInGame.scores.creepScore} CS
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="text-slate-400 text-[10px]">Net Worth</div>
                  <div className="font-extrabold text-riot-gold text-sm">
                    {userGold.toLocaleString()}g
                  </div>
                </div>
              </div>

              {/* Keystone & Boots Rune */}
              {renderRuneBadges(activeUserInGame)}

              {/* Items Bar */}
              <div className="pt-1">{renderItemBar(activeUserInGame)}</div>
            </div>

            {/* Center: VERSUS & DIFFERENTIAL PILL */}
            <div className="lg:col-span-1 flex flex-col items-center justify-center gap-2 py-2">
              <div className="w-10 h-10 rounded-full bg-riot-surface border border-riot-border flex items-center justify-center font-black text-xs text-riot-accent shadow-neon-pink">
                VS
              </div>
              <div className="flex flex-col items-center gap-1 font-mono text-[11px] font-bold">
                {laneGoldDiff > 0 ? (
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-center">
                    +{laneGoldDiff.toLocaleString()}g
                  </span>
                ) : laneGoldDiff < 0 ? (
                  <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-center">
                    {laneGoldDiff.toLocaleString()}g
                  </span>
                ) : (
                  <span className="text-slate-400">Even Gold</span>
                )}

                {laneLevelDiff > 0 ? (
                  <span className="text-emerald-300 text-[10px]">+{laneLevelDiff} Lv Ahead</span>
                ) : laneLevelDiff < 0 ? (
                  <span className="text-rose-300 text-[10px]">{laneLevelDiff} Lv Behind</span>
                ) : (
                  <span className="text-slate-400 text-[10px]">Even Lv</span>
                )}

                {laneCsDiff !== 0 ? (
                  <span className={`text-[10px] ${laneCsDiff > 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {laneCsDiff > 0 ? `+${laneCsDiff} CS` : `${laneCsDiff} CS`}
                  </span>
                ) : (
                  <span className="text-slate-400 text-[10px]">Even CS</span>
                )}
              </div>
            </div>

            {/* Right: OPPONENT */}
            <div className="lg:col-span-5 bg-riot-darkest/70 border border-riot-border/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-rose-500/60 shrink-0">
                    <img
                      src={getChampionIconUrl(laneOpponent.championName)}
                      alt={laneOpponent.championName}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 bg-black/85 text-[9px] font-bold px-1 rounded-tl text-slate-200">
                      Lv {laneOpponent.level}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-100">
                        {laneOpponent.championName}
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                        Opponent
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                      {laneOpponent.scores.kills} / <span className="text-neon-loss">{laneOpponent.scores.deaths}</span> / {laneOpponent.scores.assists} • {laneOpponent.scores.creepScore} CS
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="text-slate-400 text-[10px]">Net Worth</div>
                  <div className="font-extrabold text-slate-200 text-sm">
                    {opponentGold.toLocaleString()}g
                  </div>
                </div>
              </div>

              {/* Keystone & Boots Rune */}
              {renderRuneBadges(laneOpponent)}

              {/* Items Bar */}
              <div className="pt-1">{renderItemBar(laneOpponent)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. FULL 5v5 TEAM ROSTER FACE-OFF                          */}
      {/* ========================================================= */}
      {activeSubTab === "faceoff" ? (
        <div className="bg-riot-surface/60 border border-riot-border rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-riot-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-riot-accent" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">
                5v5 Role Matchup Matrix
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                Your Team (Blue)
              </span>
              <span>vs</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Enemy Team (Red)
              </span>
            </div>
          </div>

          {/* Lane by lane matchups */}
          <div className="space-y-3">
            {POSITION_ORDER.map((pos) => {
              const allyPlayer = allyTeam.find((p) => p.position === pos) || allyTeam[0];
              const enemyPlayer = enemyTeam.find((p) => p.position === pos) || enemyTeam[0];

              if (!allyPlayer || !enemyPlayer) return null;

              const isUserLane = allyPlayer.summonerName === activePlayer.summonerName;
              const aGold = calculatePlayerGold(allyPlayer);
              const eGold = calculatePlayerGold(enemyPlayer);
              const gDiff = aGold - eGold;
              const lDiff = allyPlayer.level - enemyPlayer.level;

              return (
                <div
                  key={pos}
                  className={`rounded-2xl border transition-all p-3 flex flex-col xl:flex-row items-center justify-between gap-4 ${
                    isUserLane
                      ? "bg-riot-card/90 border-riot-accent shadow-neon-pink"
                      : "bg-riot-darkest/60 border-riot-border/60 hover:border-riot-border"
                  }`}
                >
                  {/* Ally Player (Left) */}
                  <div className="flex items-center justify-between w-full xl:w-5/12 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-cyan-400/50 shrink-0">
                        <img
                          src={getChampionIconUrl(allyPlayer.championName)}
                          alt={allyPlayer.championName}
                          className={`w-full h-full object-cover ${allyPlayer.isDead ? "grayscale" : ""}`}
                        />
                        <span className="absolute bottom-0 right-0 bg-black/85 text-[8px] font-bold px-1 rounded-tl text-slate-200">
                          {allyPlayer.level}
                        </span>
                        {allyPlayer.isDead && (
                          <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-[10px] font-mono font-black text-rose-400">
                            {allyPlayer.respawnTimer}s
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-100">
                            {allyPlayer.championName}
                          </span>
                          {isUserLane && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-riot-accent/20 text-riot-accent font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {allyPlayer.scores.kills}/{allyPlayer.scores.deaths}/{allyPlayer.scores.assists} • {aGold.toLocaleString()}g
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {renderRuneBadges(allyPlayer)}
                      {renderItemBar(allyPlayer)}
                    </div>
                  </div>

                  {/* Center Matchup Pill (Lane Role, Gold Diff, Level Diff) */}
                  <div className="flex flex-col items-center justify-center shrink-0 w-28 py-1">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 bg-riot-surface border border-riot-border/60 px-2 py-0.5 rounded-full">
                      {POSITION_LABELS[pos] || pos}
                    </span>
                    <div className="text-[10px] font-mono font-bold mt-1">
                      {gDiff > 0 ? (
                        <span className="text-emerald-400">+{gDiff.toLocaleString()}g</span>
                      ) : gDiff < 0 ? (
                        <span className="text-rose-400">{gDiff.toLocaleString()}g</span>
                      ) : (
                        <span className="text-slate-500">Even</span>
                      )}
                      {lDiff !== 0 && (
                        <span className={`ml-1 ${lDiff > 0 ? "text-emerald-300" : "text-rose-300"}`}>
                          ({lDiff > 0 ? `+${lDiff}` : lDiff} Lv)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Enemy Player (Right) */}
                  <div className="flex items-center justify-between w-full xl:w-5/12 gap-3">
                    <div className="flex flex-col items-start gap-1">
                      {renderRuneBadges(enemyPlayer)}
                      {renderItemBar(enemyPlayer)}
                    </div>

                    <div className="flex items-center justify-end gap-3 text-right">
                      <div>
                        <div className="text-xs font-bold text-slate-100">
                          {enemyPlayer.championName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {enemyPlayer.scores.kills}/{enemyPlayer.scores.deaths}/{enemyPlayer.scores.assists} • {eGold.toLocaleString()}g
                        </div>
                      </div>

                      <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-rose-500/50 shrink-0">
                        <img
                          src={getChampionIconUrl(enemyPlayer.championName)}
                          alt={enemyPlayer.championName}
                          className={`w-full h-full object-cover ${enemyPlayer.isDead ? "grayscale" : ""}`}
                        />
                        <span className="absolute bottom-0 right-0 bg-black/85 text-[8px] font-bold px-1 rounded-tl text-slate-200">
                          {enemyPlayer.level}
                        </span>
                        {enemyPlayer.isDead && (
                          <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-[10px] font-mono font-black text-rose-400">
                            {enemyPlayer.respawnTimer}s
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* 4. PERSONAL LIVE COMBAT ATTRIBUTES                        */
        /* ========================================================= */
        <div className="bg-riot-surface/60 border border-riot-border rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-riot-border/50 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-riot-accent" />
              <span>Active Combat Attributes</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Live Engine Memory Snapshot
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-riot-darkest/70 border border-riot-border/70 flex items-center gap-3">
              <Coins className="w-4 h-4 text-riot-gold shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400">Current Gold</div>
                <div className="font-extrabold text-riot-gold text-sm">
                  {Math.round(activePlayer.currentGold || 0)}g
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-riot-darkest/70 border border-riot-border/70 flex items-center gap-3">
              <Swords className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400">Attack Damage / AP</div>
                <div className="font-extrabold text-slate-100 text-sm">
                  {Math.round(activePlayer.championStats?.attackDamage || 0)} AD / {Math.round(activePlayer.championStats?.abilityPower || 0)} AP
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-riot-darkest/70 border border-riot-border/70 flex items-center gap-3">
              <Shield className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400">Armor / Magic Resist</div>
                <div className="font-extrabold text-slate-100 text-sm">
                  {Math.round(activePlayer.championStats?.armor || 0)} / {Math.round(activePlayer.championStats?.magicResist || 0)}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-riot-darkest/70 border border-riot-border/70 flex items-center gap-3">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400">Ability Haste</div>
                <div className="font-extrabold text-slate-100 text-sm">
                  {Math.round(activePlayer.championStats?.abilityHaste || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
