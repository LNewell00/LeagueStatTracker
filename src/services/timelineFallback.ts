import { ParsedMatch } from "../types/riot";
import {
  ParsedTimeline,
  MinuteLeadFrame,
  SkillLevelUpEvent,
  KillMapEvent,
  SkillSlot,
} from "../types/timeline";

export function generateFallbackTimeline(match: ParsedMatch): ParsedTimeline {
  const target = match.targetParticipant;
  const isWin = target.win;
  const durationMin = Math.max(10, Math.floor(match.gameDuration / 60));

  const isBlueTarget = target.teamId === 100;
  const blueWon = isBlueTarget ? isWin : !isWin;

  const targetParticipantId = isBlueTarget ? 1 : 6;

  // Generate minute frames
  const minuteFrames: MinuteLeadFrame[] = [];
  let blueGold = 2500;
  let redGold = 2500;
  let blueXp = 0;
  let redXp = 0;

  let maxBlueLead = { lead: 0, minute: 0 };
  let maxRedLead = { lead: 0, minute: 0 };
  let goldAt15m = 0;

  for (let min = 0; min <= durationMin; min++) {
    const progress = min / durationMin;
    const blueGrowth = 500 + min * 180 + (blueWon ? progress * 350 : -progress * 150);
    const redGrowth = 500 + min * 180 + (!blueWon ? progress * 350 : -progress * 150);

    blueGold += Math.round(blueGrowth);
    redGold += Math.round(redGrowth);
    blueXp += Math.round(blueGrowth * 1.2);
    redXp += Math.round(redGrowth * 1.2);

    const goldDiff = blueGold - redGold;
    const xpDiff = blueXp - redXp;

    if (goldDiff > maxBlueLead.lead) maxBlueLead = { lead: goldDiff, minute: min };
    if (-goldDiff > maxRedLead.lead) maxRedLead = { lead: -goldDiff, minute: min };
    if (min === 15) goldAt15m = goldDiff;

    const targetGold = Math.round(
      (isBlueTarget ? blueGold : redGold) / 5 + min * 40
    );
    const targetLevel = Math.min(18, Math.max(1, Math.floor(min / 1.7) + 1));
    const targetCs = Math.round(target.csPerMin * min);

    minuteFrames.push({
      minute: min,
      blueGold,
      redGold,
      goldDiff,
      blueXp,
      redXp,
      xpDiff,
      targetGold,
      targetLevel,
      targetCs,
    });
  }

  // Generate Skill Level Up order (1..champLevel)
  const skillPattern: SkillSlot[] = [
    "Q", "W", "E", "Q", "Q", "R", "Q", "E", "Q", "E", "R", "E", "E", "W", "W", "R", "W", "W"
  ];
  const champLevel = Math.min(18, Math.max(1, target.champLevel));
  const skillSlotMap: Record<SkillSlot, 1 | 2 | 3 | 4> = { Q: 1, W: 2, E: 3, R: 4 };

  const skillLevelUps: SkillLevelUpEvent[] = [];
  for (let lvl = 1; lvl <= champLevel; lvl++) {
    const slot = skillPattern[lvl - 1] || "Q";
    skillLevelUps.push({
      level: lvl,
      skillKey: slot,
      skillSlot: skillSlotMap[slot],
      timestamp: lvl * 90000,
    });
  }

  // Generate realistic Summoner's Rift kill positions
  // Landmark hotspots: Top (2500, 12500), Mid (7500, 7500), Bot (12500, 2500), Dragon (9800, 4400), Baron (5000, 10400)
  const hotspots = [
    { x: 7500, y: 7500 }, // Mid lane center
    { x: 8200, y: 6800 }, // Mid river
    { x: 9800, y: 4400 }, // Dragon pit
    { x: 5000, y: 10400 }, // Baron pit
    { x: 12500, y: 2500 }, // Bot lane
    { x: 11000, y: 3500 }, // Bot river brush
    { x: 2500, y: 12500 }, // Top lane
    { x: 4000, y: 11000 }, // Top river
    { x: 6000, y: 6000 }, // Blue jungle
    { x: 9000, y: 9000 }, // Red jungle
    { x: 13500, y: 13500 }, // Red base
    { x: 1500, y: 1500 }, // Blue base
  ];

  const kills: KillMapEvent[] = [];
  const enemies = match.allParticipants.filter((p) => p.teamId !== target.teamId);
  const allies = match.allParticipants.filter(
    (p) => p.teamId === target.teamId && p.puuid !== target.puuid
  );

  // Add target kills
  for (let k = 0; k < target.kills; k++) {
    const spot = hotspots[k % hotspots.length];
    const victim = enemies[k % enemies.length] || target;
    const timeSec = Math.round((k + 1) * ((durationMin * 60) / (target.kills + 2)));
    kills.push({
      killerId: targetParticipantId,
      victimId: 10 - (k % 5),
      assistingParticipantIds: allies.map((_, i) => i + 2),
      killerChampion: target.championName,
      victimChampion: victim.championName,
      killerName: target.summonerName,
      victimName: victim.summonerName,
      killerTeamId: target.teamId,
      victimTeamId: victim.teamId,
      position: {
        x: spot.x + (Math.sin(k * 3) * 600),
        y: spot.y + (Math.cos(k * 3) * 600),
      },
      timestamp: timeSec * 1000,
      minute: Math.floor(timeSec / 60),
      second: timeSec % 60,
      isTargetKill: true,
      isTargetDeath: false,
      isTargetAssist: false,
    });
  }

  // Add target deaths
  for (let d = 0; d < target.deaths; d++) {
    const spot = hotspots[(d * 2 + 3) % hotspots.length];
    const killer = enemies[d % enemies.length] || target;
    const timeSec = Math.round((d + 1) * ((durationMin * 60) / (target.deaths + 2)));
    kills.push({
      killerId: 10 - (d % 5),
      victimId: targetParticipantId,
      assistingParticipantIds: [],
      killerChampion: killer.championName,
      victimChampion: target.championName,
      killerName: killer.summonerName,
      victimName: target.summonerName,
      killerTeamId: killer.teamId,
      victimTeamId: target.teamId,
      position: {
        x: spot.x + (Math.cos(d * 4) * 500),
        y: spot.y + (Math.sin(d * 4) * 500),
      },
      timestamp: timeSec * 1000,
      minute: Math.floor(timeSec / 60),
      second: timeSec % 60,
      isTargetKill: false,
      isTargetDeath: true,
      isTargetAssist: false,
    });
  }

  // Add target assists
  for (let a = 0; a < Math.min(10, target.assists); a++) {
    const spot = hotspots[(a * 3 + 1) % hotspots.length];
    const allyKiller = allies[a % allies.length] || target;
    const enemyVictim = enemies[a % enemies.length] || target;
    const timeSec = Math.round((a + 1) * ((durationMin * 60) / (target.assists + 2)));
    kills.push({
      killerId: 2,
      victimId: 8,
      assistingParticipantIds: [targetParticipantId],
      killerChampion: allyKiller.championName,
      victimChampion: enemyVictim.championName,
      killerName: allyKiller.summonerName,
      victimName: enemyVictim.summonerName,
      killerTeamId: target.teamId,
      victimTeamId: enemyVictim.teamId,
      position: {
        x: spot.x + (Math.sin(a * 5) * 450),
        y: spot.y + (Math.cos(a * 5) * 450),
      },
      timestamp: timeSec * 1000,
      minute: Math.floor(timeSec / 60),
      second: timeSec % 60,
      isTargetKill: false,
      isTargetDeath: false,
      isTargetAssist: true,
    });
  }

  // Sort chronologically
  kills.sort((a, b) => a.timestamp - b.timestamp);

  return {
    matchId: match.matchId,
    targetParticipantId,
    targetTeamId: target.teamId,
    maxBlueGoldLead: maxBlueLead,
    maxRedGoldLead: maxRedLead,
    goldAt15m,
    minuteFrames,
    skillLevelUps,
    kills,
  };
}
