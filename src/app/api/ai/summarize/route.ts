import { getUserId } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/http";
import { askReed, clip } from "@/lib/reed-ai";
import { consumeUsage } from "@/lib/usage";

const INSTRUCTIONS = `Eres Reed, un compañero de lectura. Resume el texto para que el lector recuerde dónde quedó.
- Escribe en el idioma del texto, en 3 a 5 frases, en un solo párrafo sin markdown.
- Cuenta lo esencial: qué pasa, quién aparece y por qué importa. Sin opiniones ni spoilers de más allá del texto.`;

// POST { title, text } -> { summary }
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 200) : "";
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return jsonError("`text` is required", 400);

  try {
    await consumeUsage(await getUserId(), "ai_request");
    const message = `${title ? `Capítulo: ${title}\n\n` : ""}Texto:\n"""${clip(text, 24000)}"""`;
    return Response.json({ summary: await askReed(INSTRUCTIONS, message) });
  } catch (err) {
    return handleRouteError(err, "Reed could not summarize that");
  }
}
