# AI Reading Companion

An app that reads **with** you: upload a book or article, and the companion reads it aloud, explains hard passages, quizzes you, and keeps you on track.

## Tech stack

| Tech | What it does for us |
|---|---|
| **Clerk** | Sign-up / login, user sessions |
| **AWS** | Hosting, API, file storage (books/PDFs), database |
| **ElevenLabs** | Natural AI voice that reads text aloud |
| **n8n** | Automation workflows (summaries, quizzes, reminders) |
| **Zavu** | TBD: decide as a team how we use it |

## How the parts fit

```
 [frontend]  ── Clerk login ──►  user
     │  upload book, open reader, ask questions, press "read aloud"
     ▼
 [backend]   AWS API + storage + DB, checks Clerk token
     │  triggers workflows / requests audio
     ▼
 [ai-agents] n8n workflows + LLM + ElevenLabs voice
     │  returns summary / quiz / audio URL
     ▼
 [backend] saves result ──► [frontend] shows it
```

## Folders and owners (one owner per folder to avoid sync conflicts)

| Folder | Owner | Scope |
|---|---|---|
| [`backend/`](backend/README.md) | Emmanuel | AWS, API, database, Clerk token checks |
| [`frontend/`](frontend/README.md) | Gael | Reader UI, Clerk sign-in, audio player |
| [`ai-agents/`](ai-agents/README.md) | Victor | n8n workflows, ElevenLabs voice, AI prompts |

Owners are a starting suggestion; swap if someone prefers another part.

## Team rules
- Only edit files in **your** folder. Shared files (this README, config) → say it in chat first.
- Save = synced (Syncthing). Commit + push to GitHub for history.
- Never put API keys in files. Use `.env` (not synced, not committed) and share keys privately.
- If a `*.sync-conflict-*` file appears, merge it by hand and delete the copy.
