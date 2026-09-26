import { getUserId } from "@/lib/auth";
import { getAgentSignedUrl } from "@/lib/elevenlabs";
import { handleRouteError } from "@/lib/http";
import { consumeUsage } from "@/lib/usage";

// GET -> { signedUrl } for a voice conversation with the general companion agent (no document).
// Signed-in users only; each call counts as one agent session. Short-lived and single-use: never cache.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await consumeUsage(await getUserId(), "agent_session");
    return Response.json({ signedUrl: await getAgentSignedUrl() }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return handleRouteError(err, "Could not start a companion session");
  }
}
