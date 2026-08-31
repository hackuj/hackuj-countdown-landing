"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CopyButton } from "./CopyButton";

/**
 * The event surface, laid out the way a CTF board actually works: challenges grouped by category,
 * a compact card per task, and the whole solve loop inside a dialog — read the brief, grab the
 * handouts, submit the flag, see the board move — without ever leaving the page.
 *
 * It follows rCTF's model throughout: a dynamic challenge shows its live value (which falls for
 * everyone as solves accumulate), a King of the Hill challenge takes no flag and shows the current
 * standings instead, and the scoreboard carries the score graph, division filter and exports that
 * players expect from an rCTF event.
 */

export type BoardChallenge = {
  id: string; slug: string; title: string; category: string; difficulty: number;
  points: number; solves: number; description: string; objective?: string; hint?: string;
  connectionInfo?: string; files?: { id: string; name: string; kb: number }[];
  author?: string; kind?: "jeopardy" | "koth"; dynamic?: boolean;
  pointsMin?: number; pointsMax?: number;
  firstBlood?: string | null;
  standings?: { name: string; points: number }[];
};

export type BoardRow = { entryId: string; name: string; solves: number; score: number; kind: string };
export type BoardNotice = { id: string; title: string; body: string; createdAt: string };
export type BoardPoint = { entryId: string; at: string; score: number };

export type BoardCopy = {
  all: string; solved: string; solves: string; points: string; scoreboard: string; score: string;
  noChallenges: string; noScoreboard: string; close: string; objective: string; hint: string;
  revealHint: string; connection: string; handouts: string; flag: string; submit: string;
  submitting: string; solvedAlready: string; gained: string; ratingLabel: string;
  locked: string; difficulty: string;
  standings: string; noHolder: string; koth: string;
  divSolo: string; divTeam: string; divSchool: string;
  firstBlood: string; history: string; noSolves: string;
  solvers: string; frozen: string;
};

/** Distinct enough to tell ten lines apart, and readable on both themes. */
const LINE_COLOURS = [
  "#D61F34", "#31081F", "#808F85", "#595959", "#8E44AD",
  "#1F78B4", "#E67E22", "#16A085", "#B7950B", "#C0392B",
];

