import type { Locale } from "@/lib/i18n";

/**
 * Drawn flag marks for the language picker. Emoji flags are deliberately avoided: Windows ships
 * no country-flag glyphs, so they degrade to the very letter pairs this control replaces.
 *
 * English is the platform's *global* experience rather than a country, so it carries a globe
 * rather than a national flag.
 */
export function Flag({ locale, size = 20 }: { locale: Locale; size?: number }) {
  const common = { width: size, height: size * 0.7, viewBox: "0 0 20 14", "aria-hidden": true as const };
  const frame = <rect x=".5" y=".5" width="19" height="13" rx="2.5" fill="none" stroke="rgba(0,0,0,.22)"/>;

  if (locale === "ro") {
    return <svg {...common} className="flag">
      <defs><clipPath id="ro-clip"><rect width="20" height="14" rx="3"/></clipPath></defs>
      <g clipPath="url(#ro-clip)">
        <rect width="6.67" height="14" fill="#002B7F"/>
        <rect x="6.67" width="6.67" height="14" fill="#FCD116"/>
        <rect x="13.34" width="6.66" height="14" fill="#CE1126"/>
      </g>
      {frame}
    </svg>;
  }

  if (locale === "sk") {
    return <svg {...common} className="flag">
      <defs><clipPath id="sk-clip"><rect width="20" height="14" rx="3"/></clipPath></defs>
      <g clipPath="url(#sk-clip)">
        <rect width="20" height="4.67" fill="#FFFFFF"/>
        <rect y="4.67" width="20" height="4.67" fill="#0B4EA2"/>
        <rect y="9.34" width="20" height="4.66" fill="#EE1C25"/>
        {/* Simplified state arms: red shield, white double cross on a blue mound. */}
        <path d="M4 3.4h5.6v5.1c0 2.2-1.6 3.3-2.8 3.9-1.2-.6-2.8-1.7-2.8-3.9V3.4Z" fill="#EE1C25" stroke="#FFFFFF" strokeWidth=".7"/>
        <path d="M6.8 4.6v5.9M5.5 6.1h2.6M5.1 7.6h3.4" stroke="#FFFFFF" strokeWidth=".85" strokeLinecap="round"/>
        <path d="M4.9 10.2c.6-.7 3.2-.7 3.8 0" stroke="#0B4EA2" strokeWidth=".8" fill="none" strokeLinecap="round"/>
      </g>
      {frame}
    </svg>;
  }

  return <svg {...common} className="flag">
    <defs><clipPath id="en-clip"><rect width="20" height="14" rx="3"/></clipPath></defs>
    <g clipPath="url(#en-clip)">
      <rect width="20" height="14" fill="currentColor" opacity=".08"/>
      <g stroke="currentColor" strokeWidth=".9" fill="none" opacity=".85">
        <circle cx="10" cy="7" r="4.6"/>
        <path d="M10 2.4v9.2M5.4 7h9.2"/>
        <path d="M10 2.4c1.6 1.6 2.1 3.1 2.1 4.6S11.6 10 10 11.6C8.4 10 7.9 8.5 7.9 7s.5-3 2.1-4.6Z"/>
      </g>
    </g>
    {frame}
  </svg>;
}
