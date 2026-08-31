import { NextResponse } from "next/server";

type SupabaseErrorLike = { code?: string; message?: string; details?: string; hint?: string } | null;

/**
 * Convert a Supabase/PostgREST error into a client response without leaking internals.
 *
 * Our SECURITY DEFINER RPCs communicate user-facing problems with `raise exception`,
 * which PostgREST surfaces as SQLSTATE `P0001`. Those messages are deliberate and safe to
 * show. Any other error (unique violations, check constraints, connection failures, ...) may
 * expose schema or infrastructure detail, so it is logged server-side and masked with `fallback`.
 */
export function rpcErrorResponse(error: SupabaseErrorLike, fallback: string, status = 400) {
  const raised = error?.code === "P0001" && typeof error.message === "string" && error.message.length > 0;
  if (!raised) console.error("[api] unexpected supabase error:", error);
  return NextResponse.json({ error: raised ? error!.message : fallback }, { status });
}

/** A plain, already-safe error message. Never pass raw exception text here. */
export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
