import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function key() {
  const raw = process.env.RCTF_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("RCTF_TOKEN_ENCRYPTION_KEY is required in live rCTF mode.");
  const decoded = Buffer.from(raw, "base64");
  if (decoded.length !== 32) throw new Error("RCTF_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  return decoded;
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(":");
}

export function decryptSecret(payload: string) {
  const [version, ivText, tagText, ciphertextText] = payload.split(":");
  if (version !== "v1" || !ivText || !tagText || !ciphertextText) throw new Error("Invalid encrypted secret payload.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextText, "base64url")), decipher.final()]).toString("utf8");
}
