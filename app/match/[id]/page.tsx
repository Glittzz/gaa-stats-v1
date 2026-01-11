"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
    if (!m) return;
    setMatch(m);
  }, [id]);

  useEffect(() => {
    if (!clockRunning) return;
    tickRef.current = window.setInterval(() => setClockSeconds((s) => s + 1), 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [clockRunning]);

  const maxNumber = useMemo(() => {
    if (!match) return DEFAULT_MAX_NUMBER;
    const nums = Object.keys(match.panel || {})
      .map((n) => Number(n))
      .filter((n) => !Number.isNaN(n));
    const m = nums.length ? Math.max(...nums) : DEFAULT_MAX_NUMBER;
    return Math.max(m, 15);
  }, [match]);

  const numbers = useMemo(() => Array.from({ length: maxNumber }, (_, i) => i + 1), [maxNumber]);

  const score = useMemo(
    () => (match ? scoreFromEvents(match) : { goals: 0, points: 0, twoPoints: 0, totalPoints: 0 }),
    [match]
  );

  function persist(next: Match) {
    setMatch(next);
    upsertMatch(next);
  }

  function addEvent(playerNumber?: number) {
    if (!match || !activeEvent) return;

    const ev: MatchEvent = {
      id: uid("ev"),
      matchId: match.id,
      ts: Date.now(),
      clockSeconds,
      team: activeTeam,
      type: activeEvent,
      playerNumber,
    };

    const next: Match = { ...match, events: [ev, ...match.events] };
    persist(next);
  }

  function undoLast() {
    if (!match || match.events.length === 0) return;
    const next: Match = { ...match, events: match.events.slice(1) };
    persist(next);
  }

  function clearSticky() {
    setActiveEvent(null);
  }

  if (!match) {
    return (
      <div>
        <p>Match not found.</p>
        <Link href="/">Back</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "grid", gap: 8 }}>
        <h1 style={{ margin: 0 }}>Live: Balla vs {match.opponent}</h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 12 }}>
            <strong>Clock:</strong> {formatClock(clockSeconds)}
          </div>

          <button
            onClick={() => setClockRunning((v) => !v)}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #333", background: "white" }}
          >
            {clockRunning ? "Pause" : "Resume"}
          </button>

          <div style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 12 }}>
            <strong>Score (Balla):</strong> {score.goals}-{score.points} (2pt: {score.twoPoints}) ({score.totalPoints})
          </div>

          <Link
            href={`/match/${match.id}/summary`}
            style={{ textDecoration: "none", padding: "10px 12px", border: "1px solid #333", borderRadius: 12 }}
          >
            Summary
          </Link>

          <Link
            href={`/match/${match.id}/setup`}
            style={{ textDecoration: "none", padding: "10px 12px", border: "1px solid #333", borderRadius: 12 }}
          >
            Panel
          </Link>

          <Link href="/" style={{ textDecoration: "none", padding: "10px 12px", border: "1px solid #333", borderRadius: 12 }}>
            Home
          </Link>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontWeight: 800 }}>Active:</div>
          <div style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 12 }}>
            {activeEvent ? EVENT_LABELS[activeEvent] : "—"}
          </div>

          <button
            onClick={clearSticky}
            disabled={!activeEvent}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #333",
              background: activeEvent ? "white" : "#eee",
              opacity: activeEvent ? 1 : 0.6,
            }}
          >
            Clear
          </button>

          <button
            onClick={undoLast}
            disabled={match.events.length === 0}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #333",
              background: match.events.length ? "white" : "#eee",
              opacity: match.events.length ? 1 : 0.6,
              fontWeight: 800,
            }}
          >
            Undo Last
          </button>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => setActiveTeam("BALLA")}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #333",
                background: activeTeam === "BALLA" ? "#111" : "white",
                color: activeTeam === "BALLA" ? "white" : "black",
                fontWeight: 800,
              }}
            >
              Balla
            </button>
            <button
              onClick={() => setActiveTeam("OPP")}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #333",
                background: activeTeam === "OPP" ? "#111" : "white",
                color: activeTeam === "OPP" ? "white" : "black",
                fontWeight: 800,
              }}
            >
              Opp
            </button>
          </div>
