# Backend (owner: Emmanuel)

The server side of the AI Reading Companion, running as Next.js route handlers on Vercel. See the [project README](../README.md).

## Code
- `src/lib/elevenlabs.ts`: server-only ElevenLabs calls; reads the API key from env.
- `src/app/api/tts/route.ts`: `POST { text }` → `audio/mpeg`. Max 2500 chars per request.
- `src/app/api/companion/signed-url/route.ts`: `GET` → `{ signedUrl }` for a private agent session.

Errors come back as `{ error }` JSON: 400 bad input, 413 text too long, 500 missing env var, 502 ElevenLabs failed.

## Done
- Text-to-speech proxy (key stays on the server).
- Signed URL for the ElevenLabs agent.

## Next tasks
1. Add the same keys to Vercel (they already work locally: TTS returned real audio and the agent returned a signed URL).
2. Rate-limit `/api/tts` so a public deploy can't burn our ElevenLabs credits.
3. Save books and reading progress (e.g. Vercel Postgres / Blob) if we want a library.
4. Add auth (Clerk) if we need user accounts.

## Secrets (in `.env.local` / Vercel, never committed)
`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_AGENT_ID`. See `.env.example`.
