# Backend (owner: Emmanuel)

Server side of the AI Reading Companion: Next.js route handlers on Vercel, Neon Postgres via Drizzle, ElevenLabs for voice and AI. Work happens on the `backend` branch. See the [project README](../README.md) for the full API table.

## Code map
| Path | What |
|---|---|
| `src/db/schema.ts` | Tables: `documents`, `reading_progress`, `conversations`, `messages`, `notes` |
| `src/db/index.ts` | `getDb()`: Drizzle over Neon's HTTP driver |
| `drizzle/` | SQL migrations (generated; commit them) |
| `src/lib/elevenlabs.ts` | TTS, signed URLs, knowledge-base upload, per-document agents |
| `src/lib/auth.ts` | `getUserId()`: Clerk user id, or 401 |
| `src/lib/usage.ts` | Rolling-24h usage limits (per user + global) on paid ElevenLabs calls |
| `src/proxy.ts` | Next 16 proxy running `clerkMiddleware()` |
| `src/lib/documents.ts`, `src/lib/http.ts` | Shared lookup (by user, by agent id) and error helpers |
| `src/lib/webhook-signature.ts` | Verifies `ElevenLabs-Signature` (HMAC-SHA256, 30 min replay window) |
| `src/app/api/documents/**` | Documents, progress, notes, conversations, per-document signed URL |
| `src/app/api/webhooks/elevenlabs` | Post-call webhook: saves transcript + summary |
| `src/app/api/agent-tools/save-note` | Server tool the agent calls to save a note |
| `src/app/api/tts`, `src/app/api/companion/signed-url` | Read aloud; general companion session |
| `src/app/api/usage` | Current user's usage vs. limits |

## How "ask about the whole book" works
1. `POST /api/documents` uploads the file to the **ElevenLabs Knowledge Base** (ElevenLabs extracts the text, including PDFs).
2. It creates a **private agent for that document**: a copy of the Reading Companion template (`ELEVENLABS_AGENT_ID`) with only that document in its knowledge base and RAG on. A conversation can't switch knowledge bases, so one agent per document keeps users' books separate.
3. `GET /api/documents/:id/signed-url` starts a voice session with that agent. The UI still passes `{{passage}}`/`{{book_title}}` for the part being read right now.
4. Deleting a document deletes its agent and knowledge-base file too.

## Done
- [x] ElevenLabs TTS and companion signed URL
- [x] Database schema + first migration on Neon
- [x] Document upload → ElevenLabs knowledge base + per-document agent
- [x] List / get / delete documents (with ElevenLabs cleanup)
- [x] Reading progress (get / upsert)
- [x] Notes: list / create / delete
- [x] Post-call webhook → `conversations` + `messages` (signature-checked, idempotent on retries)
- [x] Conversation history per document
- [x] `save_note` server tool endpoint
- [x] Deleting a document cascades to its progress, notes, conversations and messages
- [x] Clerk auth on every user route; users only see their own data
- [x] Usage limits (`usage_events` table): TTS characters, uploads, voice sessions

## Hooking up ElevenLabs

**Done** for https://reading-companion-navy.vercel.app: workspace webhook `Reading Companion transcripts` is the post-call webhook (transcripts), and the `save_note` tool is attached to the Reading Companion template agent (its secret header comes from the ElevenLabs secret `reading_companion_tool_secret`). New document agents copy the template, so they get the tool too. If the deploy URL changes, update both URLs in ElevenLabs.

Manual steps, for reference or a new workspace:
**Post-call webhook**
1. ElevenLabs → Agents → Settings → Post-call webhook → add `https://<deploy>/api/webhooks/elevenlabs`, event "transcription".
2. Copy the secret it shows into `ELEVENLABS_WEBHOOK_SECRET` (Vercel env + `.env.local`).

**`save_note` tool** (on the template agent, so new document agents inherit it; existing ones need it added too)
1. ElevenLabs → Agents → Reading Companion → Tools → Add tool → Webhook:
   - Name `save_note`; description "Save a note for the reader when they ask you to remember something."
   - Method `POST`, URL `https://<deploy>/api/agent-tools/save-note`
   - Header `x-agent-tool-secret` = the value of `ELEVENLABS_TOOL_SECRET` (make one: `openssl rand -hex 32`)
   - Body: `agent_id` = dynamic variable `system__agent_id`; `text` (string, required, "what to remember"); `quote` (string, optional, "the passage it refers to")
2. Add a line to the prompt: "When the reader asks you to remember something, call save_note."

## Next
1. More agent tools: `quiz_me`, `define_word`.
2. Uploads over 4 MB: upload straight to Vercel Blob from the browser, then hand the URL to the backend.
3. Clerk webhook to delete a user's documents/agents when they delete their account.

## Environment
`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_WEBHOOK_SECRET`, `ELEVENLABS_TOOL_SECRET`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, optional `LIMIT_*`. See `.env.example`. Locally the database URL lives in `.env` and the ElevenLabs values in `.env.local`; both are git-ignored.
