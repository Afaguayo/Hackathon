# AI Reading Companion

An app that reads **with** you: it reads text aloud and talks with you about what you are reading.

**Status:** backend API only (ElevenLabs + database + Clerk auth + usage limits). There is no UI yet; the page at `/` is a placeholder with sign-in buttons until we decide what the app looks like.

## Tech stack

| Tech | What it does for us |
|---|---|
| **Next.js** (App Router, TypeScript, Tailwind) | The web app: server API routes now, UI later |
| **Vercel** | Deployment (every push to `main` deploys; PRs get preview URLs) |
| **ElevenLabs Text to Speech** | Read text aloud with a natural voice |
| **ElevenLabs Agents + Knowledge Base** | Live voice conversation; each uploaded document gets its own agent that can search the whole document |
| **Neon Postgres + Drizzle ORM** | Documents, reading progress, conversations, notes |
| **Clerk** | Sign-in; every API route (except ElevenLabs callbacks) requires a signed-in user |
| n8n, Zavu | Not wired yet; add when needed |

## API (what the future UI calls)

| Endpoint | Does | Returns |
|---|---|---|
| `POST /api/documents` multipart `file`, `title?`, `author?` | Upload a PDF/TXT/MD/EPUB/DOCX/HTML (max 4 MB) to the ElevenLabs knowledge base and create its agent | `201 { document }` |
| `GET /api/documents` | The user's documents, newest first | `{ documents }` |
| `GET /api/documents/:id` | One document | `{ document }` |
| `DELETE /api/documents/:id` | Delete it plus its ElevenLabs agent and knowledge-base file | `204` |
| `GET /api/documents/:id/signed-url` | Voice session with **that document's** agent | `{ signedUrl }` |
| `GET` / `PUT /api/documents/:id/progress` body `{ position, percent }` | Reading position | `{ progress }` |
| `GET` / `POST /api/documents/:id/notes` body `{ text, quote?, type? }` | Notes, highlights, definitions | `{ notes }` / `201 { note }` |
| `DELETE /api/documents/:id/notes/:noteId` | Delete a note | `204` |
| `GET /api/documents/:id/conversations` | Past voice sessions with transcript + summary | `{ conversations }` |
| `POST /api/webhooks/elevenlabs` | *Called by ElevenLabs* after each conversation (signed) | |
| `POST /api/agent-tools/save-note` | *Called by the agent* mid-conversation (secret header) | `{ result }` |
| `POST /api/tts` body `{ "text": "..." }` | ElevenLabs text to speech (max 2500 chars) | `audio/mpeg` |
| `GET /api/companion/signed-url` | Session with the general companion agent (no document) | `{ signedUrl }` |
| `GET /api/usage` | The user's usage in the last 24h vs. limits | `{ usage }` |

**Auth:** calls from our own pages send the Clerk session cookie automatically; other clients send `Authorization: Bearer <Clerk session token>`.

**Usage limits** (rolling 24h, per user / whole app): read aloud 5,000 / 20,000 characters, uploads 10 / 100, voice sessions 30 / 300. Change them with the `LIMIT_*` env vars in `.env.example`.

Errors come back as `{ "error": "..." }` (400 bad input, 401 signed out, 404 not found, 409 document not ready, 413 too large, 415 wrong file type, 429 usage limit, 502 ElevenLabs failed). The ElevenLabs key stays on the server (`src/lib/elevenlabs.ts`); the browser never sees it.

To use the agent from a UI later: install nothing extra (`@elevenlabs/react` is already a dependency), wrap the page in `<ConversationProvider>`, and call `useConversation().startSession({ signedUrl, dynamicVariables: { passage, book_title } })`.

## Where the code lives and who owns it

| Area | Files | Owner |
|---|---|---|
| Backend / API | `src/app/api/`, `src/lib/`, `src/db/`, `drizzle/` | Emmanuel ([notes](backend/README.md)) |
| Frontend / UI (not started) | `src/app/page.tsx`, `src/app/layout.tsx` | Gael ([notas](frontend/README.md)) |
| AI / ElevenLabs agent | Agent prompt + voice in the ElevenLabs dashboard, `src/lib/elevenlabs.ts` together with Emmanuel | Victor ([notas](ai-agents/README.md)) |

Owners are a starting suggestion; swap if someone prefers another part.

## Run it locally

Needs Node.js 20+.

```bash
git clone https://github.com/Afaguayo/Hackathon.git
cd Hackathon
npm install
cp .env.example .env.local   # then fill in the ElevenLabs values and DATABASE_URL
npm run db:migrate           # create/update the database tables
npm run dev                  # http://localhost:3000
```

Without the keys the API routes return an error naming the missing variable.

Quick test once the keys are in:
```bash
curl -X POST localhost:3000/api/tts -H 'Content-Type: application/json' -d '{"text":"Hello"}' -o hello.mp3
curl -F file=@book.pdf -F title="My book" localhost:3000/api/documents
curl localhost:3000/api/documents
```

Database scripts: `npm run db:generate` (after editing `src/db/schema.ts`, writes a migration to `drizzle/`), `npm run db:migrate` (applies migrations), `npm run db:studio` (browse the data).

## ElevenLabs setup

Already done on Angel's ElevenLabs account: the API key, the voice (Sarah) and a private **Reading Companion** agent. The agent's prompt and settings are in [ai-agents/reading-companion-agent.md](ai-agents/reading-companion-agent.md).

To get the three `ELEVENLABS_*` values for your `.env.local`, ask Angel privately. Never put them in the repo or in public chats.

## Deploy on Vercel

**Live:** https://reading-companion-navy.vercel.app (Vercel project `reading-companion`, team REEF). Deployed with the CLI from the `backend` branch: `npx vercel deploy --prod`. Env vars are already set in the project.

To set it up from scratch:

1. vercel.com → **Add New… → Project** → import `Afaguayo/Hackathon` (framework: Next.js, root: `/`, defaults are fine).
2. **Settings → Environment Variables**: add the three `ELEVENLABS_*` values (Production + Preview).
3. **Storage → Create → Neon**: connect a database; Vercel adds `DATABASE_URL` for you. Run `npm run db:migrate` against it once (with its `DATABASE_URL` in your `.env`).
4. Deploy. From then on, every push to `main` redeploys and every PR gets a preview URL.

## Team rules
- Work on a branch and open a pull request; merge to `main` when it works.
- `git pull` before you start; commit and push often.
- Stay in your own files where possible; for shared files (`package.json`, this README) say it in chat first.
- Never commit API keys. `.env.local` is git-ignored; use `.env.example` to document new variables.
