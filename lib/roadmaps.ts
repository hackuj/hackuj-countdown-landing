import catalog from "./room-catalog.json" with { type: "json" };

export type RoadmapRoomRef = {
  roomSlug: string;
  title: string;
  description: string;
  category: string;
  estimatedMinutes: number;
  xp: number;
  skills: string[];
};

export type RoadmapSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  rooms: RoadmapRoomRef[];
};

export type RoadmapTrack = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  level: string;
  estimatedHours: number;
  skills: string[];
  rooms: RoadmapRoomRef[];
};

export type RoadmapDefinition = {
  id: string;
  title: string;
  subtitle: string;
  sections: RoadmapSection[];
  tracks: RoadmapTrack[];
  comingNext: string[];
};

type CatalogRoom = (typeof catalog)[number];

function roomRef(room: CatalogRoom): RoadmapRoomRef {
  return {
    roomSlug: room.slug,
    title: room.title,
    description: room.subtitle || room.description,
    category: room.category,
    estimatedMinutes: room.estimatedMinutes,
    xp: room.xp,
    skills: room.skills,
  };
}

function refsBySection(section: string) {
  return catalog.filter(room => room.roadmapSection === section).sort((a, b) => a.order - b.order).map(roomRef);
}

function refsByTrack(track: string) {
  return catalog.filter(room => room.roadmapTrack === track).sort((a, b) => a.order - b.order).map(roomRef);
}

export const cyberFoundationsRoadmap: RoadmapDefinition = {
  id: "cyber-foundations",
  title: "Cybersecurity Roadmap",
  subtitle: "A complete 50-room journey: finish the foundations, build the shared core, then choose a specialization.",
  sections: [
    {
      id: "start-here",
      eyebrow: "01 / Start here",
      title: "Foundations",
      description: "Learn the computing, networking, web, scripting, and workflow concepts that every later room assumes.",
      rooms: refsBySection("foundations"),
    },
    {
      id: "security-core",
      eyebrow: "02 / Security core",
      title: "Build shared security skills",
      description: "Move from general computing into security concepts used by analysts, testers, and engineers.",
      rooms: refsBySection("security-core"),
    },
  ],
  tracks: [
    {
      id: "security-analyst",
      code: "03A",
      title: "Security Analyst",
      subtitle: "Blue Team",
      description: "Investigate activity, read logs, triage alerts, build timelines, and explain what happened.",
      level: "Beginner to intermediate",
      estimatedHours: 22,
      skills: ["Detection", "Log analysis", "Incident response"],
      rooms: refsByTrack("security-analyst"),
    },
    {
      id: "penetration-tester",
      code: "03B",
      title: "Penetration Tester",
      subtitle: "Red Team",
      description: "Enumerate targets, test web and Linux weaknesses, capture flags, and document impact.",
      level: "Beginner to intermediate",
      estimatedHours: 26,
      skills: ["Enumeration", "Web exploitation", "Privilege escalation"],
      rooms: refsByTrack("penetration-tester"),
    },
    {
      id: "security-engineer",
      code: "03C",
      title: "Security Engineer",
      subtitle: "Engineering",
      description: "Harden systems, protect secrets, reason about containers, cloud, and CI/CD guardrails.",
      level: "Intermediate",
      estimatedHours: 18,
      skills: ["Hardening", "Cloud", "DevSecOps"],
      rooms: refsByTrack("security-engineer"),
    },
  ],
  comingNext: [
    "Active Directory",
    "SOC Fundamentals",
    "Cloud Security Projects",
    "Advanced Web Exploitation",
  ],
};
