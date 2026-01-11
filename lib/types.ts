export type Side = "HOME" | "AWAY";

export type EventType =
  | "HOME_KO_WON"
  | "HOME_KO_LOST"
  | "AWAY_KO_WON"
  | "AWAY_KO_LOST"
  | "INTERCEPTION"
  | "TACKLE_WON"
  | "BLOCKDOWN"
  | "TURNOVER_WON"
  | "TURNOVER_CONCEDED"
  | "POINT"
  | "TWO_POINT"
  | "GOAL"
  | "WIDE"
  | "SAVED_OR_SHORT"
  | "ASSIST";

export type EventTeam = "BALLA" | "OPP";

export type MatchEvent = {
  id: string;
  matchId: string;
  ts: number; // Date.now()
  clockSeconds: number; // running clock
  team: EventTeam;
  type: EventType;
  playerNumber?: number; // optional
};

export type Match = {
  id: string;
  createdAt: number;
  opponent: string;
  venue: string;
  side: Side; // are we home or away?
  matchDateISO: string; // YYYY-MM-DD
  // jersey number -> optional name
  halfMinutes: number; // 30 or 35
  panel: Record<number, string>;
  events: MatchEvent[];
};
