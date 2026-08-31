"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";

const OPTIONS = ["en", "sk"] as const;

export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function choose(next: (typeof OPTIONS)[number]) {
    if (next === locale || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="locale-switcher locale-segmented" role="group" aria-label={label}>
      {OPTIONS.map(option => (
        <button
          key={option}
          type="button"
          className={`locale-segment${locale === option ? " is-active" : ""}`}
          aria-pressed={locale === option}
          disabled={busy}
          onClick={() => void choose(option)}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
