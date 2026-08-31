export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
};

export type UserMetrics = {
  level: number;
  xp: number;
  rating: number;
  streak: number;
  teamId?: string | null;
  schoolId?: string | null;
  skills: Record<string, number>;
  solveCount?: number;
};

export function evaluateAchievements(metrics: UserMetrics): Badge[] {
  const skills = metrics.skills || {};
  const activeSkillsCount = Object.values(skills).filter(v => v >= 30).length;
  const solves = metrics.solveCount ?? (metrics.xp > 0 ? Math.max(1, Math.floor(metrics.xp / 180)) : 0);

  return [
    {
      id: "first_blood",
      name: "First Contact",
      description: "Capture your first challenge flag in the arena.",
      icon: "flag",
      unlocked: solves >= 1,
      progress: Math.min(100, (solves / 1) * 100),
    },
    {
      id: "streak_7",
      name: "Streak Master",
      description: "Maintain an active training streak for 7 consecutive days.",
      icon: "bolt",
      unlocked: metrics.streak >= 7,
      progress: Math.min(100, Math.round((metrics.streak / 7) * 100)),
    },
    {
      id: "polymath",
      name: "Cyber Polymath",
      description: "Reach 30%+ proficiency across at least 4 skill domains.",
      icon: "target",
      unlocked: activeSkillsCount >= 4,
      progress: Math.min(100, Math.round((activeSkillsCount / 4) * 100)),
    },
    {
      id: "web_adept",
      name: "Web Exploitation Adept",
      description: "Attain 70%+ proficiency in Web Security.",
      icon: "terminal",
      unlocked: (skills.Web ?? 0) >= 70,
      progress: Math.min(100, Math.round(((skills.Web ?? 0) / 70) * 100)),
    },
    {
      id: "crypto_analyst",
      name: "Cryptanalyst",
      description: "Attain 70%+ proficiency in Cryptography.",
      icon: "lock",
      unlocked: (skills.Crypto ?? 0) >= 70,
      progress: Math.min(100, Math.round(((skills.Crypto ?? 0) / 70) * 100)),
    },
    {
      id: "high_tier",
      name: "Competitive Contender",
      description: "Achieve a Cyber Rating of 1,200 or higher.",
      icon: "trophy",
      unlocked: metrics.rating >= 1200,
      progress: Math.min(100, Math.round((metrics.rating / 1200) * 100)),
    },
    {
      id: "team_player",
      name: "Team Operator",
      description: "Join or create a team for collaborative tournaments.",
      icon: "team",
      unlocked: Boolean(metrics.teamId),
      progress: metrics.teamId ? 100 : 0,
    },
    {
      id: "school_pride",
      name: "Academic Representative",
      description: "Connect your profile to a verified educational institution.",
      icon: "school",
      unlocked: Boolean(metrics.schoolId),
      progress: metrics.schoolId ? 100 : 0,
    },
  ];
}
