import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

// Generate 32-byte key from secret
const SECRET_KEY = crypto
  .createHash("sha256")
  .update(process.env.SECRET_KEY)
  .digest();

// Encrypt
export function encrypt(text) {
  const iv = crypto.randomBytes(12); // recommended for GCM

  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // return iv + tag + encrypted (all hex)
  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

// Decrypt
export function decrypt(encryptedText) {
  const [ivHex, tagHex, encryptedHex] = encryptedText.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}