function ScoreGraph({ points, rows, meId }: { points: BoardPoint[]; rows: BoardRow[]; meId: string | null }) {
  const top = rows.slice(0, 10);
  const series = useMemo(() => {
    const byEntry = new Map<string, { t: number; score: number }[]>();
    for (const p of points) {
      if (!top.some(r => r.entryId === p.entryId)) continue;
      const list = byEntry.get(p.entryId) ?? [];
      list.push({ t: new Date(p.at).getTime(), score: p.score });
      byEntry.set(p.entryId, list);
    }
    return [...byEntry.entries()].map(([entryId, list]) => ({
      entryId,
      name: top.find(r => r.entryId === entryId)?.name ?? "",
      list: list.sort((a, b) => a.t - b.t),
    }));
  }, [points, top]);

  if (!series.length) return null;

  const times = series.flatMap(s => s.list.map(p => p.t));
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const maxScore = Math.max(1, ...series.flatMap(s => s.list.map(p => p.score)));
  const W = 300, H = 120, PAD = 6;
  // A single-moment event would divide by zero; flatten it to the right-hand edge instead.
  const spanT = maxT - minT || 1;
  const x = (t: number) => PAD + ((t - minT) / spanT) * (W - PAD * 2);
  const y = (s: number) => H - PAD - (s / maxScore) * (H - PAD * 2);

  return (
    <div className="score-graph">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Score over time" preserveAspectRatio="none">
        {series.map((s, i) => {
          // Each solve is a step: the score holds until the next one, it does not slope between.
          const path = s.list.map((p, n) =>
            n === 0 ? `M ${x(p.t)} ${y(0)} L ${x(p.t)} ${y(p.score)}` : `L ${x(p.t)} ${y(s.list[n - 1].score)} L ${x(p.t)} ${y(p.score)}`,
          ).join(" ") + ` L ${x(maxT)} ${y(s.list[s.list.length - 1].score)}`;
          return (
            <path key={s.entryId} d={path} fill="none"
                  stroke={LINE_COLOURS[i % LINE_COLOURS.length]}
                  strokeWidth={s.entryId === meId ? 2.4 : 1.3}
                  strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          );
        })}
      </svg>
      <div className="score-legend">
        {series.map((s, i) => (
          <span key={s.entryId}>
            <i style={{ background: LINE_COLOURS[i % LINE_COLOURS.length] }} />{s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function EventBoard({
  challenges, scoreboard, entryId, solvedIds, copy, canPlay,
  notices = [], timeline = [], competitionId, frozen = false,
}: {
  challenges: BoardChallenge[];
  scoreboard: BoardRow[];
  entryId: string | null;
  solvedIds: string[];
  copy: BoardCopy;
  canPlay: boolean;
  notices?: BoardNotice[];
  timeline?: BoardPoint[];
  competitionId: string;
  frozen?: boolean;
}) {
  const [solved, setSolved] = useState(() => new Set(solvedIds));
  const [board, setBoard] = useState(scoreboard);
  const [category, setCategory] = useState<string>("__all");
  const [division, setDivision] = useState<string>("__all");
  const [open, setOpen] = useState<BoardChallenge | null>(null);
  const [profile, setProfile] = useState<{ name: string; solves: { title: string; category: string; points: number; solvedAt: string }[] } | null>(null);
  const [flag, setFlag] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; xp?: number; rating?: number } | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [solvers, setSolvers] = useState<{ pos: number; name: string; solvedAt: string }[] | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const categories = useMemo(() => [...new Set(challenges.map(c => c.category))].sort(), [challenges]);
  const visible = useMemo(
    () => challenges.filter(c => category === "__all" || c.category === category),
    [challenges, category],
  );
  const shownBoard = useMemo(
    () => board.filter(r => division === "__all" || r.kind === division),
    [board, division],
  );
  // A division with nobody in it is not offered, so the filter row only shows real choices.
  const divisions = useMemo(
    () => [
      { key: "__all", label: copy.all },
      { key: "solo", label: copy.divSolo },
      { key: "team", label: copy.divTeam },
      { key: "school_team", label: copy.divSchool },
    ].filter(d => d.key === "__all" || board.some(r => r.kind === d.key)),
    [board, copy],
  );

  const isSolved = useCallback((c: BoardChallenge) => solved.has(c.id) || solved.has(c.slug), [solved]);

  function openChallenge(c: BoardChallenge) {
    setOpen(c);
    setProfile(null);
    setFlag("");
    setResult(null);
    setHintShown(false);
    setSolvers(null);
    // Who cleared it, loaded alongside the brief — the list rCTF shows inside a challenge.
    fetch(`/api/competitions/${competitionId}/challenges/${c.id}/solvers`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => setSolvers(data?.solvers ?? []))
      .catch(() => setSolvers([]));
  }

  const close = useCallback(() => { setOpen(null); setProfile(null); }, []);

  async function openProfile(row: BoardRow) {
    setOpen(null);
    setProfile({ name: row.name, solves: [] });
    try {
      const res = await fetch(`/api/competitions/${competitionId}/entrants/${row.entryId}`);
      if (res.ok) setProfile(await res.json());
    } catch {
      // Leaving the dialog with an empty list is honest: the profile could not be loaded.
    }
  }

  // Escape closes, and focus moves into the dialog so the keyboard follows the eye.
  useEffect(() => {
    if (!open && !profile) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [open, profile, close]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!open) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/rctf/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: open.id, flag, entryId: entryId ?? undefined }),
      });
      const data = await res.json().catch(() => ({}));
      const first = data?.progress?.firstSolve;
      setResult({
        ok: Boolean(data.ok),
        message: data.message ?? "",
        xp: first ? data.progress.xpAwarded : undefined,
        rating: first ? data.progress.ratingDelta : undefined,
      });
      if (data.ok) {
        // Reflect the solve immediately: mark the card and move this entrant up the board.
        setSolved(prev => new Set(prev).add(open.id));
        if (first && entryId) {
          setBoard(prev => [...prev]
            .map(r => r.entryId === entryId ? { ...r, solves: r.solves + 1, score: r.score + open.points } : r)
            .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)));
        }
      }
    } catch {
      setResult({ ok: false, message: "" });
    } finally {
      setBusy(false);
    }
  }

  const solvedCount = challenges.filter(isSolved).length;
  const koth = open?.kind === "koth";

  return <div className="board">
    <div className="board-main">
      {notices.length > 0 && (
        <div className="board-notices">
          {notices.map(n => (
            <article key={n.id}>
              <strong>{n.title}</strong>
              {n.body && <p>{n.body}</p>}
              <time dateTime={n.createdAt}>{new Date(n.createdAt).toLocaleString()}</time>
            </article>
          ))}
        </div>
      )}

      {frozen && <div className="board-frozen">{copy.frozen}</div>}

      <div className="board-filters">
        <button className={category === "__all" ? "chip active" : "chip"} onClick={() => setCategory("__all")}>
          {copy.all} <b>{challenges.length}</b>
        </button>
        {categories.map(name => (
          <button key={name} className={category === name ? "chip active" : "chip"} onClick={() => setCategory(name)}>
            {name} <b>{challenges.filter(c => c.category === name).length}</b>
          </button>
        ))}
        <span className="board-progress">{solvedCount}/{challenges.length}</span>
      </div>

      {visible.length ? (
        <div className="board-grid">
          {visible.map(c => {
            const done = isSolved(c);
            return (
              <button key={c.id} className={done ? "board-card is-solved" : "board-card"} onClick={() => openChallenge(c)}>
                <span className="board-card-top">
                  <span className="board-cat">{c.category}</span>
                  <span className="board-points">
                    {c.points}
                    {c.dynamic && <i className="board-decay" title={`${c.pointsMin}–${c.pointsMax}`}>▼</i>}
                  </span>
                </span>
                <strong>{c.title}</strong>
                {c.kind === "koth" && <span className="board-koth">{copy.koth}</span>}
                <span className="board-card-foot">
                  <span className="difficulty-meter" aria-label={`${copy.difficulty} ${c.difficulty}/5`}>
                    {[1, 2, 3, 4, 5].map(n => <i key={n} className={n <= c.difficulty ? "on" : undefined} />)}
                  </span>
                  <span>{c.solves} {copy.solves}</span>
                </span>
                {c.firstBlood && <span className="board-blood" title={`${copy.firstBlood}: ${c.firstBlood}`}>🩸 {c.firstBlood}</span>}
                {done && <span className="board-solved">{copy.solved}</span>}
              </button>
            );
          })}
        </div>
      ) : <div className="empty-state"><span>{copy.noChallenges}</span></div>}
    </div>

    <aside className="board-side">
      <div className="surface-label"><h2>{copy.scoreboard}</h2><span>{shownBoard.length}</span></div>

      <ScoreGraph points={timeline} rows={shownBoard} meId={entryId} />

      {divisions.length > 2 && (
        <div className="board-filters board-divisions">
          {divisions.map(d => (
            <button key={d.key} className={division === d.key ? "chip active" : "chip"} onClick={() => setDivision(d.key)}>
              {d.label}
            </button>
          ))}
        </div>
      )}

      {shownBoard.length ? (
        <div className="leaderboard">
          {shownBoard.map((row, i) => (
            <button
              className={entryId && row.entryId === entryId ? "leader-row me" : "leader-row"}
              key={row.entryId}
              onClick={() => openProfile(row)}
            >
              <span className="leader-rank">#{i + 1}</span>
              <div><strong>{row.name}</strong><small>{row.solves} {copy.solves}</small></div>
              <b>{row.score} <small>{copy.score}</small></b>
            </button>
          ))}
        </div>
      ) : <div className="empty-state"><span>{copy.noScoreboard}</span></div>}

      <div className="board-exports">
        <a href={`/api/competitions/${competitionId}/scoreboard?format=csv`}>CSV</a>
        <a href={`/api/competitions/${competitionId}/scoreboard?format=ctftime`}>CTFtime</a>
        <a href={`/api/competitions/${competitionId}/scoreboard`}>JSON</a>
      </div>
    </aside>

    {(open || profile) && (
      <div className="board-overlay" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
        <div className="board-dialog" role="dialog" aria-modal="true"
             aria-label={open?.title ?? profile?.name ?? ""} tabIndex={-1} ref={dialogRef}>

          {profile && (
            <>
              <header>
                <div>
                  <span className="challenge-admin-meta"><span>{copy.history}</span></span>
                  <h2>{profile.name}</h2>
                </div>
                <button className="btn ghost" onClick={close} aria-label={copy.close}>✕</button>
              </header>
              <div className="activity-list">
                {profile.solves.map(s => (
                  <div className="review-history" key={`${s.title}-${s.solvedAt}`}>
                    <span className="status">{s.category}</span>
                    <div><strong>{s.title}</strong><small>{new Date(s.solvedAt).toLocaleString()}</small></div>
                    <b>{s.points}</b>
                  </div>
                ))}
                {!profile.solves.length && <div className="empty-state"><span>{copy.noSolves}</span></div>}
              </div>
            </>
          )}

          {open && (
            <>
              <header>
                <div>
                  <span className="challenge-admin-meta">
                    <span>{open.category}</span><span>D{open.difficulty}</span>
                    <span>{open.points} {copy.points}</span><span>{open.solves} {copy.solves}</span>
                    {open.author && <span>by {open.author}</span>}
                  </span>
                  <h2>{open.title}</h2>
                </div>
                <button className="btn ghost" onClick={close} aria-label={copy.close}>✕</button>
              </header>

              <p className="board-desc">{open.description}</p>
              {open.objective && <div className="brief-box"><strong>{copy.objective}</strong><span>{open.objective}</span></div>}
              {open.connectionInfo && <div className="brief-box"><strong>{copy.connection}</strong><div className="brief-code-row"><code>{open.connectionInfo}</code><CopyButton text={open.connectionInfo}/></div></div>}

              {open.files && open.files.length > 0 && (
                <div className="handout-list">
                  <strong>{copy.handouts}</strong>
                  {open.files.map(f => (
                    <a className="handout" key={f.id} href={`/api/challenges/files/${f.id}`}>
                      <span>{f.name}</span><b>{f.kb} KB</b>
                    </a>
                  ))}
                </div>
              )}

              {open.hint && (hintShown
                ? <div className="brief-box"><strong>{copy.hint}</strong><span>{open.hint}</span></div>
                : <button className="btn ghost board-hint" onClick={() => setHintShown(true)}>{copy.revealHint}</button>)}

              {/* A King of the Hill challenge is not solved with a flag: it is held, and the
                  standings its scoring backend pushes are the whole answer. */}
              {koth ? (
                <div className="koth-standings">
                  <strong>{copy.standings}</strong>
                  {open.standings?.length ? open.standings.map((s, i) => (
                    <div className="leader-row" key={s.name}>
                      <span className="leader-rank">#{i + 1}</span>
                      <div><strong>{s.name}</strong></div>
                      <b>{s.points}</b>
                    </div>
                  )) : <div className="empty-state"><span>{copy.noHolder}</span></div>}
                </div>
              ) : (
                <>
                  {isSolved(open) && !result && <div className="result ok">{copy.solvedAlready}</div>}
                  {canPlay ? (
                    <form onSubmit={submit} className="board-submit">
                      <input value={flag} onChange={e => setFlag(e.target.value)} placeholder="OMNI{...}" autoComplete="off" spellCheck={false} />
                      <button className="btn primary" type="submit" disabled={busy || !flag.trim()}>
                        {busy ? copy.submitting : copy.submit}
                      </button>
                    </form>
                  ) : <div className="result bad">{copy.locked}</div>}
                </>
              )}

              {solvers && solvers.length > 0 && (
                <div className="solver-list">
                  <strong>{copy.solvers}</strong>
                  {solvers.slice(0, 25).map(entry => (
                    <div key={`${entry.pos}-${entry.name}`}>
                      <span>#{entry.pos}</span>
                      <b>{entry.name}</b>
                      <time dateTime={entry.solvedAt}>{new Date(entry.solvedAt).toLocaleString()}</time>
                    </div>
                  ))}
                </div>
              )}

              {result && (
                <div className={result.ok ? "result ok" : "result bad"}>
                  {result.message}
                  {result.xp !== undefined && <> · <b>+{result.xp} XP</b> · <b>+{result.rating} {copy.ratingLabel}</b></>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )}
  </div>;
}
