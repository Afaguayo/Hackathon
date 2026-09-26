# AI Reading Companion

An app that reads **with** you: it reads text aloud and talks with you about what you are reading.

**Status:** only the ElevenLabs connection exists (server API routes). There is no UI yet; the page at `/` is a placeholder until we decide what the app looks like.

## Tech stack

| Tech | What it does for us |
|---|---|
| **Next.js** (App Router, TypeScript, Tailwind) | The web app: server API routes now, UI later |
| **Vercel** | Deployment (every push to `main` deploys; PRs get preview URLs) |
| **ElevenLabs Text to Speech** | Read text aloud with a natural voice |
| **ElevenLabs Agents** | Live voice conversation about the passage |
| Clerk, n8n, Zavu | Not wired yet; add when needed |

## API (what the future UI calls)

| Endpoint | Does | Returns |
|---|---|---|
| `POST /api/tts` body `{ "text": "..." }` | ElevenLabs text to speech (max 2500 chars) | `audio/mpeg` |
| `GET /api/companion/signed-url` | Starts a session with our private ElevenLabs agent | `{ "signedUrl": "wss://..." }` |

Errors come back as `{ "error": "..." }`. The ElevenLabs key stays on the server (`src/lib/elevenlabs.ts`); the browser never sees it.

To use the agent from a UI later: install nothing extra (`@elevenlabs/react` is already a dependency), wrap the page in `<ConversationProvider>`, and call `useConversation().startSession({ signedUrl, dynamicVariables: { passage, book_title } })`.

## Where the code lives and who owns it

| Area | Files | Owner |
|---|---|---|
| Backend / API | `src/app/api/`, `src/lib/` | Emmanuel ([notes](backend/README.md)) |
| Frontend / UI (not started) | `src/app/page.tsx`, `src/app/layout.tsx` | Gael ([notas](frontend/README.md)) |
| AI / ElevenLabs agent | Agent prompt + voice in the ElevenLabs dashboard, `src/lib/elevenlabs.ts` together with Emmanuel | Victor ([notas](ai-agents/README.md)) |

Owners are a starting suggestion; swap if someone prefers another part.

## Run it locally

Needs Node.js 20+.

```bash
git clone https://github.com/Afaguayo/Hackathon.git
cd Hackathon
npm install
cp .env.example .env.local   # then fill in the three ElevenLabs values
npm run dev                  # http://localhost:3000
```

Without the keys the API routes return an error naming the missing variable.

Quick test once the keys are in:
```bash
curl -X POST localhost:3000/api/tts -H 'Content-Type: application/json' -d '{"text":"Hello"}' -o hello.mp3
curl localhost:3000/api/companion/signed-url
```

## ElevenLabs setup

Already done on Angel's ElevenLabs account: the API key, the voice (Sarah) and a private **Reading Companion** agent. The agent's prompt and settings are in [ai-agents/reading-companion-agent.md](ai-agents/reading-companion-agent.md).

To get the three `ELEVENLABS_*` values for your `.env.local`, ask Angel privately. Never put them in the repo or in public chats.

## Deploy on Vercel

1. vercel.com → **Add New… → Project** → import `Afaguayo/Hackathon` (framework: Next.js, root: `/`, defaults are fine).
2. **Settings → Environment Variables**: add the three `ELEVENLABS_*` values (Production + Preview).
3. Deploy. From then on, every push to `main` redeploys and every PR gets a preview URL.

## Team rules
- Work on a branch and open a pull request; merge to `main` when it works.
- `git pull` before you start; commit and push often.
- Stay in your own files where possible; for shared files (`package.json`, this README) say it in chat first.
- Never commit API keys. `.env.local` is git-ignored; use `.env.example` to document new variables.
