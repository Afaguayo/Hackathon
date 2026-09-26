// Server-only helpers for the ElevenLabs REST API.
// The API key must never reach the browser, so import this only from route handlers.

const API_BASE = "https://api.elevenlabs.io/v1";

// Keeps a single request (and its credit cost) bounded.
export const MAX_TTS_CHARS = 2500;

export class ElevenLabsConfigError extends Error {}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ElevenLabsConfigError(
      `${name} is not set. Add it to .env.local (local) or the Vercel project settings (deployed).`,
    );
  }
  return value;
}

/** Converts text to MP3 speech and returns the upstream response (body is the audio stream). */
export async function textToSpeech(text: string): Promise<Response> {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");
  const voiceId = requireEnv("ELEVENLABS_VOICE_ID");

  return fetch(`${API_BASE}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    // Multilingual model so the companion reads Spanish and English texts.
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
  });
}

/** Returns a short-lived signed URL the browser uses to open a voice session with our private agent. */
export async function getAgentSignedUrl(): Promise<string> {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");
  const agentId = requireEnv("ELEVENLABS_AGENT_ID");

  const res = await fetch(
    `${API_BASE}/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
    { headers: { "xi-api-key": apiKey }, cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs signed URL request failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { signed_url: string };
  return data.signed_url;
}
