import { EventType, Match } from "./types";

export function formatClock(seconds: number) {
  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export function scoreFromEvents(match: Match) {
  // Balla score only (for now).
  const goals = match.events.filter((e) => e.team === "BALLA" && e.type === "GOAL").length;
  const onePoints = match.events.filter((e) => e.team === "BALLA" && e.type === "POINT").length;
  const twoPoints = match.events.filter((e) => e.team === "BALLA" && e.type === "TWO_POINT").length;

  const totalPoints = goals * 3 + onePoints + twoPoints * 2;

  return { goals, points: onePoints, twoPoints, totalPoints };
}

export function teamTotals(match: Match) {
  const totals: Record<EventType, number> = {} as any;
  for (const e of match.events) {
    totals[e.type] = (totals[e.type] ?? 0) + 1;
  }
  return totals;
}

export function perPlayerTotals(match: Match) {
  const totals: Record<number, Record<string, number>> = {};
  for (const e of match.events) {
    if (!e.playerNumber) continue;
    totals[e.playerNumber] ??= {};
    totals[e.playerNumber][e.type] = (totals[e.playerNumber][e.type] ?? 0) + 1;
  }
  return totals;
}

export function toCSVEvents(match: Match) {
  const header = ["ts", "clock", "team", "type", "playerNumber"].join(",");
  const rows = match.events
    .slice()
    .sort((a, b) => a.ts - b.ts)
    .map((e) => {
      const iso = new Date(e.ts).toISOString();
      return [iso, e.clockSeconds, e.team, e.type, e.playerNumber ?? ""].join(",");
    });
  return [header, ...rows].join("\n");
}

export function toCSVPlayerTotals(match: Match) {
  const per = perPlayerTotals(match);
  const types = [
    "INTERCEPTION",
    "TACKLE_WON",
    "BLOCKDOWN",
    "TURNOVER_WON",
    "TURNOVER_CONCEDED",
    "POINT",
    "TWO_POINT",
    "GOAL",
    "WIDE",
    "SAVED_OR_SHORT",
    "ASSIST",
    "HOME_KO_WON",
    "HOME_KO_LOST",
    "AWAY_KO_WON",
    "AWAY_KO_LOST",
  ] as const;

  const header = ["number", "name", ...types].join(",");

  const nums = Object.keys({ ...match.panel, ...per })
    .map((n) => Number(n))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);

  const rows = nums.map((n) => {
    const name = (match.panel?.[n] ?? "").replaceAll(",", " ");
    const counts = per[n] ?? {};
    const cols = types.map((t) => String(counts[t] ?? 0));
    return [n, name, ...cols].join(",");
  });

  return [header, ...rows].join("\n");
}
