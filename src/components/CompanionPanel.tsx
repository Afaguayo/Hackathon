"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useEffect, useState } from "react";

type Props = { passage: string; bookTitle: string };

/**
 * Voice conversation with our ElevenLabs agent about the passage being read.
 * The agent's prompt (configured in the ElevenLabs dashboard) can use the
 * {{passage}} and {{book_title}} dynamic variables sent at session start.
 */
export function CompanionPanel(props: Props) {
  return (
    <ConversationProvider>
      <Companion {...props} />
    </ConversationProvider>
  );
}

function Companion({ passage, bookTitle }: Props) {
  const [error, setError] = useState<string | null>(null);
  const conversation = useConversation({
    onError: (message) => setError(String(message)),
  });
  const connected = conversation.status === "connected";

  // Keep the agent in sync when the reader selects another passage mid-conversation.
  useEffect(() => {
    if (connected && passage) {
      conversation.sendContextualUpdate(`The reader moved to this passage:\n${passage}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to passage changes
  }, [passage]);

  async function start() {
    setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const res = await fetch("/api/companion/signed-url");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      conversation.startSession({
        signedUrl: data.signedUrl,
        dynamicVariables: { passage: passage || "(no passage selected yet)", book_title: bookTitle || "Untitled" },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/10 p-4 dark:border-white/15">
      <h2 className="font-semibold">Reading companion</h2>
      <p className="text-sm opacity-70">
        {connected
          ? conversation.isSpeaking
            ? "Companion is speaking…"
            : "Listening. Ask about the passage."
          : conversation.status === "connecting"
            ? "Connecting…"
            : "Talk out loud about what you are reading."}
      </p>
      <button
        onClick={connected ? conversation.endSession : start}
        disabled={conversation.status === "connecting"}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {connected ? "End conversation" : "🎙 Talk to companion"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
