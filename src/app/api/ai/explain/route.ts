import { getUserId } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/http";
import { askReed, clip } from "@/lib/reed-ai";
import { consumeUsage } from "@/lib/usage";

const INSTRUCTIONS = `Eres Reed, un compañero de lectura cálido y paciente. El lector te pregunta sobre un párrafo.
- Responde en el idioma de la pregunta (normalmente español), en 2 a 4 frases claras.
- Explica palabras difíciles, ideas o referencias del párrafo con palabras sencillas.
- Básate en el párrafo; si algo no está en el texto, dilo con honestidad.
- No uses markdown ni listas: es un mensaje corto en una burbuja de chat.`;

// POST { paragraph, question } -> { explanation }
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const paragraph = typeof body?.paragraph === "string" ? body.paragraph.trim() : "";
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) return jsonError("`question` is required", 400);
  if (question.length > 1000) return jsonError("`question` is too long (max 1000 chars)", 413);

  try {
    await consumeUsage(await getUserId(), "ai_request");
    const message = paragraph ? `Párrafo:\n"""${clip(paragraph, 6000)}"""\n\nPregunta: ${question}` : question;
    return Response.json({ explanation: await askReed(INSTRUCTIONS, message) });
  } catch (err) {
    return handleRouteError(err, "Reed could not explain that");
  }
}
