import { getUserId } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";
import { usageSummary } from "@/lib/usage";

// GET -> { usage: { tts_chars: { used, limit }, upload: {...}, agent_session: {...} } } over the last 24h.
export async function GET() {
  try {
    return Response.json({ usage: await usageSummary(await getUserId()) });
  } catch (err) {
    return handleRouteError(err, "Could not load usage");
  }
}
