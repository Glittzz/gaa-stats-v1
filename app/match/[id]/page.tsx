"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { EVENT_GROUPS, EVENT_LABELS } from "../../../../lib/events";
import { uid } from "../../../../lib/id";
import { getMatch, upsertMatch } from "../../../../lib/storage";
import type { EventTeam, EventType, Match, MatchEvent } from "../../../../lib/types";
import { formatClock, scoreFromEvents } from "../../../../lib/stats";

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

  // Load match
  useEffect(() => {
    const m = getMatch(id);
    // IMPORTANT: getMatch can return undefined, but state expects Match | null
    setMatch(m ?? null);
  }, [id]);

  // Clock tick
  useEffect(() => {
    // stop any existing interval
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }

    if (!clockRunning) return;

    tickRef.current = window.setInterval(() => {
      setClockSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [clockRunning]);

  function clearSticky() {
    setActiveEvent(null);
  }

  function logEvent(playerNumber?: number) {
    if (!match) return;
    if (!activeEvent) return;

    // ✅ FULL FIX: MatchEvent requires matchId + ts + clockSeconds + team + type
    const ev: MatchEvent = {
      id: uid(),
      matchId: match.id,
      ts: Date.now(),
      clockSeconds,
      team: activeTeam,
      type: activeEvent,
      playerNumber,
    };

    const updated: Match = {
      ...match,
      events: [...match.events, ev],
    };

    setMatch(updated);
    upsertMatch(updated);

    // optional: clear selection after logging
    clearSticky();
  }

  function undoLast() {
    if (!match) return;
    if (!match.events?.length) return;

    const updated: Match = {
      ...match,
      events: match.events.slice(0, -1),
    };

    setMatch(updated);
    upsertMatch(updated);
  }

  const score = useMemo(() => {
    if (!match) return null;
    return scoreFromEvents(match.events);
  }, [match]);

  // Build an event list safely from EVENT_GROUPS / EVENT_LABELS
  const groupedEventTypes: Array<{ title: string; types: EventType[] }> = useMemo(() => {
    // If your lib/events uses groups, we try to use them.
    // Otherwise we fall back to all labels.
    const anyGroups: any = EVENT_GROUPS as any;

    if (Array.isArray(anyGroups) && anyGroups.length > 0) {
      return anyGroups.map((g: any, idx: number) => ({
        title: g?.title ?? `Group ${idx + 1}`,
        types: (g?.types ?? g ?? []) as EventType[],
      }));
    }

    const all = Object.keys(EVENT_LABELS as any) as EventType[];
    return [{ title: "Events", types: all }];
  }, []);

  if (!match) {
    return (
      <div style={{ padding: 16 }}>
        <p>Match not found.</p>
        <Link href="/">Back</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <h1 style={{ margin: 0 }}>
          Live: Balla vs {match.opponent}
        </h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 10 }}>
            <strong>Clock:</strong> {formatClock(clockSeconds)}
          </div>

          <button
            onClick={() => setClockRunning((v) => !v)}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #333" }}
          >
            {clockRunning ? "Pause clock" : "Start clock"}
          </button>

          <button
            onClick={undoLast}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #333" }}
            disabled={!match.events?.length}
          >
            Undo last
          </button>

          <Link href={`/match/${match.id}/setup`} style={{ marginLeft: "auto" }}>
            Edit setup →
          </Link>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveTeam("BALLA")}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #333",
              fontWeight: activeTeam === "BALLA" ? 700 : 400,
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
              fontWeight: activeTeam === "OPP" ? 700 : 400,
            }}
          >
            Opp
          </button>

          <button
            onClick={clearSticky}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #333" }}
          >
            Clear event
          </button>
        </div>

        {score && (
          <div style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 10 }}>
            <strong>Score:</strong>{" "}
            Balla {score.ballaGoals}-{score.ballaPoints} | Opp {score.oppGoals}-{score.oppPoints}
          </div>
        )}
      </div>

      {/* Event selection */}
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Select Event</h2>

        {groupedEventTypes.map((grp) => (
          <div key={grp.title} style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 700 }}>{grp.title}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {grp.types.map((t) => (
                <button
                  key={String(t)}
                  onClick={() => setActiveEvent(t)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #333",
                    fontWeight: activeEvent === t ? 700 : 400,
                  }}
                >
                  {(EVENT_LABELS as any)[t] ?? String(t)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Player number quick buttons */}
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Log Event (Player)</h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Array.from({ length: DEFAULT_MAX_NUMBER }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => logEvent(num)}
              disabled={!activeEvent}
              style={{
                width: 46,
                height: 40,
                borderRadius: 12,
                border: "1px solid #333",
                opacity: activeEvent ? 1 : 0.5,
              }}
              title={activeEvent ? `Log ${(EVENT_LABELS as any)[activeEvent] ?? activeEvent} for #${num}` : "Select an event first"}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => logEvent(undefined)}
            disabled={!activeEvent}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #333",
              opacity: activeEvent ? 1 : 0.5,
            }}
          >
            No player
          </button>
        </div>

        {!activeEvent && <div style={{ fontSize: 13, opacity: 0.8 }}>Select an event above first.</div>}
      </div>

      {/* Event log */}
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Event Log</h2>

        {match.events.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No events yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {match.events
              .slice()
              .reverse()
              .slice(0, 25)
              .map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    padding: "8px 10px",
                    border: "1px solid #eee",
                    borderRadius: 10,
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 70, fontVariantNumeric: "tabular-nums" }}>
                      {formatClock(ev.clockSeconds)}
                    </div>
                    <div style={{ fontWeight: 700 }}>{ev.team}</div>
                    <div>{(EVENT_LABELS as any)[ev.type] ?? String(ev.type)}</div>
                    {typeof ev.playerNumber === "number" && (
                      <div style={{ opacity: 0.85 }}>#{ev.playerNumber}</div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
