export const THEME_COOKIE = "omni-theme";
export type Theme = "light" | "dark";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * Default theme is dark for the cybersecurity terminal console experience.
 */
export function resolveTheme(value: unknown): Theme {
  return value === "light" ? "light" : "dark";
}
