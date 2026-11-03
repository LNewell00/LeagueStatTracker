export interface ParticipantFrameData {
  participantId: number;
  totalGold: number;
  xp: number;
  level: number;
  cs: number;
}

export interface MinuteLeadFrame {
  minute: number;
  blueGold: number;
  redGold: number;
  goldDiff: number; // positive = blue lead, negative = red lead
  blueXp: number;
  redXp: number;
  xpDiff: number;
  targetGold: number;
  targetLevel: number;
  targetCs: number;
  participantData?: Record<number, ParticipantFrameData>;
}

export type SkillSlot = "Q" | "W" | "E" | "R";

export interface SkillLevelUpEvent {
  level: number;
  skillKey: SkillSlot;
  skillSlot: number; // 1, 2, 3, 4
  timestamp: number;
}

export interface KillMapEvent {
  killerId: number;
  victimId: number;
  assistingParticipantIds: number[];
  killerChampion: string;
  victimChampion: string;
  killerName: string;
  victimName: string;
  killerTeamId: number; // 100 or 200
  victimTeamId: number; // 100 or 200
  position: { x: number; y: number };
  timestamp: number; // in ms
  minute: number;
  second: number;
  isTargetKill: boolean;
  isTargetDeath: boolean;
  isTargetAssist: boolean;
}

export interface TimelineParticipant {
  participantId: number;
  puuid: string;
  championName: string;
  summonerName: string;
  teamId: number; // 100 or 200
  role: string;
  isTarget: boolean;
  color: string;
}

export interface ParsedTimeline {
  matchId: string;
  targetParticipantId: number;
  targetTeamId: number;
  maxBlueGoldLead: { lead: number; minute: number };
  maxRedGoldLead: { lead: number; minute: number };
  goldAt15m: number;
  minuteFrames: MinuteLeadFrame[];
  skillLevelUps: SkillLevelUpEvent[];
  kills: KillMapEvent[];
  participants: TimelineParticipant[];
}
