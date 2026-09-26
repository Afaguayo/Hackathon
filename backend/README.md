# Backend (owner: Emmanuel)

Server side of the AI Reading Companion: Next.js route handlers on Vercel, Neon Postgres via Drizzle, ElevenLabs for voice and AI. Work happens on the `backend` branch. See the [project README](../README.md) for the full API table.

## Code map
| Path | What |
|---|---|
| `src/db/schema.ts` | Tables: `documents`, `reading_progress`, `conversations`, `messages`, `notes` |
| `src/db/index.ts` | `getDb()`: Drizzle over Neon's HTTP driver |
| `drizzle/` | SQL migrations (generated; commit them) |
| `src/lib/elevenlabs.ts` | TTS, signed URLs, knowledge-base upload, per-document agents |
| `src/lib/auth.ts` | `getUserId()`: **demo user for now**, swap in Clerk here |
| `src/lib/documents.ts`, `src/lib/http.ts` | Shared lookup and error helpers |
| `src/app/api/documents/**` | Upload/list/get/delete documents, progress, per-document signed URL |
| `src/app/api/tts`, `src/app/api/companion/signed-url` | Read aloud; general companion session |

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

## Next
1. **Post-call webhook** `POST /api/webhooks/elevenlabs`: verify the HMAC signature, save transcript + summary into `conversations`/`messages`. Needs a public URL (Vercel deploy).
2. **Agent server tools**: `save_note` (writes to `notes`), `quiz_me`, so the agent can act during a conversation.
3. **Clerk auth**: replace `getUserId()`; everything is already scoped by user id.
4. **Rate limiting** on `/api/tts` and uploads (Upstash Redis) to protect ElevenLabs credits.
5. Uploads over 4 MB: upload straight to Vercel Blob from the browser, then hand the URL to the backend.

## Environment
`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_AGENT_ID`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED`. See `.env.example`. Locally the database URL lives in `.env` and the ElevenLabs values in `.env.local`; both are git-ignored.
