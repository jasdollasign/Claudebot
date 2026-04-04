export interface Player {
  summonerName: string;
  championName: string;
  championId: number;
  team: "blue" | "red";
  role: "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  csPerMin: number;
  gold: number;
  goldPerMin: number;
  damageDealt: number;
  damageToChampions: number;
  damageTaken: number;
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
  level: number;
  items: number[];
  spells: [string, string];
  runes: { primary: string; secondary: string };
}

export interface GameEvent {
  timestamp: number; // seconds into game
  type:
    | "KILL"
    | "DEATH"
    | "ASSIST"
    | "DRAGON"
    | "BARON"
    | "TOWER"
    | "INHIBITOR"
    | "RIFT_HERALD"
    | "TEAM_FIGHT"
    | "OBJECTIVE_CONTEST"
    | "WARD_PLACED"
    | "WARD_KILLED";
  description: string;
  position?: { x: number; y: number };
  participants?: string[];
  team?: "blue" | "red";
  importance: "low" | "medium" | "high" | "critical";
}

export interface GoldSnapshot {
  timestamp: number;
  blueGold: number;
  redGold: number;
}

export interface CoachingInsight {
  category:
    | "cs"
    | "vision"
    | "positioning"
    | "objective"
    | "trading"
    | "macro"
    | "teamfight"
    | "itemization";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  timestamp?: number;
  suggestion: string;
}

export interface ReplayData {
  gameId: string;
  gameDuration: number; // seconds
  gameVersion: string;
  mapId: number;
  queueType: string;
  winner: "blue" | "red";
  players: Player[];
  events: GameEvent[];
  goldTimeline: GoldSnapshot[];
  focusedPlayer: string; // summonerName of the player being coached
}
