import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

// Join codes are high-entropy random tokens, so a fast keyed hash is the right primitive — NOT a
// slow password KDF (bcrypt/argon2), which only helps low-entropy human passwords. We store
// HMAC-SHA256(pepper, normalizedCode). The pepper is a server-only secret kept in the environment,
// never in the database, so a leaked `join_code_hash` column cannot be brute-forced offline.

// 32-char alphabet, ~5 bits/char, with visually ambiguous characters removed (no 0/O, 1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 16; // 16 * 5 = 80 bits of entropy.

function pepper() {
  const raw = process.env.JOIN_CODE_PEPPER;
  if (!raw || raw.length < 16) throw new Error("JOIN_CODE_PEPPER is required (>= 16 chars) to hash join codes.");
  return raw;
}

/** Canonical form used for hashing: case- and whitespace-insensitive so re-typed codes still match. */
function normalize(code: string) {
  return code.trim().toUpperCase();
}

/** Generate a fresh, human-shareable join code such as `OMNI-A7K3M9PQRS2TVWXY`. */
export function generateJoinCode(prefix: string) {
  let body = "";
  for (let i = 0; i < CODE_LENGTH; i++) body += ALPHABET[randomInt(ALPHABET.length)];
  return `${prefix}-${body}`;
}

/** The last 4 characters, stored so a captain/teacher can recognize their own code. Never public. */
export function joinCodeHint(code: string) {
  return normalize(code).slice(-4);
}

/** HMAC-SHA256(pepper, normalized code), hex. Deterministic so the join lookup can match on it. */
export function hashJoinCode(code: string) {
  return createHmac("sha256", pepper()).update(normalize(code)).digest("hex");
}

/** Constant-time comparison of two join-code hashes (defensive; lookups are by index in practice). */
export function joinCodeHashesEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
