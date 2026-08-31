import React from "react";

type IconName = "home" | "target" | "swords" | "chart" | "users" | "school" | "trophy" | "shield" | "bolt" | "flag" | "team" | "terminal" | "search" | "lock" | "disk" | "linux" | "calendar" | "arrow";

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const p: Record<IconName, React.ReactNode> = {
    home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/></>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"/></>,
    swords: <><path d="m4 4 7 7M2.5 7.5 7.5 2.5M13 13l7 7M16.5 21.5l5-5"/><path d="m20 4-7 7M21.5 7.5l-5-5M11 13l-7 7M7.5 21.5l-5-5"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/><path d="M3 20h20"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2-6 6-6s6 2 6 6"/><circle cx="18" cy="9" r="2"/><path d="M16 15c3 0 5 1.5 5 5"/></>,
    school: <><path d="M3 10h18M5 10v9M9 10v9M15 10v9M19 10v9M2 20h20"/><path d="m12 3 9 5H3l9-5Z"/></>,
    trophy: <><path d="M8 4h8v5c0 4-2 6-4 6s-4-2-4-6V4Z"/><path d="M8 6H4v2c0 2 1 4 4 4M16 6h4v2c0 2-1 4-4 4M12 15v4M8 21h8"/></>,
    shield: <path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"/>,
    bolt: <path d="m13 2-7 11h6l-1 9 7-12h-6l1-8Z"/>,
    flag: <><path d="M5 22V4"/><path d="M5 5h11l-2 4 2 4H5"/></>,
    team: <><circle cx="8" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><path d="M2 20c0-4 2-6 6-6s6 2 6 6M10 20c0-4 2-6 7-6 3.5 0 5 2 5 6"/></>,
    terminal: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/></>,
    search: <><circle cx="11" cy="11" r="6"/><path d="m16 16 5 5"/></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    disk: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v5M21 12h-5M12 21v-5M3 12h5"/></>,
    linux: <><path d="M8 9c0-4 1.5-6 4-6s4 2 4 6v4c0 4-1 7-4 7s-4-3-4-7V9Z"/><path d="M9 10h6M10 15h4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
    arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
  };
  return <svg {...common} aria-hidden="true">{p[name]}</svg>;
}
