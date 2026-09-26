import { ElevenLabsConfigError, MAX_TTS_CHARS, textToSpeech } from "@/lib/elevenlabs";

// POST { text } -> audio/mpeg of the text read aloud by ElevenLabs.
export async function POST(request: Request) {
  let text: unknown;
  try {
    ({ text } = await request.json());
  } catch {
    return Response.json({ error: "Body must be JSON: { text }" }, { status: 400 });
  }

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "`text` is required" }, { status: 400 });
  }
  if (text.length > MAX_TTS_CHARS) {
    return Response.json(
      { error: `Text is too long (${text.length} chars, max ${MAX_TTS_CHARS}). Read a shorter passage.` },
      { status: 413 },
    );
  }

  try {
    const upstream = await textToSpeech(text.trim());
    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text();
      console.error("ElevenLabs TTS failed", upstream.status, detail);
      return Response.json({ error: `ElevenLabs TTS failed (${upstream.status})` }, { status: 502 });
    }
    return new Response(upstream.body, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof ElevenLabsConfigError) {
      return Response.json({ error: err.message }, { status: 500 });
    }
    console.error(err);
    return Response.json({ error: "Could not reach ElevenLabs" }, { status: 502 });
  }
}
