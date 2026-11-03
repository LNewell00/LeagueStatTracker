import React, { useState } from "react";
import { ParsedMatch, MatchParticipant } from "../types/riot";
import {
  getChampionIconUrl,
  getSummonerSpellIconUrl,
} from "../services/ddragon";
import { ItemTooltip } from "./ItemTooltip";
import {
  Eye,
  Flame,
  ChevronDown,
  ChevronUp,
  Crown,
  BarChart2,
} from "lucide-react";

interface MatchRowProps {
  match: ParsedMatch;
  onOpenBreakdown?: (match: ParsedMatch) => void;
}

export const MatchRow: React.FC<MatchRowProps> = ({ match, onOpenBreakdown }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const p = match.targetParticipant;
  const isWin = p.win;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getKdaBadge = (kda: number) => {
    if (kda >= 5.0) return "text-amber-500 dark:text-amber-400 font-bold";
    if (kda >= 3.0) return "text-emerald-600 dark:text-emerald-400 font-bold";
    return "text-neutral-600 dark:text-neutral-400 font-semibold";
  };

  const getQueueName = (queueId?: number, gameMode?: string): string => {
    switch (queueId) {
      case 420:
        return "Ranked Solo";
      case 440:
        return "Ranked Flex";
      case 400:
        return "Normal Draft";
      case 430:
        return "Normal Blind";
      case 450:
        return "ARAM";
      case 490:
        return "Quickplay";
      case 700:
        return "Clash";
      case 830:
      case 840:
      case 850:
        return "Co-op vs AI";
      case 0:
        return "Custom";
      default:
        if (gameMode === "PRACTICETOOL") return "Practice Tool";
        if (gameMode === "ARAM") return "ARAM";
        if (gameMode === "CHERRY") return "Arena";
        if (gameMode === "CLASSIC") return "Normal";
        return gameMode ? gameMode.charAt(0) + gameMode.slice(1).toLowerCase() : "Match";
    }
  };

  const items = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5];

  const blueTeam = (match.allParticipants || []).filter((x) => x.teamId === 100);
  const redTeam = (match.allParticipants || []).filter((x) => x.teamId === 200);
  const bluePlayers = blueTeam.length > 0 ? blueTeam : [p];
  const redPlayers = redTeam.length > 0 ? redTeam : [];

  const maxDamage = Math.max(
    1,
    ...(match.allParticipants || []).map((x) => x.totalDamageDealtToChampions || 0)
  );

  const blueTeamStats = match.teams?.find((t) => t.teamId === 100);
  const redTeamStats = match.teams?.find((t) => t.teamId === 200);

  return (
    <div
      className={`border rounded transition-all duration-150 overflow-hidden ${
        isWin
          ? "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e1118]"
          : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e1118]"
      }`}
    >
      {/* Main Collapsed Card */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative px-4 py-2.5 flex flex-col xl:flex-row items-center justify-between gap-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#121622] transition-colors select-none"
      >
        {/* Crisp Left Edge Indicator */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${
            isWin ? "bg-emerald-500" : "bg-riot-red"
          }`}
        />

        {/* Section 1: Win/Loss status, queue & duration */}
        <div className="flex items-center gap-3 w-full xl:w-40 font-mono">
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[11px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                  isWin
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-riot-red/10 text-riot-red border border-riot-red/30"
                }`}
              >
                {isWin ? "Victory" : "Defeat"}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {getQueueName(match.queueId, match.gameMode)}
              </span>
              <div className="text-[10px] text-neutral-400">
                {formatDuration(match.gameDuration)} • {formatTimeAgo(match.gameCreation)}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Champion Portrait, Spells & Level */}
        <div className="flex items-center gap-2.5 w-full xl:w-44">
          <div className="relative">
            <div className="w-10 h-10 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-900">
              <img
                src={getChampionIconUrl(p.championName)}
                alt={p.championName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-neutral-900 border border-neutral-700 text-neutral-200 text-[8px] font-mono font-bold px-0.5 rounded-sm">
              {p.champLevel}
            </span>
          </div>

          {/* Summoner Spells */}
          <div className="flex flex-col gap-0.5">
            <div className="w-4 h-4 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-900">
              <img
                src={getSummonerSpellIconUrl(p.summoner1Id)}
                alt="Spell 1"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-4 h-4 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-900">
              <img
                src={getSummonerSpellIconUrl(p.summoner2Id)}
                alt="Spell 2"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
              <span>{p.championName}</span>
              {p.turretKills > 0 && (
                <span title={`${p.turretKills} Turrets`}>
                  <Crown className="w-3 h-3 text-amber-500" />
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
              CS {p.cs} <span className="text-neutral-400">({p.csPerMin}/m)</span>
            </div>
          </div>
        </div>

        {/* Section 3: KDA & Score */}
        <div className="flex flex-col items-center xl:items-start w-full xl:w-28 font-mono tabular-nums">
          <div className="text-xs font-black text-neutral-900 dark:text-neutral-100">
            {p.kills} / <span className="text-riot-red">{p.deaths}</span> / {p.assists}
          </div>
          <div className={`text-[10px] mt-0.5 ${getKdaBadge(p.kda)}`}>
            {p.kda}:1 <span className="text-[9px] text-neutral-400 font-normal">KDA</span>
          </div>
        </div>

        {/* Section 4: Items Grid */}
        <div className="flex items-center gap-1 w-full xl:w-auto">
          {items.map((itemId, idx) => (
            <ItemTooltip key={idx} itemId={itemId} size="sm" />
          ))}
          <div className="ml-0.5">
            <ItemTooltip itemId={p.item6} size="sm" isTrinket />
          </div>
        </div>

        {/* Section 5: Stats (Damage & Vision) */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-mono tabular-nums text-neutral-500 dark:text-neutral-400 border-l border-neutral-200 dark:border-neutral-800 pl-3">
          <div className="flex items-center gap-1" title="Damage to champions">
            <Flame className="w-3 h-3 text-riot-red" />
            <span>{p.totalDamageDealtToChampions.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1" title="Vision score">
            <Eye className="w-3 h-3 text-neutral-400" />
            <span>{p.visionScore}</span>
          </div>
        </div>

        {/* Section 6: Mini Rosters */}
        {match.allParticipants && match.allParticipants.length > 0 && (
          <div className="hidden lg:flex items-center gap-2.5 border-l border-neutral-200 dark:border-neutral-800 pl-3">
            <div className="space-y-0.5">
              {bluePlayers.slice(0, 5).map((pl) => (
                <div key={pl.puuid} className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-900 shrink-0">
                    <img
                      src={getChampionIconUrl(pl.championName)}
                      alt={pl.championName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span
                    className={`text-[9px] font-mono truncate max-w-[60px] ${
                      pl.puuid === p.puuid ? "text-riot-red font-bold" : "text-neutral-500"
                    }`}
                  >
                    {pl.riotIdGameName || pl.summonerName}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-0.5">
              {redPlayers.slice(0, 5).map((pl) => (
                <div key={pl.puuid} className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-900 shrink-0">
                    <img
                      src={getChampionIconUrl(pl.championName)}
                      alt={pl.championName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span
                    className={`text-[9px] font-mono truncate max-w-[60px] ${
                      pl.puuid === p.puuid ? "text-riot-red font-bold" : "text-neutral-500"
                    }`}
                  >
                    {pl.riotIdGameName || pl.summonerName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 7: Action Controls */}
        <div className="flex items-center gap-2 shrink-0 ml-auto xl:ml-0">
          {onOpenBreakdown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenBreakdown(match);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-riot-red hover:text-white border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px] font-mono font-bold transition-all shrink-0"
              title="Open match breakdown"
            >
              <BarChart2 className="w-3 h-3" />
              <span>Details</span>
            </button>
          )}

          <div
            className="w-6 h-6 rounded-sm flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors shrink-0"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-riot-red" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded 10-Player Comprehensive Scoreboard */}
      {isExpanded && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0c0e14] p-3 space-y-4">
          <TeamScoreboard
            teamName="Blue Team"
            teamId={100}
            isVictory={blueTeamStats?.win ?? bluePlayers[0]?.win}
            players={bluePlayers}
            targetPuuid={p.puuid}
            maxDamage={maxDamage}
            teamStats={blueTeamStats}
          />

          <TeamScoreboard
            teamName="Red Team"
            teamId={200}
            isVictory={redTeamStats?.win ?? redPlayers[0]?.win}
            players={redPlayers}
            targetPuuid={p.puuid}
            maxDamage={maxDamage}
            teamStats={redTeamStats}
          />
        </div>
      )}
    </div>
  );
};

interface TeamScoreboardProps {
  teamName: string;
  teamId: number;
  isVictory: boolean;
  players: MatchParticipant[];
  targetPuuid: string;
  maxDamage: number;
  teamStats?: {
    baronKills: number;
    dragonKills: number;
    towerKills: number;
    totalKills: number;
    totalGold: number;
  };
}

const TeamScoreboard: React.FC<TeamScoreboardProps> = ({
  teamName,
  teamId: _teamId,
  isVictory,
  players,
  targetPuuid,
  maxDamage,
  teamStats,
}) => {
  const totalKills = teamStats?.totalKills ?? players.reduce((acc, x) => acc + x.kills, 0);
  const totalGold = teamStats?.totalGold ?? players.reduce((acc, x) => acc + x.goldEarned, 0);

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-sm overflow-hidden bg-white dark:bg-[#11141c]">
      {/* Team Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-[#151924] text-xs font-mono">
        <div className="flex items-center gap-2">
          <span
            className={`px-1.5 py-0.2 rounded-sm text-[9px] font-black uppercase ${
              isVictory
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-riot-red/10 text-riot-red border border-riot-red/30"
            }`}
          >
            {isVictory ? "Victory" : "Defeat"}
          </span>
          <span className="font-bold text-neutral-800 dark:text-neutral-200">{teamName}</span>
        </div>

        <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400 tabular-nums text-[11px]">
          <span>Kills: <strong className="text-neutral-800 dark:text-neutral-200">{totalKills}</strong></span>
          <span>Gold: <strong className="text-neutral-800 dark:text-neutral-200">{(totalGold / 1000).toFixed(1)}k</strong></span>
          {teamStats && (
            <div className="hidden sm:flex items-center gap-2 text-neutral-400">
              <span>Barons: {teamStats.baronKills}</span>
              <span>Dragons: {teamStats.dragonKills}</span>
              <span>Towers: {teamStats.towerKills}</span>
            </div>
          )}
        </div>
      </div>

      {/* Players Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-neutral-700 dark:text-neutral-300 border-collapse font-mono">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[9px] uppercase font-bold text-neutral-400 tracking-wider bg-neutral-50/50 dark:bg-[#131620]">
              <th className="py-1.5 px-2">Player / Champion</th>
              <th className="py-1.5 px-2">KDA</th>
              <th className="py-1.5 px-2">Damage</th>
              <th className="py-1.5 px-2">Taken</th>
              <th className="py-1.5 px-2">CS / Gold</th>
              <th className="py-1.5 px-2">Wards</th>
              <th className="py-1.5 px-2">Items</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60 tabular-nums">
            {players.map((player) => {
              const isTarget = player.puuid === targetPuuid;
              const dmgPct = Math.round(
                ((player.totalDamageDealtToChampions || 0) / maxDamage) * 100
              );
              const playerItems = [
                player.item0,
                player.item1,
                player.item2,
                player.item3,
                player.item4,
                player.item5,
              ];

              return (
                <tr
                  key={player.puuid}
                  className={`hover:bg-neutral-50 dark:hover:bg-[#161a26] transition-colors ${
                    isTarget ? "bg-neutral-100/80 dark:bg-[#181d2c] font-semibold border-l-2 border-l-riot-red" : ""
                  }`}
                >
                  {/* Player & Champ */}
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-2">
                      <div className="relative w-6 h-6 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 shrink-0 bg-neutral-900">
                        <img
                          src={getChampionIconUrl(player.championName)}
                          alt={player.championName}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 bg-neutral-950 text-[7px] font-bold px-0.5 text-neutral-200">
                          {player.champLevel}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <img
                          src={getSummonerSpellIconUrl(player.summoner1Id)}
                          alt="Spell"
                          className="w-3 h-3 rounded-none"
                        />
                        <img
                          src={getSummonerSpellIconUrl(player.summoner2Id)}
                          alt="Spell"
                          className="w-3 h-3 rounded-none"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span
                            className={`truncate max-w-[100px] text-xs font-bold ${
                              isTarget ? "text-riot-red" : "text-neutral-800 dark:text-neutral-200"
                            }`}
                          >
                            {player.riotIdGameName || player.summonerName}
                          </span>
                          {isTarget && (
                            <span className="text-[8px] px-1 py-0.2 rounded-sm bg-riot-red text-white font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* KDA */}
                  <td className="py-1.5 px-2 whitespace-nowrap">
                    <div className="font-bold text-neutral-900 dark:text-neutral-100 text-xs">
                      {player.kills} / <span className="text-riot-red">{player.deaths}</span> /{" "}
                      {player.assists}
                    </div>
                    <div className="text-[9px] text-neutral-500">{player.kda}:1</div>
                  </td>

                  {/* Damage Dealt */}
                  <td className="py-1.5 px-2 min-w-[100px]">
                    <div className="flex items-center justify-between text-[10px] text-neutral-800 dark:text-neutral-200 mb-0.5">
                      <span>{(player.totalDamageDealtToChampions || 0).toLocaleString()}</span>
                      <span className="text-[9px] text-neutral-400">{dmgPct}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-none h-1 overflow-hidden">
                      <div
                        className="bg-riot-red h-full"
                        style={{ width: `${dmgPct}%` }}
                      />
                    </div>
                  </td>

                  {/* Damage Taken */}
                  <td className="py-1.5 px-2 whitespace-nowrap text-neutral-500 text-[10px]">
                    <div>{(player.totalDamageTaken || 0).toLocaleString()}</div>
                  </td>

                  {/* CS & Gold */}
                  <td className="py-1.5 px-2 whitespace-nowrap text-[10px]">
                    <div className="text-neutral-800 dark:text-neutral-200 font-medium">
                      {player.cs} CS
                    </div>
                    <div className="text-neutral-500">
                      {player.goldEarned.toLocaleString()}g
                    </div>
                  </td>

                  {/* Wards & Vision */}
                  <td className="py-1.5 px-2 whitespace-nowrap text-[10px] text-neutral-500">
                    <div className="text-neutral-800 dark:text-neutral-200 font-medium">
                      {player.visionScore} VS
                    </div>
                    <div>W: {player.wardsPlaced}</div>
                  </td>

                  {/* Items */}
                  <td className="py-1.5 px-2 whitespace-nowrap">
                    <div className="flex items-center gap-0.5">
                      {playerItems.map((itemId, i) => (
                        <ItemTooltip key={i} itemId={itemId} size="xs" />
                      ))}
                      <div className="ml-0.5">
                        <ItemTooltip itemId={player.item6} size="xs" isTrinket />
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
