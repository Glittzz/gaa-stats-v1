import { Match } from "./types";

const KEY = "gaa_stats_v1_matches";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadMatches(): Match[] {
  if (typeof window === "undefined") return [];
  return safeParse<Match[]>(localStorage.getItem(KEY), []);
}

export function saveMatches(matches: Match[]) {
  localStorage.setItem(KEY, JSON.stringify(matches));
}

export function getMatch(id: string): Match | undefined {
  const all = loadMatches();
  return all.find((m) => m.id === id);
}

export function upsertMatch(match: Match) {
  const all = loadMatches();
  const idx = all.findIndex((m) => m.id === match.id);
  if (idx >= 0) all[idx] = match;
  else all.unshift(match);
  saveMatches(all);
}

export function deleteMatch(id: string) {
  const all = loadMatches().filter((m) => m.id !== id);
  saveMatches(all);
}
