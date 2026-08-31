import Link from "next/link";
import { Challenge } from "@/lib/types";
import { Icon } from "./Icon";

type IconName = Parameters<typeof Icon>[0]["name"];

const icons: Record<string, IconName> = {
  Web: "terminal",
  OSINT: "search",
  Crypto: "lock",
  Forensics: "disk",
  Linux: "linux",
  Pwn: "terminal",
  Rev: "bolt",
  Misc: "target",
};

export function ChallengeCard({ challenge, entryId, labels, solved = false }: { challenge: Challenge; entryId?: string; labels: { pts: string; solves: string; solved: string }; solved?: boolean }) {
  const href = entryId ? `/challenge/${challenge.slug}?entry=${encodeURIComponent(entryId)}` : `/challenge/${challenge.slug}`;
  const iconName = icons[challenge.category] ?? "target";
  const catClass = challenge.category ? challenge.category.toLowerCase().replace(/[^a-z0-9]/g, "-") : "misc";
  return <Link href={href} className={solved ? "challenge-card is-solved" : "challenge-card"}>
    <div className={`challenge-icon cat-${catClass}`}><Icon name={iconName}/></div>
    <div className="challenge-meta"><span>{challenge.category}</span>{solved && <span className="solved-tag">{labels.solved}</span>}<span className="difficulty-meter" aria-label={`Difficulty ${challenge.difficulty}/5`}>{[1,2,3,4,5].map(n=><i key={n} className={n<=challenge.difficulty?"on":undefined}/>)}</span></div>
    <h3>{challenge.title}</h3><p>{challenge.description}</p>
    <div className="challenge-footer"><span><strong>{challenge.points}</strong> {labels.pts}</span><span>+{challenge.xp} XP</span><span>{challenge.solvedBy} {labels.solves}</span></div>
  </Link>;
}
