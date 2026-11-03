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
  TrendingUp,
  TrendingDown,
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

// Keystone Acronyms for compact tabular display
const KEYSTONE_ACRONYMS: Record<string, string> = {
  "Lethal Tempo": "LT",
  "First Strike": "FS",
  "Dark Harvest": "DH",
  "Conqueror": "CONQ",
  "Electrocute": "ELEC",
  "Hail of Blades": "HOB",
  "Summon Aery": "AERY",
  "Arcane Comet": "COMET",
  "Phase Rush": "PR",
  "Grasp of the Undying": "GRASP",
  "Aftershock": "AFTER",
  "Fleet Footwork": "FLEET",
  "Press the Attack": "PTA",
  "Glacial Augment": "GLACIAL",
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
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e1117] rounded p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
              <Activity className="w-4 h-4 animate-pulse text-riot-red" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 text-xs font-mono uppercase tracking-wider">
                  Live Match Telemetry
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-300 dark:border-neutral-700">
                  PORT 2999
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
                Awaiting active match handshake... (Practice Tool, Bots, ARAM, Ranked)
              </p>
            </div>
          </div>

          <button
            onClick={onToggleMock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
              isMockActive
                ? "bg-riot-red text-white border-riot-red shadow-sm"
                : "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600"
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5 text-riot-red" />
            <span>Simulate Match Stream</span>
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

  // Team objective scores
  const blueKills = blueTeam.reduce((acc, p) => acc + (p.scores?.kills || 0), 0);
  const redKills = redTeam.reduce((acc, p) => acc + (p.scores?.kills || 0), 0);

  const blueDragons = (events?.Events || []).filter(
    (e: any) => e.EventName === "DragonKill" && blueTeam.some((bp) => bp.summonerName === e.KillerName)
  ).length;
  const redDragons = (events?.Events || []).filter(
    (e: any) => e.EventName === "DragonKill" && redTeam.some((rp) => rp.summonerName === e.KillerName)
  ).length;

  const blueTowers = (events?.Events || []).filter(
    (e: any) => e.EventName === "TurretKilled" && blueTeam.some((bp) => bp.summonerName === e.KillerName)
  ).length;
  const redTowers = (events?.Events || []).filter(
    (e: any) => e.EventName === "TurretKilled" && redTeam.some((rp) => rp.summonerName === e.KillerName)
  ).length;

  // Segregate Items: [Quest Item] | [6 Normal Items] | [Trinket]
  const segregatePlayerItems = (items: LiveItem[]): {
    questItem: LiveItem | null;
    normalItems: LiveItem[];
    trinketItem: LiveItem | null;
  } => {
    let questItem: LiveItem | null = null;
    let trinketItem: LiveItem | null = null;
    const normalItems: LiveItem[] = [];

    items.forEach((it) => {
      if (TRINKET_ITEM_IDS.has(it.itemID) || it.displayName?.toLowerCase().includes("ward") || it.displayName?.toLowerCase().includes("lens")) {
        if (!trinketItem) trinketItem = it;
        else normalItems.push(it);
      } else if (QUEST_ITEM_IDS.has(it.itemID) || it.displayName?.toLowerCase().includes("atlas") || it.displayName?.toLowerCase().includes("bounty") || it.displayName?.toLowerCase().includes("companion")) {
        if (!questItem) questItem = it;
        else normalItems.push(it);
      } else {
        normalItems.push(it);
      }
    });

    return { questItem, normalItems, trinketItem };
  };

  const renderRuneBadges = (p: LivePlayer) => {
    const rawRunes = (p.runes as any) || {};
    const keystoneName = rawRunes?.keystone?.displayName || "";
    const acronym = KEYSTONE_ACRONYMS[keystoneName] || keystoneName.slice(0, 4).toUpperCase();

    const hasBootsRune =
      rawRunes?.hasMagicalFootwear ||
      (p.items || []).some((it) => it.itemID === 2422 || it.displayName?.includes("Footwear"));

    return (
      <div className="flex items-center gap-1 shrink-0 font-mono">
        {keystoneName && (
          <span
            className="text-[9px] font-bold px-1 py-0.5 rounded-sm border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 select-none"
            title={`Keystone: ${keystoneName}`}
          >
            {acronym}
          </span>
        )}
        {hasBootsRune && (
          <span
            className="text-[9px] font-bold px-1 py-0.5 rounded-sm border border-blue-400/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-0.5 select-none"
            title="Magical Footwear"
          >
            <Footprints className="w-2.5 h-2.5" />
          </span>
        )}
      </div>
    );
  };

  const renderItemBar = (p: LivePlayer) => {
    const { questItem, normalItems, trinketItem } = segregatePlayerItems(p.items || []);

    return (
      <div className="flex items-center gap-1 shrink-0">
        {/* Quest Item Slot */}
        <div
          className={`w-6 h-6 rounded-sm overflow-hidden border flex items-center justify-center shrink-0 relative ${
            questItem
              ? "border-amber-500/70 bg-amber-500/10"
              : "border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-100/50 dark:bg-neutral-900/50"
          }`}
          title={questItem ? `Quest: ${(questItem as LiveItem).displayName}` : "Quest Slot"}
        >
          {questItem ? (
            <ItemTooltip itemId={(questItem as LiveItem).itemID} size="xs" />
          ) : (
            <span className="text-[8px] font-mono text-neutral-400 font-bold">Q</span>
          )}
        </div>

        {/* 6 Normal Inventory Slots */}
        <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-900 p-0.5 rounded-sm border border-neutral-200 dark:border-neutral-800">
          {Array.from({ length: 6 }).map((_, idx) => {
            const item = normalItems[idx];
            return (
              <div
                key={idx}
                className="w-6 h-6 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700/70 bg-white dark:bg-[#141721] flex items-center justify-center shrink-0"
              >
                {item ? (
                  <ItemTooltip itemId={item.itemID} size="xs" />
                ) : (
                  <div className="w-full h-full bg-transparent" />
                )}
              </div>
            );
          })}
        </div>

        {/* Dedicated Trinket Slot */}
        <div
          className={`w-6 h-6 rounded-sm overflow-hidden border flex items-center justify-center shrink-0 relative ${
            trinketItem
              ? "border-neutral-400 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800"
              : "border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-100/50 dark:bg-neutral-900/50"
          }`}
          title={trinketItem ? `Trinket: ${(trinketItem as LiveItem).displayName}` : "Trinket Slot"}
        >
          {trinketItem ? (
            <ItemTooltip itemId={(trinketItem as LiveItem).itemID} size="xs" />
          ) : (
            <Eye className="w-2.5 h-2.5 text-neutral-400" />
          )}
        </div>
      </div>
    );
  };

  const totalTeamGoldSum = Math.max(1, blueTotalGold + redTotalGold);
  const blueGoldSharePercent = Math.round((blueTotalGold / totalTeamGoldSum) * 100);

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0e14] rounded shadow-sm overflow-hidden">
      {/* ========================================================= */}
      {/* 1. FINANCIAL ANALYTICS HEADER STRIP                       */}
      {/* ========================================================= */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#11141c] px-4 py-2.5 flex items-center justify-between gap-4">
        {/* BLUE TEAM (ORDER) */}
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-7 bg-blue-600 rounded-none shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                BLUE TEAM {isUserOrder && "(YOU)"}
              </span>
              <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {blueTotalGold.toLocaleString()}g
              </span>
            </div>
            <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
              <span>K: <strong className="text-neutral-900 dark:text-neutral-200">{blueKills}</strong></span>
              <span>•</span>
              <span>🐉 {blueDragons}</span>
              <span>•</span>
              <span>🏰 {blueTowers}</span>
            </div>
          </div>
        </div>

        {/* CENTER: MARKET CLOCK & GOLD DELTA TICKER */}
        <div className="flex flex-col items-center shrink-0 min-w-[200px]">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-900 dark:text-neutral-100 font-bold">
            <Clock className="w-3.5 h-3.5 text-riot-red" />
            <span className="tracking-wider text-sm">{formatTime(gameData.gameTime || 0)}</span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono font-bold tabular-nums">
            {teamGoldDiff > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/30">
                <TrendingUp className="w-3 h-3" />
                +{(teamGoldDiff).toLocaleString()}g Blue Advantage
              </span>
            ) : teamGoldDiff < 0 ? (
              <span className="text-riot-red flex items-center gap-0.5 bg-riot-red/10 px-2 py-0.5 rounded-sm border border-riot-red/30">
                <TrendingDown className="w-3 h-3" />
                +{Math.abs(teamGoldDiff).toLocaleString()}g Red Advantage
              </span>
            ) : (
              <span className="text-neutral-500 bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-sm">
                PARITY (0g DIFF)
              </span>
            )}
          </div>

          {/* Mini Gold Balance Bar */}
          <div className="w-36 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-none overflow-hidden mt-1.5 flex">
            <div style={{ width: `${blueGoldSharePercent}%` }} className="bg-blue-600 h-full" />
            <div style={{ width: `${100 - blueGoldSharePercent}%` }} className="bg-riot-red h-full" />
          </div>
        </div>

        {/* RED TEAM (CHAOS) */}
        <div className="flex items-center justify-end gap-3 text-right">
          <div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {redTotalGold.toLocaleString()}g
              </span>
              <span className="text-xs font-mono font-black uppercase tracking-wider text-riot-red">
                RED TEAM {!isUserOrder && "(YOU)"}
              </span>
            </div>
            <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-end gap-2 mt-0.5">
              <span>🏰 {redTowers}</span>
              <span>•</span>
              <span>🐉 {redDragons}</span>
              <span>•</span>
              <span>K: <strong className="text-neutral-900 dark:text-neutral-200">{redKills}</strong></span>
            </div>
          </div>
          <div className="w-1.5 h-7 bg-riot-red rounded-none shrink-0" />

          {isMockActive && (
            <button
              onClick={onToggleMock}
              className="ml-2 flex items-center gap-1 px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px] font-mono font-bold hover:bg-riot-red hover:text-white transition-all"
              title="Stop Simulation"
            >
              <StopCircle className="w-3 h-3" />
              <span>STOP</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MATCHUP MATRIX TABLE (INTEGRATED SINGLE-SCREEN)         */}
      {/* ========================================================= */}
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800/80">
        {/* Table Column Sub-header */}
        <div className="bg-neutral-100/70 dark:bg-[#141722] px-3 py-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400 select-none">
          <div className="flex-1">Order Roster & Equipment</div>
          <div className="w-24 text-center">Lane Delta</div>
          <div className="flex-1 text-right">Chaos Roster & Equipment</div>
        </div>

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
          const csDiff = (bluePlayer.scores?.creepScore || 0) - (redPlayer.scores?.creepScore || 0);

          return (
            <div
              key={pos}
              className={`px-3 py-2 flex items-center justify-between gap-3 transition-colors ${
                isUserLane
                  ? "bg-neutral-100/90 dark:bg-[#141824] border-l-2 border-l-riot-red"
                  : "hover:bg-neutral-50 dark:hover:bg-[#11141d]"
              }`}
            >
              {/* ================= BLUE PLAYER (LEFT) ================= */}
              <div className="flex items-center justify-between flex-1 gap-2">
                {/* Avatar & Ident */}
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 shrink-0 bg-neutral-900">
                    <img
                      src={getChampionIconUrl(bluePlayer.championName)}
                      alt={bluePlayer.championName}
                      className={`w-full h-full object-cover ${bluePlayer.isDead ? "grayscale opacity-60" : ""}`}
                    />
                    <span className="absolute bottom-0 right-0 bg-neutral-950 text-[8px] font-mono font-bold px-0.5 text-neutral-200">
                      {bluePlayer.level}
                    </span>
                    {bluePlayer.isDead && (
                      <div className="absolute inset-0 bg-neutral-950/80 flex items-center justify-center text-[8px] font-mono font-black text-riot-red">
                        {bluePlayer.respawnTimer}s
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {bluePlayer.championName}
                      </span>
                      {isUserBlue && (
                        <span className="text-[8px] px-1 py-0.2 rounded-sm bg-riot-red text-white font-mono font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                      {bluePlayer.scores.kills}/{bluePlayer.scores.deaths}/{bluePlayer.scores.assists} • {bluePlayer.scores.creepScore}cs • <strong className="text-neutral-900 dark:text-neutral-200">{bGold.toLocaleString()}g</strong>
                    </div>
                  </div>
                </div>

                {/* Keystone & Items */}
                <div className="flex items-center gap-1.5">
                  {renderRuneBadges(bluePlayer)}
                  {renderItemBar(bluePlayer)}
                </div>
              </div>

              {/* ================= CENTER DELTA TICKER ================= */}
              <div className="flex flex-col items-center justify-center shrink-0 w-24 py-0.5 font-mono select-none">
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-sm bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {POSITION_SHORT_LABELS[pos] || pos}
                </span>

                {/* Gold Delta Pill */}
                <div className="text-[10px] font-bold mt-1 tabular-nums">
                  {gDiff > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ▲ +{gDiff.toLocaleString()}g
                    </span>
                  ) : gDiff < 0 ? (
                    <span className="text-riot-red">
                      ▼ -{Math.abs(gDiff).toLocaleString()}g
                    </span>
                  ) : (
                    <span className="text-neutral-400">0g</span>
                  )}
                </div>

                {/* Level & CS Delta */}
                <div className="text-[9px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5 tabular-nums">
                  <span>
                    {lDiff > 0 ? `+${lDiff}L` : lDiff < 0 ? `${lDiff}L` : "0L"}
                  </span>
                  <span>•</span>
                  <span>
                    {csDiff > 0 ? `+${csDiff}cs` : csDiff < 0 ? `${csDiff}cs` : "0cs"}
                  </span>
                </div>
              </div>

              {/* ================= RED PLAYER (RIGHT) ================= */}
              <div className="flex items-center justify-between flex-1 gap-2 flex-row-reverse text-right">
                {/* Avatar & Ident */}
                <div className="flex items-center gap-2.5 flex-row-reverse text-right">
                  <div className="relative w-8 h-8 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 shrink-0 bg-neutral-900">
                    <img
                      src={getChampionIconUrl(redPlayer.championName)}
                      alt={redPlayer.championName}
                      className={`w-full h-full object-cover ${redPlayer.isDead ? "grayscale opacity-60" : ""}`}
                    />
                    <span className="absolute bottom-0 left-0 bg-neutral-950 text-[8px] font-mono font-bold px-0.5 text-neutral-200">
                      {redPlayer.level}
                    </span>
                    {redPlayer.isDead && (
                      <div className="absolute inset-0 bg-neutral-950/80 flex items-center justify-center text-[8px] font-mono font-black text-riot-red">
                        {redPlayer.respawnTimer}s
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-end gap-1.5">
                      {isUserRed && (
                        <span className="text-[8px] px-1 py-0.2 rounded-sm bg-riot-red text-white font-mono font-bold">
                          YOU
                        </span>
                      )}
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {redPlayer.championName}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                      <strong className="text-neutral-900 dark:text-neutral-200">{rGold.toLocaleString()}g</strong> • {redPlayer.scores.creepScore}cs • {redPlayer.scores.kills}/{redPlayer.scores.deaths}/{redPlayer.scores.assists}
                    </div>
                  </div>
                </div>

                {/* Keystone & Items */}
                <div className="flex items-center gap-1.5 flex-row-reverse">
                  {renderRuneBadges(redPlayer)}
                  {renderItemBar(redPlayer)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 3. DOCKED BOTTOM TELEMETRY BAR                            */}
      {/* ========================================================= */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#11141c] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-neutral-500 dark:text-neutral-400">Current Wallet:</span>
          <strong className="text-neutral-900 dark:text-neutral-100 tabular-nums">
            {Math.round(activePlayer.currentGold || 0).toLocaleString()}g
          </strong>
        </div>

        <div className="flex items-center gap-4 text-[11px] tabular-nums">
          <div className="flex items-center gap-1" title="Attack Damage / Ability Power">
            <Swords className="w-3 h-3 text-riot-red" />
            <span className="text-neutral-500 dark:text-neutral-400">AD/AP:</span>
            <strong className="text-neutral-800 dark:text-neutral-200">
              {Math.round(activePlayer.championStats?.attackDamage || 0)} / {Math.round(activePlayer.championStats?.abilityPower || 0)}
            </strong>
          </div>

          <div className="flex items-center gap-1" title="Armor / Magic Resist">
            <Shield className="w-3 h-3 text-blue-500" />
            <span className="text-neutral-500 dark:text-neutral-400">Armor/MR:</span>
            <strong className="text-neutral-800 dark:text-neutral-200">
              {Math.round(activePlayer.championStats?.armor || 0)} / {Math.round(activePlayer.championStats?.magicResist || 0)}
            </strong>
          </div>

          <div className="flex items-center gap-1" title="Ability Haste">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-neutral-500 dark:text-neutral-400">AH:</span>
            <strong className="text-neutral-800 dark:text-neutral-200">
              {Math.round(activePlayer.championStats?.abilityHaste || 0)}
            </strong>
          </div>

          <div className="flex items-center gap-1" title="Movement Speed">
            <Footprints className="w-3 h-3 text-neutral-400" />
            <span className="text-neutral-500 dark:text-neutral-400">MS:</span>
            <strong className="text-neutral-800 dark:text-neutral-200">
              {Math.round(activePlayer.championStats?.moveSpeed || 0)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
