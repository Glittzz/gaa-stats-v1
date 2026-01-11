import { EventType } from "./types";

export const EVENT_LABELS: Record<EventType, string> = {
  HOME_KO_WON: "Home KO Won",
  HOME_KO_LOST: "Home KO Lost",
  AWAY_KO_WON: "Away KO Won",
  AWAY_KO_LOST: "Away KO Lost",
  INTERCEPTION: "Interception",
  TACKLE_WON: "Tackle Won",
  BLOCKDOWN: "Blockdown",
  TURNOVER_WON: "Turnover Won",
  TURNOVER_CONCEDED: "Turnover Conceded",
  POINT: "Point",
  TWO_POINT: "2-Point Score",
  GOAL: "Goal",
  WIDE: "Wide",
  SAVED_OR_SHORT: "Saved/Short",
  ASSIST: "Assist",
};

export const EVENT_GROUPS: Array<{ title: string; types: EventType[] }> = [
  {
    title: "Kickouts",
    types: ["HOME_KO_WON", "HOME_KO_LOST", "AWAY_KO_WON", "AWAY_KO_LOST"],
  },
  {
    title: "Defence",
    types: ["INTERCEPTION", "TACKLE_WON", "BLOCKDOWN"],
  },
  {
    title: "Turnovers",
    types: ["TURNOVER_WON", "TURNOVER_CONCEDED"],
  },
  {
    title: "Attack",
    types: ["POINT", "TWO_POINT", "GOAL", "WIDE", "SAVED_OR_SHORT", "ASSIST"],
  },
];
