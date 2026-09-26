// Server-only helpers for the ElevenLabs REST API.
// The API key must never reach the browser, so import this only from route handlers.

const API_BASE = "https://api.elevenlabs.io/v1";

// Keeps a single request (and its credit cost) bounded.
export const MAX_TTS_CHARS = 2500;

export class ElevenLabsConfigError extends Error {}

export class ElevenLabsApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ElevenLabsConfigError(
      `${name} is not set. Add it to .env.local (local) or the Vercel project settings (deployed).`,
    );
  }
  return value;
}

/** fetch against the ElevenLabs API with our key; throws ElevenLabsApiError on non-2xx. */
async function elevenlabs(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("xi-api-key", requireEnv("ELEVENLABS_API_KEY"));
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    throw new ElevenLabsApiError(res.status, `ElevenLabs ${init.method ?? "GET"} ${path} failed (${res.status}): ${await res.text()}`);
  }
  return res;
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

/**
 * Returns a short-lived signed URL the browser uses to open a voice session with a private agent.
 * Defaults to the general companion agent; pass a document's agent to talk about that document.
 */
export async function getAgentSignedUrl(agentId = requireEnv("ELEVENLABS_AGENT_ID")): Promise<string> {
  const res = await elevenlabs(`/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`);
  const data = (await res.json()) as { signed_url: string };
  return data.signed_url;
}

/** Uploads a file (PDF, TXT, EPUB, DOCX, HTML, MD) to the knowledge base; ElevenLabs extracts the text. */
export async function uploadKnowledgeFile(file: Blob, name: string): Promise<string> {
  const form = new FormData();
  form.append("file", file, name);
  form.append("name", name);
  const res = await elevenlabs("/convai/knowledge-base/file", { method: "POST", body: form });
  const data = (await res.json()) as { id: string };
  return data.id;
}

type AgentConfig = {
  conversation_config: {
    agent: {
      prompt: {
        prompt: string;
        knowledge_base?: { type: string; name: string; id: string; usage_mode: string }[];
        rag?: { enabled: boolean };
      };
    } & Record<string, unknown>;
  } & Record<string, unknown>;
};

const KNOWLEDGE_BASE_INSTRUCTIONS = `

You also have the full text of this document in your knowledge base. Use it to answer questions about parts the reader is not currently on (earlier chapters, characters, definitions), and say when something is not in the document.`;

/**
 * Creates a private agent dedicated to one document: a copy of the companion template
 * (prompt, voice, language) whose knowledge base holds only that document.
 * Per-document agents keep users' books separate, since a session can't swap knowledge bases.
 */
export async function createDocumentAgent(knowledgeBaseId: string, title: string): Promise<string> {
  const template = (await (
    await elevenlabs(`/convai/agents/${encodeURIComponent(requireEnv("ELEVENLABS_AGENT_ID"))}`)
  ).json()) as AgentConfig;

  const config = template.conversation_config;
  config.agent.prompt.prompt += KNOWLEDGE_BASE_INSTRUCTIONS;
  config.agent.prompt.knowledge_base = [{ type: "file", name: title, id: knowledgeBaseId, usage_mode: "auto" }];
  config.agent.prompt.rag = { enabled: true };

  const res = await elevenlabs("/convai/agents/create", {
    method: "POST",
    body: JSON.stringify({
      name: `Reader: ${title}`.slice(0, 100),
      conversation_config: config,
      platform_settings: { auth: { enable_auth: true } },
    }),
  });
  const data = (await res.json()) as { agent_id: string };
  return data.agent_id;
}

export async function deleteAgent(agentId: string): Promise<void> {
  await elevenlabs(`/convai/agents/${encodeURIComponent(agentId)}`, { method: "DELETE" });
}

export async function deleteKnowledgeDoc(knowledgeBaseId: string): Promise<void> {
  // force: also detach it from any agent still referencing it.
  await elevenlabs(`/convai/knowledge-base/${encodeURIComponent(knowledgeBaseId)}?force=true`, { method: "DELETE" });
}
