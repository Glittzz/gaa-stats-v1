"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getMatch, upsertMatch } from "../../../../lib/storage";
import { Match } from "../../../../lib/types";

export default function SetupPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [match, setMatch] = useState<Match | null>(null);
  const [maxNumber, setMaxNumber] = useState(25);
  const [halfMinutes, setHalfMinutes] = useState(30);

  useEffect(() => {
  const m = getMatch(id);
  if (!m) return;
  setMatch(m);

  // pull saved settings into local state
  setMaxNumber(m.maxNumber ?? 25);
  setHalfMinutes(m.halfMinutes ?? 30);
}, [id]);

  const numbers = useMemo(() => Array.from({ length: maxNumber }, (_, i) => i + 1), [maxNumber]);

  function setName(n: number, name: string) {
    if (!match) return;
const next: Match = {
  ...match,
  panel: { ...match.panel, [n]: name },
  maxNumber,
  halfMinutes,
};
    setMatch(next);
    upsertMatch(next);
  }
function setHalf(n: number) {
  if (!match) return;
  const next: Match = { ...match, halfMinutes: n };
  setMatch(next);
  setHalfMinutes(n);
  upsertMatch(next);
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
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 style={{ marginTop: 0 }}>Panel Setup</h1>
          <div style={{ opacity: 0.8 }}>
            Balla vs {match.opponent} • {match.matchDateISO}
          </div>
        </div>

<Link
  href={`/match/${match.id}`}
  onClick={() => {
    const next: Match = { ...match, maxNumber, halfMinutes };
    setMatch(next);
    upsertMatch(next);
  }}
  style={{ textDecoration: "none", padding: "10px 12px", border: "1px solid #333" }}
>
  Go Live
</Link>
      </div>

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
        <label>
          Max jersey number
          <select
            value={maxNumber}
            onChange={(e) => setMaxNumber(Number(e.target.value))}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc", marginTop: 6 }}
          >
            {[15, 20, 25, 30].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <p style={{ marginBottom: 0, opacity: 0.8 }}>
          Names are optional. If you leave them blank, the app still records stats by number.
        </p>
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {numbers.map((n) => (
          <div key={n} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>#{n}</div>
            <input
              value={match.panel?.[n] ?? ""}
              onChange={(e) => setName(n, e.target.value)}
              placeholder="Player name (optional)"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link href="/" style={{ textDecoration: "none", padding: "10px 12px", border: "1px solid #333", borderRadius: 12 }}>
          Home
        </Link>

        <Link
          href={`/match/${match.id}/summary`}
          style={{ textDecoration: "none", padding: "10px 12px", border: "1px solid #333", borderRadius: 12 }}
        >
          Summary
        </Link>
      </div>
    </div>
  );
}
