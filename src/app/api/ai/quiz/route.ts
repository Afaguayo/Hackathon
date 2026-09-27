import { getUserId } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/http";
import { askReed, clip, parseJsonReply, ReedAiError } from "@/lib/reed-ai";
import { consumeUsage } from "@/lib/usage";

const INSTRUCTIONS = `Eres Reed y creas preguntas de comprensión lectora. Devuelve SOLO JSON válido, sin markdown ni texto extra.
Formato exacto:
{"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}
Reglas:
- Entre 3 y 5 preguntas, en el idioma del texto, sobre lo que dice el texto (no sobre conocimiento externo).
- Cada pregunta tiene exactamente 4 opciones plausibles y una sola correcta; varía la posición de la correcta.
- "explanation" dice en una frase por qué la respuesta es correcta, citando el texto si ayuda.`;

type QuizQuestion = { id: string; question: string; options: string[]; correctIndex: number; explanation: string };

/** Keeps only well-formed questions, in the shape the frontend's QuizModal expects. */
function normalize(raw: unknown): QuizQuestion[] {
  const list = (raw as { questions?: unknown })?.questions;
  if (!Array.isArray(list)) return [];
  return list
    .map((q) => q as Partial<QuizQuestion>)
    .filter(
      (q) =>
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.options.every((o) => typeof o === "string") &&
        Number.isInteger(q.correctIndex) &&
        q.correctIndex! >= 0 &&
        q.correctIndex! < q.options.length,
    )
    .slice(0, 5)
    .map((q, i) => ({
      id: `q-${i + 1}`,
      question: q.question!.trim(),
      options: q.options!.map((o) => o.trim()),
      correctIndex: q.correctIndex!,
      explanation: typeof q.explanation === "string" ? q.explanation.trim() : "",
    }));
}

// POST { title, text } -> { questions: [{ id, question, options, correctIndex, explanation }] }
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 200) : "";
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return jsonError("`text` is required", 400);

  try {
    await consumeUsage(await getUserId(), "ai_request");
    const message = `${title ? `Capítulo: ${title}\n\n` : ""}Texto:\n"""${clip(text, 20000)}"""`;
    // One retry: the model occasionally wraps or truncates the JSON.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const questions = normalize(parseJsonReply(await askReed(INSTRUCTIONS, message)));
        if (questions.length) return Response.json({ questions });
      } catch (err) {
        if (!(err instanceof ReedAiError || err instanceof SyntaxError) || attempt === 2) throw err;
      }
    }
    throw new ReedAiError("Reed could not write quiz questions for this text");
  } catch (err) {
    return handleRouteError(err, "Reed could not write a quiz");
  }
}
