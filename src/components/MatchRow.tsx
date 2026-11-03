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
  Coins,
  Crown,
  Sparkles,
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
    if (kda >= 5.0) return "text-riot-gold font-bold";
    if (kda >= 3.0) return "text-emerald-400 font-bold";
    return "text-slate-300 font-semibold";
  };

  const items = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5];

  // Divide participants into Blue Team (100) and Red Team (200)
  const blueTeam = (match.allParticipants || []).filter((x) => x.teamId === 100);
  const redTeam = (match.allParticipants || []).filter((x) => x.teamId === 200);

  // Fallback if allParticipants was missing
  const bluePlayers = blueTeam.length > 0 ? blueTeam : [p];
  const redPlayers = redTeam.length > 0 ? redTeam : [];

  // Find max damage in game to calculate comparative damage bar length
  const maxDamage = Math.max(
    1,
    ...(match.allParticipants || []).map((x) => x.totalDamageDealtToChampions || 0)
  );

  const blueTeamStats = match.teams?.find((t) => t.teamId === 100);
  const redTeamStats = match.teams?.find((t) => t.teamId === 200);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isWin
          ? "bg-slate-900/60 border-emerald-500/30 hover:border-emerald-500/60"
          : "bg-slate-900/60 border-rose-500/30 hover:border-rose-500/60"
      }`}
    >
      {/* Main Collapsed Card */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative px-5 py-3.5 flex flex-col xl:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/30 transition-all select-none"
      >
        {/* Accent side stripe */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 ${
            isWin ? "bg-neon-win shadow-neon-win" : "bg-neon-loss shadow-neon-loss"
          }`}
        />

        {/* Section 1: Win/Loss status, queue & duration */}
        <div className="flex items-center gap-4 w-full xl:w-44">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded ${
                  isWin
                    ? "bg-emerald-500/20 text-neon-win border border-emerald-500/40"
                    : "bg-rose-500/20 text-neon-loss border border-rose-500/40"
                }`}
              >
                {isWin ? "Victory" : "Defeat"}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1.5">
              <span className="font-medium text-slate-300">Ranked Solo</span>
              <div className="text-[11px] text-slate-500">
                {formatDuration(match.gameDuration)} • {formatTimeAgo(match.gameCreation)}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Champion Portrait, Spells & Level */}
        <div className="flex items-center gap-3 w-full xl:w-48">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-riot-border bg-riot-darkest">
              <img
                src={getChampionIconUrl(p.championName)}
                alt={p.championName}
                className="w-full h-full object-cover scale-105"
                loading="lazy"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-riot-surface border border-riot-border text-slate-300 text-[9px] font-bold px-1 rounded-full">
              {p.champLevel}
            </span>
          </div>

          {/* Summoner Spells */}
          <div className="flex flex-col gap-1">
            <div className="w-5 h-5 rounded overflow-hidden border border-riot-border bg-riot-darkest">
              <img
                src={getSummonerSpellIconUrl(p.summoner1Id)}
                alt="Spell 1"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-5 h-5 rounded overflow-hidden border border-riot-border bg-riot-darkest">
              <img
                src={getSummonerSpellIconUrl(p.summoner2Id)}
                alt="Spell 2"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>{p.championName}</span>
              {p.turretKills > 0 && (
                <span title={`${p.turretKills} Turrets Destroyed`}>
                  <Crown className="w-3 h-3 text-riot-gold" />
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              CS {p.cs} <span className="text-slate-500">({p.csPerMin}/m)</span>
            </div>
          </div>
        </div>

        {/* Section 3: KDA & Score */}
        <div className="flex flex-col items-center xl:items-start w-full xl:w-32">
          <div className="text-sm font-extrabold text-slate-100 tracking-tight">
            {p.kills} / <span className="text-neon-loss">{p.deaths}</span> / {p.assists}
          </div>
          <div className={`text-xs mt-0.5 ${getKdaBadge(p.kda)}`}>
            {p.kda}:1 <span className="text-[10px] text-slate-400 font-normal">KDA</span>
          </div>
        </div>

        {/* Section 4: Items Grid */}
        <div className="flex items-center gap-1.5 w-full xl:w-auto">
          {items.map((itemId, idx) => (
            <ItemTooltip key={idx} itemId={itemId} size="md" />
          ))}
          <div className="ml-1">
            <ItemTooltip itemId={p.item6} size="md" isTrinket />
          </div>
        </div>

        {/* Section 5: Stats (Damage & Vision) */}
        <div className="hidden 2xl:flex items-center gap-4 text-xs text-slate-400 border-l border-riot-border/50 pl-4">
          <div className="flex items-center gap-1" title="Damage to champions">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>{p.totalDamageDealtToChampions.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1" title="Vision score">
            <Eye className="w-3.5 h-3.5 text-riot-accent" />
            <span>{p.visionScore}</span>
          </div>
        </div>

        {/* Section 6: Mini Teammates / Opponents Column */}
        {match.allParticipants && match.allParticipants.length > 0 && (
          <div className="hidden lg:flex items-center gap-3 border-l border-riot-border/50 pl-4">
            {/* Blue team 5 champions */}
            <div className="space-y-0.5">
              {bluePlayers.slice(0, 5).map((pl) => (
                <div key={pl.puuid} className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded overflow-hidden border border-riot-border bg-riot-darkest flex-shrink-0">
                    <img
                      src={getChampionIconUrl(pl.championName)}
                      alt={pl.championName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span
                    className={`text-[10px] truncate max-w-[65px] ${
                      pl.puuid === p.puuid ? "text-riot-accent font-bold" : "text-slate-400"
                    }`}
                  >
                    {pl.riotIdGameName || pl.summonerName}
                  </span>
                </div>
              ))}
            </div>

            {/* Red team 5 champions */}
            <div className="space-y-0.5">
              {redPlayers.slice(0, 5).map((pl) => (
                <div key={pl.puuid} className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded overflow-hidden border border-riot-border bg-riot-darkest flex-shrink-0">
                    <img
                      src={getChampionIconUrl(pl.championName)}
                      alt={pl.championName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span
                    className={`text-[10px] truncate max-w-[65px] ${
                      pl.puuid === p.puuid ? "text-riot-accent font-bold" : "text-slate-400"
                    }`}
                  >
                    {pl.riotIdGameName || pl.summonerName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 7: Breakdown Button & Expand/Collapse */}
        <div className="flex items-center gap-3 shrink-0 ml-auto xl:ml-0 pr-1">
          {onOpenBreakdown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenBreakdown(match);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-riot-accent/15 hover:bg-riot-accent/30 border border-riot-accent/40 text-riot-accent text-xs font-bold tracking-wide transition-all shadow-sm active:scale-95 shrink-0"
              title="Open full match breakdown"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Breakdown</span>
            </button>
          )}

          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-riot-darkest/70 border border-riot-border/60 text-slate-400 hover:text-white hover:border-riot-accent hover:bg-riot-surface transition-all shrink-0"
            title={isExpanded ? "Collapse scoreboard" : "Expand scoreboard"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-riot-accent" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded 10-Player Comprehensive Scoreboard */}
      {isExpanded && (
        <div className="border-t border-riot-border/70 bg-riot-darkest/95 p-5 space-y-6 animate-in slide-in-from-top-2 duration-200">
          {/* Blue Team Scoreboard */}
          <TeamScoreboard
            teamName="Blue Team"
            teamId={100}
            isVictory={blueTeamStats?.win ?? bluePlayers[0]?.win}
            players={bluePlayers}
            targetPuuid={p.puuid}
            maxDamage={maxDamage}
            teamStats={blueTeamStats}
          />

          {/* Red Team Scoreboard */}
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
  teamId,
  isVictory,
  players,
  targetPuuid,
  maxDamage,
  teamStats,
}) => {
  const totalKills = teamStats?.totalKills ?? players.reduce((acc, x) => acc + x.kills, 0);
  const totalGold = teamStats?.totalGold ?? players.reduce((acc, x) => acc + x.goldEarned, 0);

  return (
    <div className="space-y-2">
      {/* Team Header */}
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold ${
          teamId === 100
            ? "bg-sky-950/40 border-sky-500/30 text-sky-200"
            : "bg-rose-950/40 border-rose-500/30 text-rose-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              isVictory
                ? "bg-emerald-500/20 text-neon-win border border-emerald-500/40"
                : "bg-rose-500/20 text-neon-loss border border-rose-500/40"
            }`}
          >
            {isVictory ? "Victory" : "Defeat"}
          </span>
          <span className="font-bold tracking-wide">{teamName}</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
          <span>
            Kills: <strong className="text-white">{totalKills}</strong>
          </span>
          <span>
            Gold: <strong className="text-riot-gold">{(totalGold / 1000).toFixed(1)}k</strong>
          </span>
          {teamStats && (
            <div className="hidden sm:flex items-center gap-3 text-slate-400">
              <span>Barons: {teamStats.baronKills}</span>
              <span>Dragons: {teamStats.dragonKills}</span>
              <span>Towers: {teamStats.towerKills}</span>
            </div>
          )}
        </div>
      </div>

      {/* Players Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="border-b border-riot-border/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <th className="py-2 px-2.5">Player / Champion</th>
              <th className="py-2 px-2">KDA</th>
              <th className="py-2 px-2">Damage Dealt</th>
              <th className="py-2 px-2">Damage Taken</th>
              <th className="py-2 px-2">CS / Gold</th>
              <th className="py-2 px-2">Wards</th>
              <th className="py-2 px-2">Items</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-riot-border/30">
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
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isTarget ? "bg-riot-accent/10 font-medium" : ""
                  }`}
                >
                  {/* Player & Champ */}
                  <td className="py-2.5 px-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-riot-border flex-shrink-0 bg-riot-darkest">
                        <img
                          src={getChampionIconUrl(player.championName)}
                          alt={player.championName}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] font-bold px-1 rounded-tl">
                          {player.champLevel}
                        </span>
                      </div>

                      {/* Summoner Spells */}
                      <div className="flex flex-col gap-0.5">
                        <img
                          src={getSummonerSpellIconUrl(player.summoner1Id)}
                          alt="Spell"
                          className="w-3.5 h-3.5 rounded border border-riot-border"
                        />
                        <img
                          src={getSummonerSpellIconUrl(player.summoner2Id)}
                          alt="Spell"
                          className="w-3.5 h-3.5 rounded border border-riot-border"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`truncate max-w-[120px] font-bold ${
                              isTarget ? "text-riot-accent" : "text-slate-200"
                            }`}
                          >
                            {player.riotIdGameName || player.summonerName}
                          </span>
                          {isTarget && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-riot-accent/20 text-riot-accent font-semibold">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">{player.championName}</div>
                      </div>
                    </div>
                  </td>

                  {/* KDA */}
                  <td className="py-2.5 px-2 whitespace-nowrap">
                    <div className="font-bold text-slate-100">
                      {player.kills} / <span className="text-neon-loss">{player.deaths}</span> /{" "}
                      {player.assists}
                    </div>
                    <div className="text-[10px] text-slate-400">{player.kda}:1 Ratio</div>
                  </td>

                  {/* Damage Dealt with visual bar */}
                  <td className="py-2.5 px-2 min-w-[130px]">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200 mb-1">
                      <span>{(player.totalDamageDealtToChampions || 0).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500">{dmgPct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-rose-500 to-amber-500 h-1.5 rounded-full"
                        style={{ width: `${dmgPct}%` }}
                      />
                    </div>
                  </td>

                  {/* Damage Taken */}
                  <td className="py-2.5 px-2 whitespace-nowrap text-slate-400">
                    <div>{(player.totalDamageTaken || 0).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">
                      Mitigated: {(player.damageSelfMitigated || 0).toLocaleString()}
                    </div>
                  </td>

                  {/* CS & Gold */}
                  <td className="py-2.5 px-2 whitespace-nowrap">
                    <div className="font-semibold text-slate-200">
                      {player.cs} CS <span className="text-[10px] text-slate-500">({player.csPerMin}/m)</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-riot-gold font-semibold">
                      <Coins className="w-3 h-3" />
                      <span>{player.goldEarned.toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Wards & Vision */}
                  <td className="py-2.5 px-2 whitespace-nowrap">
                    <div className="flex items-center gap-1 font-semibold text-slate-200">
                      <Eye className="w-3.5 h-3.5 text-riot-accent" />
                      <span>{player.visionScore}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Wards: {player.wardsPlaced} / {player.wardsKilled} ({player.controlWardsPlaced} CW)
                    </div>
                  </td>

                  {/* Items */}
                  <td className="py-2.5 px-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {playerItems.map((itemId, i) => (
                        <ItemTooltip key={i} itemId={itemId} size="sm" />
                      ))}
                      <div className="ml-0.5">
                        <ItemTooltip itemId={player.item6} size="sm" isTrinket />
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
