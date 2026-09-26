"use client";

import { useEffect, useRef, useState } from "react";

type State = "idle" | "loading" | "playing";

/** Reads `text` aloud through our /api/tts route (ElevenLabs text-to-speech). */
export function ReadAloudButton({ text }: { text: string }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  function stop() {
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setState("idle");
  }

  // Stop playback when the passage changes or the component unmounts.
  useEffect(() => stop, [text]);

  async function play() {
    setError(null);
    setState("loading");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
        throw new Error(error);
      }
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      urlRef.current = url;
      audio.onended = stop;
      await audio.play();
      setState("playing");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      stop();
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={state === "idle" ? play : stop}
        disabled={!text || state === "loading"}
        className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {state === "loading" ? "Preparing audio…" : state === "playing" ? "■ Stop" : "▶ Read aloud"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
