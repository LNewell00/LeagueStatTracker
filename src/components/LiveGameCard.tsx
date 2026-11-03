import React from "react";
import { LivePollerState } from "../types/live";
import { Activity, Clock, Zap, Shield, Swords, Coins, PlayCircle, StopCircle } from "lucide-react";
import { getChampionIconUrl, getItemIconUrl } from "../services/ddragon";

interface LiveGameCardProps {
  liveState: LivePollerState;
  isMockActive: boolean;
  onToggleMock: () => void;
}

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
                Listening for active League match... (Start a game to auto-detect stats)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMock}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isMockActive
                  ? "bg-riot-accent/20 border-riot-accent text-riot-accent shadow-neon-cyan"
                  : "bg-riot-surface border-riot-border text-slate-300 hover:border-slate-500"
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Simulate Live Game</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { activePlayer, allPlayers, gameData } = liveState.data;
  // Match active player in allPlayers list to get current champion name and scores
  const playerInGame =
    allPlayers?.find((p) => p.summonerName === activePlayer.summonerName) || allPlayers?.[0];
  const championName = playerInGame?.championName || "Ahri";
  const scores = playerInGame?.scores || { kills: 0, deaths: 0, assists: 0, creepScore: 0 };
  const items = playerInGame?.items || [];

  return (
    <div className="bg-gradient-to-r from-riot-card via-riot-surface to-riot-card border border-pink-500/40 rounded-2xl p-5 shadow-neon-pink relative overflow-hidden transition-all">
      {/* Background glow banner */}
      <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-pink-500/10 via-indigo-500/5 to-transparent pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 border-b border-riot-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-win opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon-win"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-neon-win">
            Active Game Detected
          </span>
          <span className="text-slate-500 text-xs">•</span>
          <span className="text-xs font-medium text-slate-300">{gameData.gameMode || "Summoner's Rift"}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-riot-darkest border border-riot-border text-xs text-slate-200 font-mono">
            <Clock className="w-3.5 h-3.5 text-riot-accent" />
            <span>{formatTime(gameData.gameTime || 0)}</span>
          </div>

          {isMockActive && (
            <button
              onClick={onToggleMock}
              className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs hover:bg-rose-500/20"
              title="Stop Simulation"
            >
              <StopCircle className="w-3 h-3" />
              <span>Stop Sim</span>
            </button>
          )}
        </div>
      </div>

      {/* Main stats layout */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Champion Portrait & Identity */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-riot-accent shadow-lg bg-riot-darkest">
              <img
                src={getChampionIconUrl(championName)}
                alt={championName}
                className="w-full h-full object-cover scale-105"
              />
            </div>
            <span className="absolute -bottom-1.5 -right-1.5 bg-riot-surface border border-riot-border text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              Lv {activePlayer.level || 1}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-100">{championName}</h4>
              <span className="text-xs text-slate-400">({activePlayer.summonerName})</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm font-semibold">
              <span className="text-slate-100">
                {scores.kills} / <span className="text-neon-loss">{scores.deaths}</span> / {scores.assists}
              </span>
              <span className="text-xs text-slate-400">({scores.creepScore} CS)</span>
            </div>
          </div>
        </div>

        {/* Live Combat & Economy Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-riot-darkest/70 border border-riot-border/70 rounded-xl p-3 text-xs w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 text-riot-gold" />
            <div>
              <div className="text-[10px] text-slate-400">Gold</div>
              <div className="font-bold text-slate-200">{Math.round(activePlayer.currentGold || 0)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Swords className="w-3.5 h-3.5 text-rose-400" />
            <div>
              <div className="text-[10px] text-slate-400">AD / AP</div>
              <div className="font-bold text-slate-200">
                {Math.round(activePlayer.championStats?.attackDamage || 0)} /{" "}
                {Math.round(activePlayer.championStats?.abilityPower || 0)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <div>
              <div className="text-[10px] text-slate-400">Armor / MR</div>
              <div className="font-bold text-slate-200">
                {Math.round(activePlayer.championStats?.armor || 0)} /{" "}
                {Math.round(activePlayer.championStats?.magicResist || 0)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-riot-accent" />
            <div>
              <div className="text-[10px] text-slate-400">Move Speed</div>
              <div className="font-bold text-slate-200">
                {Math.round(activePlayer.championStats?.moveSpeed || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Live Items Grid */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 6 }).map((_, idx) => {
            const item = items[idx];
            return (
              <div
                key={idx}
                className="w-8 h-8 rounded-lg bg-riot-darkest border border-riot-border/80 overflow-hidden flex items-center justify-center"
                title={item ? item.displayName : "Empty Slot"}
              >
                {item && item.itemID ? (
                  <img
                    src={getItemIconUrl(item.itemID)}
                    alt={item.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700/50" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

