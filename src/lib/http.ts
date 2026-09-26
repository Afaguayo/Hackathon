import { ElevenLabsApiError, ElevenLabsConfigError } from "./elevenlabs";

/** Shared JSON error shape for route handlers: { error }. */
export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/** Maps known failures to clear responses and logs the rest. */
export function handleRouteError(err: unknown, fallback: string) {
  if (err instanceof ElevenLabsConfigError) return jsonError(err.message, 500);
  if (err instanceof Error && err.message.startsWith("DATABASE_URL is not set")) return jsonError(err.message, 500);
  console.error(err);
  if (err instanceof ElevenLabsApiError) return jsonError(`${fallback}: ElevenLabs returned ${err.status}`, 502);
  return jsonError(fallback, 500);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => UUID.test(value);
