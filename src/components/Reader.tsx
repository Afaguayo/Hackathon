"use client";

import { useMemo, useState } from "react";
import { CompanionPanel } from "./CompanionPanel";
import { ReadAloudButton } from "./ReadAloudButton";

const SAMPLE = `Paste a chapter or article here, or upload a .txt file.

Then click any paragraph to select it. Press "Read aloud" to hear it, or talk to your companion about it.`;

export function Reader() {
  const [title, setTitle] = useState("");
  const [source, setSource] = useState(SAMPLE);
  const [selected, setSelected] = useState(0);

  const paragraphs = useMemo(
    () => source.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    [source],
  );
  const passage = paragraphs[selected] ?? "";

  async function loadFile(file: File) {
    setSource(await file.text());
    setTitle(file.name.replace(/\.txt$/i, ""));
    setSelected(0);
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 md:grid-cols-[1fr_320px] md:p-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Book or article title"
            className="flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
          <label className="cursor-pointer rounded-lg border border-black/15 px-3 py-2 text-sm dark:border-white/20">
            Upload .txt
            <input
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
            />
          </label>
        </div>

        <details className="rounded-lg border border-black/10 p-3 dark:border-white/15">
          <summary className="cursor-pointer text-sm opacity-70">Edit text</summary>
          <textarea
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setSelected(0);
            }}
            rows={10}
            className="mt-2 w-full rounded-md border border-black/10 bg-transparent p-2 font-mono text-sm dark:border-white/15"
          />
        </details>

        <article className="flex flex-col gap-3 text-lg leading-relaxed">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              onClick={() => setSelected(i)}
              className={`cursor-pointer rounded-lg p-3 transition-colors ${
                i === selected ? "bg-indigo-100 dark:bg-indigo-950" : "hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {p}
            </p>
          ))}
        </article>
      </section>

      <aside className="flex flex-col gap-4 md:sticky md:top-8 md:self-start">
        <div className="flex flex-col gap-2 rounded-xl border border-black/10 p-4 dark:border-white/15">
          <h2 className="font-semibold">
            Paragraph {paragraphs.length ? selected + 1 : 0} of {paragraphs.length}
          </h2>
          <ReadAloudButton text={passage} />
        </div>
        <CompanionPanel passage={passage} bookTitle={title} />
      </aside>
    </div>
  );
}
