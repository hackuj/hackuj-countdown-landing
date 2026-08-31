export type Skill = "Web" | "OSINT" | "Crypto" | "Forensics" | "Linux";

export type User = {
  id: string;
  username: string;
  displayName: string;
  level: number;
  xp: number;
  rating: number;
  rank: string;
  country: string;
  streak: number;
  teamId?: string;
  schoolId?: string;
  skills: Record<Skill, number>;
  isAdmin?: boolean;
};

export type Team = {
  id: string;
  name: string;
  rating: number;
  rank: number;
  division: string;
  country: string;
  schoolId?: string;
  memberIds: string[];
};

export type School = {
  id: string;
  name: string;
  city: string;
  region: string;
  country: string;
  rating: number;
  rank: number;
  playerCount: number;
  teamIds: string[];
};

export type Challenge = {
  id: string;
  slug: string;
  title: string;
  category: Skill;
  difficulty: 1 | 2 | 3 | 4 | 5;
  points: number;
  xp: number;
  solvedBy: number;
  description: string;
  objective: string;
  hint: string;
  mockFlag: string;
};

export type Competition = {
  id: string;
  title: string;
  mode: "Solo" | "Team" | "School" | "Open";
  status: "Live" | "Upcoming" | "Finished";
  startsAt: string;
  players: number;
  prize: string;
};
