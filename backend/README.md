# Backend (owner: Emmanuel)

The API and data layer of the AI Reading Companion. See the [project README](../README.md).

## Tech
- **AWS**: API (e.g. API Gateway + Lambda, or a small server), S3 for uploaded books/PDFs, a database (e.g. DynamoDB) for users' books, progress, notes.
- **Clerk**: verify the Clerk session token on every request, so each user only sees their own books.

## First tasks
1. Pick the AWS setup (Lambda vs. one server) and create the project.
2. Endpoint: upload a book → store it in S3 → save metadata in the DB.
3. Endpoint: get a user's books and reading progress.
4. Endpoint: request "read aloud" / "summarize" / "quiz" → call the [ai-agents](../ai-agents/README.md) workflows and return the result.
5. Add Clerk token verification middleware.

## Talks to
- [frontend](../frontend/README.md): agree on endpoint names and JSON shapes early.
- [ai-agents](../ai-agents/README.md): agree on the n8n webhook URLs and payloads.

## Secrets needed (in `.env`, never committed)
AWS credentials, Clerk secret key, n8n webhook URL.
