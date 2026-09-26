// Placeholder until the team decides on the UI. The ElevenLabs integration lives in src/app/api.
export default function Home() {
  return (
    <main className="p-8 font-mono text-sm">
      <h1 className="mb-4 text-lg font-semibold">AI Reading Companion: API only</h1>
      <ul className="list-disc pl-5">
        <li>POST /api/tts {"{ text }"} → audio/mpeg (ElevenLabs text to speech)</li>
        <li>GET /api/companion/signed-url → {"{ signedUrl }"} (ElevenLabs agent session)</li>
      </ul>
    </main>
  );
}
