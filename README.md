# AI Reading Companion

An app that reads **with** you: it reads text aloud and talks with you about what you are reading.

**Status:** backend API only (ElevenLabs + database). There is no UI yet; the page at `/` is a placeholder until we decide what the app looks like.

## Tech stack

| Tech | What it does for us |
|---|---|
| **Next.js** (App Router, TypeScript, Tailwind) | The web app: server API routes now, UI later |
| **Vercel** | Deployment (every push to `main` deploys; PRs get preview URLs) |
| **ElevenLabs Text to Speech** | Read text aloud with a natural voice |
| **ElevenLabs Agents + Knowledge Base** | Live voice conversation; each uploaded document gets its own agent that can search the whole document |
| **Neon Postgres + Drizzle ORM** | Documents, reading progress, conversations, notes |
| Clerk, n8n, Zavu | Not wired yet; add when needed (all users are one demo user until Clerk) |

## API (what the future UI calls)

| Endpoint | Does | Returns |
|---|---|---|
| `POST /api/documents` multipart `file`, `title?`, `author?` | Upload a PDF/TXT/MD/EPUB/DOCX/HTML (max 4 MB) to the ElevenLabs knowledge base and create its agent | `201 { document }` |
| `GET /api/documents` | The user's documents, newest first | `{ documents }` |
| `GET /api/documents/:id` | One document | `{ document }` |
| `DELETE /api/documents/:id` | Delete it plus its ElevenLabs agent and knowledge-base file | `204` |
| `GET /api/documents/:id/signed-url` | Voice session with **that document's** agent | `{ signedUrl }` |
| `GET` / `PUT /api/documents/:id/progress` body `{ position, percent }` | Reading position | `{ progress }` |
| `POST /api/tts` body `{ "text": "..." }` | ElevenLabs text to speech (max 2500 chars) | `audio/mpeg` |
| `GET /api/companion/signed-url` | Session with the general companion agent (no document) | `{ signedUrl }` |

Errors come back as `{ "error": "..." }` (400 bad input, 404 not found, 409 document not ready, 413 too large, 415 wrong file type, 502 ElevenLabs failed). The ElevenLabs key stays on the server (`src/lib/elevenlabs.ts`); the browser never sees it.

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

1. vercel.com → **Add New… → Project** → import `Afaguayo/Hackathon` (framework: Next.js, root: `/`, defaults are fine).
2. **Settings → Environment Variables**: add the three `ELEVENLABS_*` values (Production + Preview).
3. **Storage → Create → Neon**: connect a database; Vercel adds `DATABASE_URL` for you. Run `npm run db:migrate` against it once (with its `DATABASE_URL` in your `.env`).
4. Deploy. From then on, every push to `main` redeploys and every PR gets a preview URL.

## Team rules
- Work on a branch and open a pull request; merge to `main` when it works.
- `git pull` before you start; commit and push often.
- Stay in your own files where possible; for shared files (`package.json`, this README) say it in chat first.
- Never commit API keys. `.env.local` is git-ignored; use `.env.example` to document new variables.
