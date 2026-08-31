"use client";

import { useActionState, type ReactNode } from "react";
import { CopyButton } from "./CopyButton";

export type SecretActionState = { value: string; error?: string };
type SecretAction = (previous: SecretActionState, formData: FormData) => Promise<SecretActionState>;

/**
 * Keeps one-time credentials in the encrypted Server Action response instead of putting them in a
 * redirect URL, where browser history, access logs and analytics could retain them.
 */
export function SecretActionForm({
  action, children, className, notice, detail,
}: {
  action: SecretAction;
  children: ReactNode;
  className?: string;
  notice: string;
  detail?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { value: "" });
  return (
    <>
      <form action={formAction} className={className} aria-busy={pending}>
        {children}
      </form>
      {state.error && <div className="result bad school-feedback">{state.error}</div>}
      {state.value && (
        <div className="join-code" role="status">
          <span>{notice}</span>
          <div className="join-code-row">
            <strong>{state.value}</strong>
            <CopyButton text={state.value} />
          </div>
          {detail && <small>{detail}</small>}
        </div>
      )}
    </>
  );
}
