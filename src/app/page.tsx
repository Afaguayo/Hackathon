import { Reader } from "@/components/Reader";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-black/10 px-4 py-4 md:px-8 dark:border-white/15">
        <h1 className="text-xl font-semibold">AI Reading Companion</h1>
        <p className="text-sm opacity-70">Read along, listen, and talk through what you are reading.</p>
      </header>
      <Reader />
    </main>
  );
}
