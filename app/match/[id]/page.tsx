"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { EVENT_GROUPS, EVENT_LABELS } from "../../../lib/events";
import { uid } from "../../../lib/id";
import { getMatch, upsertMatch } from "../../../lib/storage";
import { EventTeam, EventType, Match, MatchEvent } from "../../../lib/types";
import { formatClock, scoreFromEvents } from "../../../lib/stats";

const DEFAULT_MAX_NUMBER = 25;

export default function LivePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [match, setMatch] = useState<Match | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventType | null>(null);
  const [activeTeam, setActiveTeam] = useState<EventTeam>("BALLA");

  const [clockSeconds, setClockSeconds] = useState(0);
  const [clockRunning, setClockRunning] = useState(true);

  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    const m = getMatch(id);
    setMatch(m);
  }, [id]);

  useEffect(() => {
    if (!clockRunning) return;

    tickRef.current = window.setInterval(() => {
      setClockSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [clockRunning]);

  if (!match) {
    return (
      <div>
        <p>Match not found.</p>
        <Link href="/">Back</Link>
      </div>
    );
  }

  function logEvent(playerNumber: number) {
    if (!activeEvent) return;

    const ev: MatchEvent = {
      id: uid(),
      type: activeEvent,
      team: activeTeam,
      playerNumber,
      timestamp: clockSeconds,
    };

    const updated: Match = {
      ...match,
      events: [...match.events, ev],
    };

    setMatch(updated);
    upsertMatch(updated);
  }

  const score = scoreFromEvents(match.events);

  return (
    <div style={{ padding: 12, display: "grid", gap: 12 }}>
      <h1>
        Live: Balla vs {match.opponent}
      </h1>

      <div>
        <strong>Clock:</strong> {formatClock(clockSeconds)}{" "}
        <button onClick={() => setClockRunning((v) => !v)}>
          {clockRunning ? "Pause" : "Resume"}
        </button>
      </div>

      <div>
        <strong>Score:</strong> Balla {score.balla} – {score.opponent}{" "}
        {match.opponent}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {EVENT_GROUPS.map((group) => (
          <div key={group.label}>
            <strong>{group.label}</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {group.events.map((ev) => (
                <button
                  key={ev}
                  onClick={() => setActiveEvent(ev)}
                  style={{
                    background:
                      activeEvent === ev ? "#333" : "#eee",
                    color: activeEvent === ev ? "#fff" : "#000",
                  }}
                >
                  {EVENT_LABELS[ev]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <strong>Player:</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {Array.from({ length: DEFAULT_MAX_NUMBER }, (_, i) => i + 1).map(
            (n) => (
              <button key={n} onClick={() => logEvent(n)}>
                {n}
              </button>
            )
          )}
        </div>
      </div>

      <Link href={`/match/${id}/setup`}>Match setup</Link>
    </div>
  );
}
