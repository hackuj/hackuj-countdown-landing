export const MAX_DEPLOY_FILES = 20;
export const MAX_DEPLOY_TOTAL_BYTES = 64 * 1024 * 1024;
export const MAX_DEPLOY_REQUEST_BYTES = 90 * 1024 * 1024;

export type ValidatedDeployFile = { name: string; bytes: Buffer };

export class DeployPayloadError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "DeployPayloadError";
  }
}

/** Strict RFC 4648 base64; Buffer.from alone silently accepts malformed input. */
function decodeBase64(value: string) {
  const encoded = value.trim();
  if (!encoded || encoded.length % 4 !== 0) throw new DeployPayloadError("INVALID_BASE64");
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
    throw new DeployPayloadError("INVALID_BASE64");
  }
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.toString("base64") !== encoded) throw new DeployPayloadError("INVALID_BASE64");
  return bytes;
}

export function validateDeployFiles(files: unknown, maxFileBytes: number): ValidatedDeployFile[] {
  if (!Array.isArray(files)) throw new DeployPayloadError("FILES_NOT_ARRAY");
  if (files.length > MAX_DEPLOY_FILES) throw new DeployPayloadError("TOO_MANY_FILES");

  const result: ValidatedDeployFile[] = [];
  let total = 0;
  for (const candidate of files) {
    if (!candidate || typeof candidate !== "object") throw new DeployPayloadError("INVALID_FILE");
    const file = candidate as { name?: unknown; data?: unknown };
    const name = typeof file.name === "string" ? file.name.trim() : "";
    if (!name || name.length > 255 || typeof file.data !== "string") {
      throw new DeployPayloadError("INVALID_FILE");
    }
    const bytes = decodeBase64(file.data);
    if (!bytes.byteLength) throw new DeployPayloadError("EMPTY_FILE");
    if (bytes.byteLength > maxFileBytes) throw new DeployPayloadError("FILE_TOO_LARGE");
    total += bytes.byteLength;
    if (total > MAX_DEPLOY_TOTAL_BYTES) throw new DeployPayloadError("FILES_TOO_LARGE");
    result.push({ name, bytes });
  }
  return result;
}

/** Reads a chunked request with a hard ceiling before JSON parsing allocates an unbounded string. */
export async function readLimitedText(request: Request, maxBytes: number): Promise<string> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new DeployPayloadError("BODY_TOO_LARGE");
  }
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new DeployPayloadError("BODY_TOO_LARGE");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk))).toString("utf8");
}

export async function readLimitedJson(request: Request, maxBytes = MAX_DEPLOY_REQUEST_BYTES): Promise<unknown> {
  const text = await readLimitedText(request, maxBytes);
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new DeployPayloadError("INVALID_JSON");
  }
}
