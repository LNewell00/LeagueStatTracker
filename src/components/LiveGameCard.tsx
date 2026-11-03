import React from "react";
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
  Footprints,
  Eye,
  Crosshair,
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
  3865, 3866, 3867, 3869, 3870, 3871, 3876, 3877,
  3850, 3851, 3853, 3854, 3855, 3857, 3858, 3859, 3860, 3862, 3863, 3864,
  1101, 1102, 1103,
  3070, 3004, 3003, 3119,
]);

// Trinket Item IDs
const TRINKET_ITEM_IDS = new Set([3340, 3364, 3363]);

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
const POSITION_SHORT_LABELS: Record<string, string> = {
  TOP: "TOP",
  JUNGLE: "JGL",
  MIDDLE: "MID",
  BOTTOM: "BOT",
  UTILITY: "SUP",
};

export const LiveGameCard: React.FC<LiveGameCardProps> = ({
  liveState,
  isMockActive,
  onToggleMock,
}) => {
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
                Listening for active League match... (Practice Tool, AI Bots, ARAM, and Ranked supported)
              </p>
            </div>
          </div>

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
    );
  }

  const { activePlayer, allPlayers = [], events, gameData } = liveState.data;

  // Active user in game
  const activeUserInGame =
    allPlayers.find((p) => p.summonerName === activePlayer.summonerName) || allPlayers[0];
  const userTeam = activeUserInGame?.team || "ORDER";

  const orderTeam = allPlayers.filter((p) => p.team === "ORDER");
  const chaosTeam = allPlayers.filter((p) => p.team === "CHAOS");

  const isUserOrder = userTeam === "ORDER";
  const blueTeam = isUserOrder ? orderTeam : chaosTeam;
  const redTeam = isUserOrder ? chaosTeam : orderTeam;

  // Gold calculation
  const calculatePlayerGold = (p: LivePlayer): number => {
    const isPlayerSelf = p.summonerName === activePlayer.summonerName;
    const itemsTotal = (p.items || []).reduce((acc, it) => acc + (it.price || 0), 0);
    const scoreGold = (p.scores?.kills || 0) * 300 + (p.scores?.assists || 0) * 100 + (p.scores?.creepScore || 0) * 21;
    if (isPlayerSelf && activePlayer.currentGold !== undefined) {
      return itemsTotal + Math.round(activePlayer.currentGold);
    }
    return itemsTotal + scoreGold;
  };

  const blueTotalGold = blueTeam.reduce((acc, p) => acc + calculatePlayerGold(p), 0);
  const redTotalGold = redTeam.reduce((acc, p) => acc + calculatePlayerGold(p), 0);
  const teamGoldDiff = blueTotalGold - redTotalGold;

  const blueKills = blueTeam.reduce((acc, p) => acc + (p.scores?.kills || 0), 0);
  const redKills = redTeam.reduce((acc, p) => acc + (p.scores?.kills || 0), 0);

  // Objectives from events.Events
  const allEvents = events?.Events || [];
  const blueDragons = allEvents.filter(
    (e) => e.EventName === "DragonKill" && blueTeam.some((p) => p.summonerName === (e as any).KillerName)
  ).length;
  const redDragons = allEvents.filter(
    (e) => e.EventName === "DragonKill" && redTeam.some((p) => p.summonerName === (e as any).KillerName)
  ).length;

  const blueTowers = allEvents.filter(
    (e) => e.EventName === "TurretKilled" && blueTeam.some((p) => p.summonerName === (e as any).KillerName)
  ).length;
  const redTowers = allEvents.filter(
    (e) => e.EventName === "TurretKilled" && redTeam.some((p) => p.summonerName === (e as any).KillerName)
  ).length;

  interface SegregatedItems {
    questItem: LiveItem | null;
    normalItems: LiveItem[];
    trinketItem: LiveItem | null;
  }

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

  const renderRuneBadges = (p: LivePlayer) => {
    const rawRunes = (p.runes as any) || {};
    const keystoneName = rawRunes?.keystone?.displayName || "";
    const style = KEYSTONE_STYLES[keystoneName] || {
      color: "text-slate-300 border-slate-500/40",
      bg: "bg-slate-500/10",
      icon: "✨",
    };

    const hasBootsRune =
      rawRunes?.hasMagicalFootwear ||
      (p.items || []).some((it) => it.itemID === 2422 || it.displayName?.includes("Footwear"));

    return (
      <div className="flex items-center gap-1 shrink-0">
        {keystoneName && (
          <span
            className={`text-[9px] font-bold px-1 py-0.2 rounded border flex items-center gap-0.5 ${style.color} ${style.bg}`}
            title={`Keystone: ${keystoneName}`}
          >
            <span>{style.icon}</span>
            <span className="truncate max-w-[55px]">{keystoneName}</span>
          </span>
        )}
        {hasBootsRune && (
          <span
            className="text-[9px] font-bold px-1 py-0.2 rounded border text-cyan-300 border-cyan-400/40 bg-cyan-500/15 flex items-center gap-0.5 shrink-0"
            title="Magical Footwear Active"
          >
            <Footprints className="w-2.5 h-2.5 text-cyan-300" />
            <span>Boots</span>
          </span>
        )}
      </div>
    );
  };

  const renderItemBar = (p: LivePlayer) => {
    const { questItem, normalItems, trinketItem } = segregatePlayerItems(p.items || []);

    return (
      <div className="flex items-center gap-1 shrink-0">
        {/* Quest Item Slot (Left) */}
        <div
          className={`w-6 h-6 rounded-md overflow-hidden border flex items-center justify-center shrink-0 relative ${
            questItem
              ? "border-riot-gold bg-riot-darkest shadow-[0_0_6px_rgba(251,191,36,0.3)]"
              : "border-dashed border-slate-700/60 bg-riot-darkest/40"
          }`}
          title={questItem ? `Quest Item: ${(questItem as LiveItem).displayName}` : "Quest Slot"}
        >
          {questItem ? (
            <ItemTooltip itemId={(questItem as LiveItem).itemID} size="xs" />
          ) : (
            <span className="text-[7px] font-mono text-slate-600 font-bold">Q</span>
          )}
        </div>

        <div className="h-4 w-[1px] bg-slate-700/50" />

        {/* 6 Normal Slots */}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 6 }).map((_, idx) => {
            const it = normalItems[idx];
            return (
              <div
                key={idx}
                className="w-6 h-6 rounded-md bg-riot-darkest border border-riot-border/70 overflow-hidden flex items-center justify-center shrink-0"
              >
                {it && it.itemID > 0 ? (
                  <ItemTooltip itemId={it.itemID} size="xs" />
                ) : (
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                )}
              </div>
            );
          })}
        </div>

        <div className="h-4 w-[1px] bg-slate-700/50" />

        {/* Dedicated Trinket Slot (Right) */}
        <div
          className="w-6 h-6 rounded-full bg-riot-darkest border border-riot-gold/50 overflow-hidden flex items-center justify-center shrink-0"
          title={trinketItem ? `Trinket: ${(trinketItem as LiveItem).displayName}` : "No Trinket"}
        >
          {trinketItem ? (
            <ItemTooltip itemId={(trinketItem as LiveItem).itemID} size="xs" isTrinket />
          ) : (
            <Eye className="w-2.5 h-2.5 text-slate-600" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2.5">
      {/* ========================================================= */}
      {/* 1. TOP COMPACT BAR: BLUE TEAM vs RED TEAM + OBJECTIVES     */}
      {/* ========================================================= */}
      <div className="rounded-2xl border border-riot-border/80 bg-riot-darkest/95 p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        {/* BLUE TEAM SCORE (LEFT) */}
        <div className="flex items-center gap-3 bg-cyan-950/40 border border-cyan-500/40 px-3.5 py-1.5 rounded-xl shadow-[0_0_12px_rgba(34,211,238,0.15)]">
          <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                🔷 BLUE TEAM {isUserOrder && "(YOU)"}
              </span>
              <span className="text-xs font-mono font-bold text-cyan-200">
                {blueTotalGold.toLocaleString()}g
              </span>
            </div>
            <div className="text-[11px] font-mono text-cyan-200/80 flex items-center gap-2">
              <span>Kills: <strong className="text-white">{blueKills}</strong></span>
              <span>•</span>
              <span>🐉 {blueDragons}</span>
              <span>•</span>
              <span>🏰 {blueTowers}</span>
            </div>
          </div>
        </div>

        {/* CENTER: LIVE CLOCK & GOLD LEAD PILL */}
        <div className="flex flex-col items-center shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-riot-surface border border-riot-border text-xs text-slate-100 font-mono">
            <span className="w-2 h-2 rounded-full bg-neon-win animate-ping shrink-0" />
            <Clock className="w-3.5 h-3.5 text-riot-accent" />
            <strong className="tracking-wider text-sm">{formatTime(gameData.gameTime || 0)}</strong>
          </div>
          <div className="mt-1 text-[11px] font-mono font-bold">
            {teamGoldDiff > 0 ? (
              <span className="text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30">
                +{(teamGoldDiff).toLocaleString()}g Blue Lead
              </span>
            ) : teamGoldDiff < 0 ? (
              <span className="text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30">
                +{Math.abs(teamGoldDiff).toLocaleString()}g Red Lead
              </span>
            ) : (
              <span className="text-slate-400">Even Gold</span>
            )}
          </div>
        </div>

        {/* RED TEAM SCORE (RIGHT) */}
        <div className="flex items-center justify-end gap-3 bg-rose-950/40 border border-rose-500/40 px-3.5 py-1.5 rounded-xl text-right shadow-[0_0_12px_rgba(244,63,94,0.15)]">
          <div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs font-mono font-bold text-rose-200">
                {redTotalGold.toLocaleString()}g
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                🔴 RED TEAM {!isUserOrder && "(YOU)"}
              </span>
            </div>
            <div className="text-[11px] font-mono text-rose-200/80 flex items-center justify-end gap-2">
              <span>🏰 {redTowers}</span>
              <span>•</span>
              <span>🐉 {redDragons}</span>
              <span>•</span>
              <span>Kills: <strong className="text-white">{redKills}</strong></span>
            </div>
          </div>
          <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] shrink-0" />
        </div>

        {isMockActive && (
          <button
            onClick={onToggleMock}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold hover:bg-rose-500/25 transition-all"
            title="Stop Simulation"
          >
            <StopCircle className="w-3 h-3" />
            <span>Stop Sim</span>
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. 5-ROW COMPACT MATCHUP MATRIX (ZERO SCROLL FIT)         */}
      {/* ========================================================= */}
      <div className="space-y-1.5">
        {POSITION_ORDER.map((pos) => {
          const bluePlayer = blueTeam.find((p) => p.position === pos) || blueTeam[0];
          const redPlayer = redTeam.find((p) => p.position === pos) || redTeam[0];

          if (!bluePlayer || !redPlayer) return null;

          const isUserBlue = bluePlayer.summonerName === activePlayer.summonerName;
          const isUserRed = redPlayer.summonerName === activePlayer.summonerName;
          const isUserLane = isUserBlue || isUserRed;

          const bGold = calculatePlayerGold(bluePlayer);
          const rGold = calculatePlayerGold(redPlayer);
          const gDiff = bGold - rGold;
          const lDiff = bluePlayer.level - redPlayer.level;

          return (
            <div
              key={pos}
              className={`rounded-xl border transition-all p-2 flex items-center justify-between gap-2.5 ${
                isUserLane
                  ? "bg-riot-card/95 border-riot-accent shadow-[0_0_15px_rgba(236,72,153,0.25)] ring-1 ring-riot-accent/40"
                  : "bg-riot-darkest/80 border-riot-border/60 hover:border-slate-600"
              }`}
            >
              {/* ================= BLUE PLAYER (LEFT) ================= */}
              <div className="flex items-center justify-between flex-1 gap-2 bg-gradient-to-r from-cyan-950/40 via-cyan-950/20 to-transparent p-1.5 rounded-lg border-l-2 border-l-cyan-400">
                {/* Champion Avatar & Identity */}
                <div className="flex items-center gap-2">
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-cyan-400/60 shrink-0">
                    <img
                      src={getChampionIconUrl(bluePlayer.championName)}
                      alt={bluePlayer.championName}
                      className={`w-full h-full object-cover ${bluePlayer.isDead ? "grayscale" : ""}`}
                    />
                    <span className="absolute bottom-0 right-0 bg-black/85 text-[8px] font-bold px-0.5 rounded-tl text-cyan-200">
                      {bluePlayer.level}
                    </span>
                    {bluePlayer.isDead && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-[9px] font-mono font-black text-rose-400">
                        {bluePlayer.respawnTimer}s
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-100">
                        {bluePlayer.championName}
                      </span>
                      {isUserBlue && (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {bluePlayer.scores.kills}/{bluePlayer.scores.deaths}/{bluePlayer.scores.assists} • {bluePlayer.scores.creepScore}cs • <strong className="text-cyan-300">{bGold.toLocaleString()}g</strong>
                    </div>
                  </div>
                </div>

                {/* Keystone & Items */}
                <div className="flex items-center gap-1.5">
                  {renderRuneBadges(bluePlayer)}
                  {renderItemBar(bluePlayer)}
                </div>
              </div>

              {/* ================= CENTER MATCHUP PILL ================= */}
              <div className="flex flex-col items-center justify-center shrink-0 w-20 py-0.5">
                <span className="text-[9px] uppercase font-black tracking-wider text-slate-300 bg-riot-surface border border-riot-border px-1.5 py-0.2 rounded">
                  {POSITION_SHORT_LABELS[pos] || pos}
                </span>
                <div className="text-[10px] font-mono font-bold mt-0.5">
                  {gDiff > 0 ? (
                    <span className="text-cyan-300">+{gDiff.toLocaleString()}g</span>
                  ) : gDiff < 0 ? (
                    <span className="text-rose-300">{gDiff.toLocaleString()}g</span>
                  ) : (
                    <span className="text-slate-500">Even</span>
                  )}
                  {lDiff !== 0 && (
                    <span className={`ml-1 text-[9px] ${lDiff > 0 ? "text-cyan-300" : "text-rose-300"}`}>
                      {lDiff > 0 ? `+${lDiff}L` : `${lDiff}L`}
                    </span>
                  )}
                </div>
              </div>

              {/* ================= RED PLAYER (RIGHT) ================= */}
              <div className="flex items-center justify-between flex-1 gap-2 bg-gradient-to-l from-rose-950/40 via-rose-950/20 to-transparent p-1.5 rounded-lg border-r-2 border-r-rose-500 text-right">
                {/* Keystone & Items */}
                <div className="flex items-center gap-1.5">
                  {renderItemBar(redPlayer)}
                  {renderRuneBadges(redPlayer)}
                </div>

                {/* Champion Avatar & Identity */}
                <div className="flex items-center justify-end gap-2">
                  <div>
                    <div className="flex items-center justify-end gap-1.5">
                      {isUserRed && (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                          YOU
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-100">
                        {redPlayer.championName}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      <strong className="text-rose-300">{rGold.toLocaleString()}g</strong> • {redPlayer.scores.creepScore}cs • {redPlayer.scores.kills}/{redPlayer.scores.deaths}/{redPlayer.scores.assists}
                    </div>
                  </div>

                  <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-rose-500/60 shrink-0">
                    <img
                      src={getChampionIconUrl(redPlayer.championName)}
                      alt={redPlayer.championName}
                      className={`w-full h-full object-cover ${redPlayer.isDead ? "grayscale" : ""}`}
                    />
                    <span className="absolute bottom-0 right-0 bg-black/85 text-[8px] font-bold px-0.5 rounded-tl text-rose-200">
                      {redPlayer.level}
                    </span>
                    {redPlayer.isDead && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-[9px] font-mono font-black text-rose-400">
                        {redPlayer.respawnTimer}s
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 3. COMPACT FOOTER STRIP: YOUR LIVE COMBAT ATTRIBUTES       */}
      {/* ========================================================= */}
      <div className="rounded-xl border border-riot-border/70 bg-riot-darkest/90 px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-inner">
        <div className="flex items-center gap-1.5 text-slate-300 font-sans font-bold text-[11px]">
          <Crosshair className="w-3.5 h-3.5 text-riot-accent" />
          <span>{activeUserInGame?.championName} Attributes:</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] flex-wrap">
          <div className="flex items-center gap-1" title="Current Wallet Gold">
            <Coins className="w-3 h-3 text-riot-gold" />
            <span className="text-slate-400">Gold:</span>
            <strong className="text-riot-gold">{Math.round(activePlayer.currentGold || 0)}g</strong>
          </div>

          <div className="flex items-center gap-1" title="Attack Damage / Ability Power">
            <Swords className="w-3 h-3 text-rose-400" />
            <span className="text-slate-400">AD/AP:</span>
            <strong className="text-slate-200">
              {Math.round(activePlayer.championStats?.attackDamage || 0)} / {Math.round(activePlayer.championStats?.abilityPower || 0)}
            </strong>
          </div>

          <div className="flex items-center gap-1" title="Armor / Magic Resist">
            <Shield className="w-3 h-3 text-sky-400" />
            <span className="text-slate-400">Armor/MR:</span>
            <strong className="text-slate-200">
              {Math.round(activePlayer.championStats?.armor || 0)} / {Math.round(activePlayer.championStats?.magicResist || 0)}
            </strong>
          </div>

          <div className="flex items-center gap-1" title="Ability Haste">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-slate-400">AH:</span>
            <strong className="text-slate-200">{Math.round(activePlayer.championStats?.abilityHaste || 0)}</strong>
          </div>

          <div className="flex items-center gap-1" title="Movement Speed">
            <Footprints className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">MS:</span>
            <strong className="text-slate-200">{Math.round(activePlayer.championStats?.moveSpeed || 0)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
