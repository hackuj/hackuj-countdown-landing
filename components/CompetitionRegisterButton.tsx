"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Registers the viewer for an event. When the event is invite-only the button is paired with a
 * code field; the server is what enforces it, this only collects it.
 */
export function CompetitionRegisterButton({ competitionId, kind, teamId, disabled = false, labels, requiresInvite = false }: {
  competitionId: string; kind: "solo" | "team" | "school_team"; teamId?: string; disabled?: boolean;
  labels: { idle: string; busy: string; failed: string; invitePlaceholder?: string };
  requiresInvite?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function register() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/competitions/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId, kind, teamId, inviteCode: requiresInvite ? code.trim() : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error || labels.failed);
      router.refresh();
    } catch {
      setError(labels.failed);
    } finally {
      setBusy(false);
    }
  }

  return <div className="register-control">
    {requiresInvite && (
      <input className="invite-input" value={code} onChange={e => setCode(e.target.value)}
        placeholder={labels.invitePlaceholder ?? "EVENT-..."} autoCapitalize="characters" autoComplete="off" />
    )}
    <button onClick={register} disabled={disabled || busy || (requiresInvite && code.trim().length < 3)} className="btn primary">
      {busy ? labels.busy : labels.idle}
    </button>
    {error && <small className="inline-error">{error}</small>}
  </div>;
}
