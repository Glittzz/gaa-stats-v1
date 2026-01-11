"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadMatches, upsertMatch, deleteMatch } from "../lib/storage";
import { Match } from "../lib/types";
import { uid } from "../lib/id";

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [opponent, setOpponent] = useState("");
  const [venue, setVenue] = useState("Balla");
  const [side, setSide] = useState<"HOME" | "AWAY">("HOME");
  const [dateISO, setDateISO] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setMatches(loadMatches());
  }, []);

  const canCreate = useMemo(() => opponent.trim().length > 0, [opponent]);

  function createMatch() {
    if (!canCreate) return;

    const m: Match = {
      id: uid("match"),
      createdAt: Date.now(),
      opponent: opponent.trim(),
      venue: venue.trim() || "—",
      side,
      matchDateISO: dateISO,
halfMinutes: 30, 
      panel: {},
      events: [],
    };

    upsertMatch(m);
    setMatches(loadMatches());
    setOpponent("");
  }

  function remove(id: string) {
    deleteMatch(id);
    setMatches(loadMatches());
  }

  return (
    <div>
      <h1>GAA Stats V1</h1>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <h2>New Match</h2>

        <label>
          Opponent
          <input
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>

        <label>
          Venue
          <input
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>

        <label>
          Home / Away
          <select
            value={side}
            onChange={(e) => setSide(e.target.value as any)}
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          >
            <option value="HOME">Home</option>
            <option value="AWAY">Away</option>
          </select>
        </label>

        <label>
          Date
          <input
            type="date"
            value={dateISO}
            onChange={(e) => setDateISO(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>

        <button
          onClick={createMatch}
          disabled={!canCreate}
          style={{
            marginTop: 10,
            padding: 12,
            width: "100%",
            fontWeight: "bold",
            background: "#111",
            color: "white",
            borderRadius: 8,
          }}
        >
          Create Match
        </button>
      </div>

      <h2>Saved Matches</h2>

      {matches.length === 0 ? (
        <p>No matches yet.</p>
      ) : (
        matches.map((m) => (
          <div key={m.id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 10 }}>
            <strong>Balla vs {m.opponent}</strong>
            <div>{m.matchDateISO} · {m.venue}</div>

            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <Link href={`/match/${m.id}`}>Live</Link>
              <Link href={`/match/${m.id}/setup`}>Setup</Link>
              <Link href={`/match/${m.id}/summary`}>Summary</Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
