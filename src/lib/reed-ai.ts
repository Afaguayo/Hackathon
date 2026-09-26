import { ElevenLabsConfigError, getAgentSignedUrl } from "./elevenlabs";

// Text answers from Reed (explain, summarize, quiz) come from an ElevenLabs agent in text-only mode:
// one short websocket session per request, with the task's instructions sent as a prompt override.
// ELEVENLABS_TEXT_AGENT_ID must allow prompt / first_message / text_only overrides (see backend/README.md).

export class ReedAiError extends Error {}

const TIMEOUT_MS = 25_000;

export async function askReed(instructions: string, message: string): Promise<string> {
  const agentId = process.env.ELEVENLABS_TEXT_AGENT_ID;
  if (!agentId) {
    throw new ElevenLabsConfigError(
      "ELEVENLABS_TEXT_AGENT_ID is not set. Add it to .env.local (local) or the Vercel project settings (deployed).",
    );
  }
  const signedUrl = await getAgentSignedUrl(agentId);

  return new Promise<string>((resolve, reject) => {
    const ws = new WebSocket(signedUrl);
    let settled = false;
    const finish = (err: Error | null, text?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {}
      if (err) reject(err);
      else resolve(text!);
    };
    const timer = setTimeout(() => finish(new ReedAiError("Reed took too long to answer")), TIMEOUT_MS);

    ws.onopen = () =>
      ws.send(
        JSON.stringify({
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            agent: { prompt: { prompt: instructions }, first_message: "" },
            conversation: { text_only: true },
          },
        }),
      );
    ws.onmessage = (event) => {
      let msg: { type?: string; ping_event?: { event_id: number }; agent_response_event?: { agent_response: string } };
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (msg.type === "ping" && msg.ping_event) ws.send(JSON.stringify({ type: "pong", event_id: msg.ping_event.event_id }));
      else if (msg.type === "conversation_initiation_metadata") ws.send(JSON.stringify({ type: "user_message", text: message }));
      else if (msg.type === "agent_response") {
        const text = msg.agent_response_event?.agent_response?.trim();
        if (text) finish(null, text);
      }
    };
    ws.onerror = () => finish(new ReedAiError("Could not reach Reed (ElevenLabs connection failed)"));
    ws.onclose = () => finish(new ReedAiError("Reed closed the conversation without answering"));
  });
}

/** Parses JSON from a model reply, tolerating ```json fences or text around the object. */
export function parseJsonReply<T>(reply: string): T {
  const unfenced = reply.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  try {
    return JSON.parse(unfenced) as T;
  } catch {
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(unfenced.slice(start, end + 1)) as T;
    throw new ReedAiError("Reed's answer was not valid JSON");
  }
}

/** Keeps prompts bounded (cost + context) by cutting long text at a paragraph boundary. */
export function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastBreak = cut.lastIndexOf("\n\n");
  return (lastBreak > max * 0.6 ? cut.slice(0, lastBreak) : cut) + "\n\n[…]";
}
