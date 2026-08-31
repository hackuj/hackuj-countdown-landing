import { gunzipSync, inflateRawSync } from "node:zlib";

/**
 * Reading challenge archives — the shape `rcds`, rCTF's deployment tool, hands out: a `.zip`,
 * `.tar` or `.tar.gz` holding `challenge.yaml` beside the files the challenge provides.
 *
 * Written against the container formats directly rather than pulled in as a dependency: both are
 * small, and an archive reader is exactly the kind of code that should be readable, since it parses
 * bytes an organiser uploaded. Every entry is size-checked and every path is rejected if it escapes
 * the archive root, so a crafted archive cannot write outside the upload area or exhaust memory.
 */

export type ArchiveEntry = { path: string; bytes: Buffer };

/** Per-entry ceiling, and a ceiling on the whole expansion, so a zip bomb cannot fill memory. */
const MAX_ENTRY_BYTES = 64 * 1024 * 1024;
const MAX_TOTAL_BYTES = 256 * 1024 * 1024;
const MAX_ENTRIES = 512;

/**
 * Confines every entry to the archive root. A leading `/` is stripped the way tar itself does
 * (`Removing leading /`), while any `..` segment is refused outright rather than resolved — that is
 * the one that could otherwise write outside the upload area.
 */
function safeEntryPath(raw: string) {
  // Windows-style separators are normalised first; a backslash is a path separator in some writers.
  const normalised = raw.split(String.fromCharCode(92)).join("/").replace(new RegExp("^/+"), "");
  if (!normalised || normalised.endsWith("/")) return null;
  if (/^[A-Za-z]:/.test(normalised)) return null;
  const parts = normalised.split("/");
  if (parts.some(p => p === ".." || p === "")) return null;
  return parts.join("/");
}

export function isArchiveName(name: string) {
  return /\.(zip|tar|tar\.gz|tgz)$/i.test(name.trim());
}

/* ------------------------------------------------------------------ ZIP ---- */

/**
 * Reads a ZIP through its central directory (the authoritative index) rather than by scanning for
 * local headers, so entries a crafted archive hides between records are not picked up.
 */
export function readZip(buf: Buffer): ArchiveEntry[] {
  // The end-of-central-directory record sits in the last 64KB, after a variable-length comment.
  let eocd = -1;
  const from = Math.max(0, buf.length - 66_000);
  for (let i = buf.length - 22; i >= from; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("NOT_A_ZIP");

  const count = buf.readUInt16LE(eocd + 10);
  let offset = buf.readUInt32LE(eocd + 16);
  const out: ArchiveEntry[] = [];
  let total = 0;

  for (let i = 0; i < Math.min(count, MAX_ENTRIES); i++) {
    if (offset + 46 > buf.length || buf.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buf.readUInt16LE(offset + 10);
    const compressed = buf.readUInt32LE(offset + 20);
    const uncompressed = buf.readUInt32LE(offset + 24);
    const nameLen = buf.readUInt16LE(offset + 28);
    const extraLen = buf.readUInt16LE(offset + 30);
    const commentLen = buf.readUInt16LE(offset + 32);
    const localOffset = buf.readUInt32LE(offset + 42);
    const name = buf.subarray(offset + 46, offset + 46 + nameLen).toString("utf8");
    offset += 46 + nameLen + extraLen + commentLen;

    const path = safeEntryPath(name);
    if (!path) continue;
    if (uncompressed > MAX_ENTRY_BYTES) throw new Error("ENTRY_TOO_LARGE");
    // The local header repeats the name and extra fields with its own lengths; the data starts
    // after them, not after the central directory's copies.
    if (localOffset + 30 > buf.length || buf.readUInt32LE(localOffset) !== 0x04034b50) continue;
    const dataStart = localOffset + 30 + buf.readUInt16LE(localOffset + 26) + buf.readUInt16LE(localOffset + 28);
    if (dataStart > buf.length || dataStart + compressed > buf.length) throw new Error("TRUNCATED_ARCHIVE");
    const raw = buf.subarray(dataStart, dataStart + compressed);
    let bytes: Buffer | null = null;
    if (method === 0) bytes = Buffer.from(raw);
    else if (method === 8) bytes = inflateRawSync(raw, { maxOutputLength: MAX_ENTRY_BYTES });
    // Any other method (bzip2, lzma, encrypted) is skipped rather than guessed at.
    if (bytes) {
      // The declared size is part of ZIP's integrity metadata. Enforcing it also stops a forged
      // tiny declaration from bypassing the aggregate expansion ceiling.
      if (bytes.byteLength !== uncompressed) throw new Error("SIZE_MISMATCH");
      total += bytes.byteLength;
      if (total > MAX_TOTAL_BYTES) throw new Error("ARCHIVE_TOO_LARGE");
      out.push({ path, bytes });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ TAR ---- */

/** POSIX ustar: 512-byte header blocks, each followed by the file rounded up to 512 bytes. */
export function readTar(input: Buffer): ArchiveEntry[] {
  const buf = input[0] === 0x1f && input[1] === 0x8b
    ? gunzipSync(input, { maxOutputLength: MAX_TOTAL_BYTES })
    : input;
  const out: ArchiveEntry[] = [];
  let total = 0;

  for (let pos = 0; pos + 512 <= buf.length && out.length < MAX_ENTRIES;) {
    const header = buf.subarray(pos, pos + 512);
    // Two consecutive zero blocks end the archive; one is enough to stop reading.
    if (header.every(b => b === 0)) break;

    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
    const prefix = header.subarray(345, 500).toString("utf8").replace(/\0.*$/, "");
    const sizeField = header.subarray(124, 136).toString("utf8").replace(/[^0-7]/g, "");
    const size = parseInt(sizeField || "0", 8) || 0;
    const type = String.fromCharCode(header[156]) || "0";
    pos += 512;

    if (size > MAX_ENTRY_BYTES) throw new Error("ENTRY_TOO_LARGE");
    if (pos + size > buf.length) throw new Error("TRUNCATED_ARCHIVE");
    // '0'/'\0' are regular files; directories, links and pax headers carry no handout content.
    if (type === "0" || type === "\0") {
      const path = safeEntryPath(prefix ? `${prefix}/${name}` : name);
      if (path) {
        total += size;
        if (total > MAX_TOTAL_BYTES) throw new Error("ARCHIVE_TOO_LARGE");
        out.push({ path, bytes: Buffer.from(buf.subarray(pos, pos + size)) });
      }
    }
    pos += Math.ceil(size / 512) * 512;
  }
  return out;
}

/** Picks the reader by content, not by the name the uploader chose. */
export function readArchive(bytes: Buffer): ArchiveEntry[] {
  if (bytes.length > 4 && bytes.readUInt32LE(0) === 0x04034b50) return readZip(bytes);
  if (bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) return readTar(bytes);
  if (bytes.length > 262 && bytes.subarray(257, 262).toString("latin1") === "ustar") return readTar(bytes);
  // A ZIP whose first entry is not at offset 0 (self-extracting, or written with a prelude).
  if (bytes.length > 22) { try { return readZip(bytes); } catch { /* fall through */ } }
  throw new Error("UNSUPPORTED_ARCHIVE");
}
