# AI Reading Companion

An app that reads **with** you: paste or upload a text, and the companion reads it aloud and talks with you about what you are reading.

## Tech stack

| Tech | What it does for us |
|---|---|
| **Next.js** (App Router, TypeScript, Tailwind) | The web app: reader UI + server API routes |
| **Vercel** | Deployment (every push to `main` deploys; PRs get preview URLs) |
| **ElevenLabs Text to Speech** | "Read aloud": natural voice for the selected passage |
| **ElevenLabs Agents** | "Talk to companion": live voice conversation about the passage |
| Clerk, n8n, Zavu | Not wired yet; add when needed |

## How the parts fit

```
 Browser (src/components)
   ├─ "Read aloud"  ── POST /api/tts {text} ───────────┐
   └─ "Talk"        ── GET  /api/companion/signed-url ─┤
                                                        ▼
 Vercel server (src/app/api) ── src/lib/elevenlabs.ts ── ElevenLabs API
   (holds ELEVENLABS_API_KEY; the browser never sees it)
   └─ returns MP3 audio / a short-lived signed URL
 Browser then talks to the ElevenLabs agent directly over that signed URL,
 sending the current passage as {{passage}} and {{book_title}}.
```

## Where the code lives and who owns it

| Area | Files | Owner |
|---|---|---|
| Backend / API | `src/app/api/`, `src/lib/` | Emmanuel ([notes](backend/README.md)) |
| Frontend / UI | `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/` | Gael ([notas](frontend/README.md)) |
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

Without the keys the page still loads; the buttons show which variable is missing.

## ElevenLabs setup (once, by whoever owns the account)

1. **API key**: ElevenLabs → Developers → API Keys → create one with Text to Speech and Agents access → `ELEVENLABS_API_KEY`.
2. **Voice**: ElevenLabs → Voices → pick one → copy the Voice ID → `ELEVENLABS_VOICE_ID`.
3. **Agent**: ElevenLabs → Agents → create an agent:
   - System prompt, for example: *"You are a friendly reading companion. The reader is reading "{{book_title}}". Current passage: {{passage}}. Help them understand it: explain hard words, answer questions, ask short comprehension questions. Keep answers brief and spoken."*
   - Turn on **authentication** (private agent), so only our server's signed URLs can start sessions.
   - Copy the Agent ID → `ELEVENLABS_AGENT_ID`.

Share keys privately (never in the repo or chat logs you'd paste publicly).

## Deploy on Vercel

1. vercel.com → **Add New… → Project** → import `Afaguayo/Hackathon` (framework: Next.js, root: `/`, defaults are fine).
2. **Settings → Environment Variables**: add the three `ELEVENLABS_*` values (Production + Preview).
3. Deploy. From then on, every push to `main` redeploys and every PR gets a preview URL.

## Team rules
- Work on a branch and open a pull request; merge to `main` when it works.
- `git pull` before you start; commit and push often.
- Stay in your own files where possible; for shared files (`package.json`, this README) say it in chat first.
- Never commit API keys. `.env.local` is git-ignored; use `.env.example` to document new variables.
