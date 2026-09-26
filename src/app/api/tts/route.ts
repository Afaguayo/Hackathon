import { getUserId } from "@/lib/auth";
import { MAX_TTS_CHARS, textToSpeech } from "@/lib/elevenlabs";
import { handleRouteError, jsonError } from "@/lib/http";
import { consumeUsage } from "@/lib/usage";

// POST { text } -> audio/mpeg of the text read aloud by ElevenLabs. Signed-in users only; counts toward TTS limits.
export async function POST(request: Request) {
  let text: unknown;
  try {
    ({ text } = await request.json());
  } catch {
    return jsonError("Body must be JSON: { text }", 400);
  }

  if (typeof text !== "string" || !text.trim()) return jsonError("`text` is required", 400);
  if (text.length > MAX_TTS_CHARS) {
    return jsonError(`Text is too long (${text.length} chars, max ${MAX_TTS_CHARS}). Read a shorter passage.`, 413);
  }

  try {
    const input = text.trim();
    await consumeUsage(await getUserId(), "tts_chars", input.length);

    const upstream = await textToSpeech(input);
    if (!upstream.ok || !upstream.body) {
      console.error("ElevenLabs TTS failed", upstream.status, await upstream.text());
      return jsonError(`ElevenLabs TTS failed (${upstream.status})`, 502);
    }
    return new Response(upstream.body, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    return handleRouteError(err, "Could not reach ElevenLabs");
  }
}
