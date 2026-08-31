import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Challenge handouts on the local filesystem.
 *
 * Deliberately NOT under public/: anything there is served by the web server with no authorization,
 * so an event-only handout would be downloadable before its event by anyone who guessed the path.
 * These bytes are read back only by an authenticated route that re-checks challenge access.
 *
 * Swap this module for S3/R2 when there is more than one app server; the callers only use
 * storeFile/readStoredFile/deleteStoredFile.
 */
export const MAX_FILE_BYTES = Number(process.env.CHALLENGE_UPLOAD_MAX_BYTES ?? 25 * 1024 * 1024);
export const MAX_CHALLENGE_FILES = Number(process.env.CHALLENGE_UPLOAD_MAX_FILES ?? 100);
export const MAX_CHALLENGE_TOTAL_BYTES = Number(process.env.CHALLENGE_UPLOAD_TOTAL_BYTES ?? 256 * 1024 * 1024);

function root() {
  return process.env.CHALLENGE_UPLOAD_DIR || path.join(process.cwd(), ".uploads");
}

/** Random key, so the on-disk name never derives from user input and cannot traverse paths. */
function newStorageKey() {
  const token = randomBytes(16).toString("hex");
  return `${token.slice(0, 2)}/${token}`;
}

/** Keeps a readable name for the download without trusting it as a path. */
export function safeFileName(name: string) {
  // An allow-list rather than a deny-list: only characters that are safe in a filename on every
  // platform and inside a Content-Disposition header survive. A leading dot is stripped so an
  // upload cannot arrive as a dotfile, and the extension is preserved so .tar.gz stays .tar.gz.
  const base = path.basename(name ?? "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^[._]+/, "")
    .trim();
  return (base || "handout").slice(0, 120);
}

export async function storeFile(bytes: Buffer) {
  if (bytes.byteLength > MAX_FILE_BYTES) throw new Error("FILE_TOO_LARGE");
  const key = newStorageKey();
  const target = path.join(root(), key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  return { key, size: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") };
}

export async function readStoredFile(key: string) {
  // Resolve and confine: a key that escapes the upload root is refused rather than read.
  const base = path.resolve(root());
  const target = path.resolve(base, key);
  if (target !== base && !target.startsWith(base + path.sep)) throw new Error("INVALID_KEY");
  return readFile(target);
}

export async function deleteStoredFile(key: string) {
  const base = path.resolve(root());
  const target = path.resolve(base, key);
  if (target !== base && !target.startsWith(base + path.sep)) return;
  await unlink(target).catch(() => {});
}
