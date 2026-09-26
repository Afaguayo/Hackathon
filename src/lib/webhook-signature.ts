import { createHmac, timingSafeEqual } from "node:crypto";

// ElevenLabs signs webhooks with the header `ElevenLabs-Signature: t=<unix seconds>,v0=<hex>`,
// where hex = HMAC-SHA256(secret, `${t}.${rawBody}`).
const MAX_AGE_SECONDS = 30 * 60;

export function verifyElevenLabsSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const i = part.indexOf("=");
      return [part.slice(0, i).trim(), part.slice(i + 1).trim()];
    }),
  );
  const timestamp = Number(parts.t);
  if (!Number.isInteger(timestamp) || !parts.v0) return false;
  if (Math.abs(nowSeconds - timestamp) > MAX_AGE_SECONDS) return false; // blocks replays of old payloads

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest();
  const received = Buffer.from(parts.v0, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
