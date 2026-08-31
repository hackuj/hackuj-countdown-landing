export function Leaderboard({ rows, me, locale, ratingLabel, empty }: { rows: { rank: number; name: string; meta: string; score: number }[]; me?: string; locale:string; ratingLabel:string; empty:string }) {
  if (!rows.length) return <div className="empty-state">{empty}</div>;
  return <div className="leaderboard">{rows.map((r) => <div key={`${r.rank}-${r.name}`} className={r.name === me ? "leader-row me" : "leader-row"}><span className="leader-rank">#{r.rank}</span><div><strong>{r.name}</strong><small>{r.meta}</small></div><b>{r.score.toLocaleString(locale)} <small>{ratingLabel}</small></b></div>)}</div>;
}
