import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

// Placeholder until the team decides on the UI. The backend lives in src/app/api; sign in here to call it.
export default function Home() {
  return (
    <main className="p-8 font-mono text-sm">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-lg font-semibold">AI Reading Companion: API only</h1>
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
      <p className="mb-2">All endpoints except the ElevenLabs webhook/tools require a signed-in user. See README.md.</p>
      <ul className="list-disc pl-5">
        <li>/api/documents: upload, list, get, delete (+ progress, notes, conversations, signed-url)</li>
        <li>/api/tts, /api/companion/signed-url: ElevenLabs voice</li>
        <li>/api/usage: your usage in the last 24h</li>
      </ul>
    </main>
  );
}
