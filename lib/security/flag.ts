import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Flags are high-entropy secrets, so a keyed hash is the right primitive — the same reasoning as
 * join codes, and for the same reason NOT a slow password KDF.
 *
 * The pepper lives only in the environment, so a leaked challenges table discloses no answers.
 * A domain prefix keeps this hash space disjoint from the join-code one even though both may be
 * derived from the same secret: a flag can never be replayed as a join code, or the reverse.
 */
function pepper() {
  const raw = process.env.FLAG_PEPPER || process.env.JOIN_CODE_PEPPER;
  if (!raw || raw.length < 16) throw new Error("FLAG_PEPPER (or JOIN_CODE_PEPPER) is required to hash challenge flags.");
  return raw;
}

/** Flags compare case-sensitively but tolerate stray whitespace around them. */
function normalize(flag: string) {
  return flag.trim();
}

export function hashFlag(flag: string) {
  return createHmac("sha256", pepper()).update(`flag:${normalize(flag)}`).digest("hex");
}

export function flagMatches(storedHash: string, submitted: string) {
  const candidate = Buffer.from(hashFlag(submitted));
  const stored = Buffer.from(storedHash ?? "");
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}
