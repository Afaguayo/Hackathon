import { ElevenLabsConfigError, getAgentSignedUrl } from "@/lib/elevenlabs";

// GET -> { signedUrl } for starting a voice conversation with the ElevenLabs agent.
// The URL is short-lived and single-use, so it must never be cached.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ signedUrl: await getAgentSignedUrl() }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof ElevenLabsConfigError) {
      return Response.json({ error: err.message }, { status: 500 });
    }
    console.error(err);
    return Response.json({ error: "Could not start a companion session" }, { status: 502 });
  }
}
