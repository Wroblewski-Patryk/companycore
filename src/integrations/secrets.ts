import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { env } from "../config/env";

const algorithm = "aes-256-gcm";
const encoding = "base64url";
const secretVersion = "v1";

function encryptionKey() {
  return createHash("sha256").update(env.integrationSecretKey).digest();
}

export function encryptSecret(plainText: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return [
    secretVersion,
    iv.toString(encoding),
    authTag.toString(encoding),
    ciphertext.toString(encoding)
  ].join(".");
}

export function decryptSecret(value: string) {
  const [version, iv, authTag, ciphertext] = value.split(".");

  if (version !== secretVersion || !iv || !authTag || !ciphertext) {
    throw new Error("Invalid encrypted secret format");
  }

  const decipher = createDecipheriv(
    algorithm,
    encryptionKey(),
    Buffer.from(iv, encoding)
  );
  decipher.setAuthTag(Buffer.from(authTag, encoding));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, encoding)),
    decipher.final()
  ]).toString("utf8");
}
