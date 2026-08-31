"use client";

import { useEffect, useState } from "react";
import { THEME_COOKIE, type Theme } from "@/lib/theme";

/**
 * Applies the theme instantly by flipping data-theme on <html> (CSS reacts immediately, no
 * re-render or round trip), then persists it in a cookie so the server can render the right
 * theme on the next request. With no cookie the stylesheet follows prefers-color-scheme.
 */
export function ThemeToggle({ labels }: { labels: { theme: string; light: string; dark: string } }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const attr = document.documentElement.dataset.theme;
    if (attr === "light" || attr === "dark") { setTheme(attr); return; }
    setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
  }

  const isDark = theme === "dark";
  // Before hydration resolves the theme, render the control in a neutral state so the markup
  // matches the server output and no icon flashes the wrong way.
  return <button type="button" className="theme-toggle" onClick={toggle} aria-pressed={theme ? isDark : undefined}
    aria-label={`${labels.theme}: ${theme ? (isDark ? labels.dark : labels.light) : labels.theme}`} title={labels.theme}>
    <span className="theme-toggle__track" aria-hidden="true">
      <span className={`theme-toggle__thumb${isDark ? " is-dark" : ""}`}/>
      <svg className="theme-icon theme-icon--sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
        <circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>
      </svg>
      <svg className="theme-icon theme-icon--moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 14.4A8.4 8.4 0 0 1 9.6 4a8.4 8.4 0 1 0 10.4 10.4Z"/>
      </svg>
    </span>
  </button>;
}
