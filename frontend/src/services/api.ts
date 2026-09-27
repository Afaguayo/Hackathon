import { Book, Chapter, QuizQuestion } from '../types';

// Same origin in production (Next serves this app and /api); `npm run dev` proxies /api to the backend.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// ---------- auth ----------

type TokenGetter = () => Promise<string | null>;
let getToken: TokenGetter | null = null;

/** Set by the Clerk bridge in ClerkAuthProvider; null means signed out / demo mode (no backend calls). */
export function setAuthTokenGetter(getter: TokenGetter | null) {
  getToken = getter;
}

export const isBackendSession = () => getToken !== null;

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken ? await getToken() : null;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (typeof init.body === 'string') headers.set('Content-Type', 'application/json');
  const res = await fetch(`${BACKEND_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data?.error || `Error ${res.status}`);
  }
  return res;
}

const postJson = async <T,>(path: string, body: unknown): Promise<T> =>
  (await apiFetch(path, { method: 'POST', body: JSON.stringify(body) })).json();

const reedErrorMessage = (err: unknown) =>
  err instanceof ApiError && err.status === 429
    ? 'Por hoy llegamos al límite de respuestas de Reed. Vuelve mañana y seguimos.'
    : 'Reed no pudo responder en este momento. Inténtalo de nuevo en unos segundos.';

// ---------- Reed AI (explain / summarize / quiz) ----------

export async function explainParagraph(paragraphText: string, userQuestion: string): Promise<string> {
  if (isBackendSession()) {
    try {
      const data = await postJson<{ explanation: string }>('/api/ai/explain', { paragraph: paragraphText, question: userQuestion });
      return data.explanation;
    } catch (err) {
      return reedErrorMessage(err);
    }
  }

  // Demo mode (no sign-in): fallback explicativo con la voz y tono de Reed.
  if (paragraphText.toLowerCase().includes('cañabrava')) {
    return 'Una caña silvestre, pariente del junco. Con ella se armaban las paredes de las primeras casas.';
  }
  if (paragraphText.toLowerCase().includes('junco')) {
    return 'El junco sobrevive porque se adapta al viento en lugar de resistirlo con rigidez. Cuando pasa la tormenta, vuelve a levantarse.';
  }
  if (paragraphText.toLowerCase().includes('imán') || paragraphText.toLowerCase().includes('melquíades')) {
    return 'Melquíades trae la tecnología de su época como un espectáculo mágico. José Arcadio Buendía ve en esos imanes el poder de transformar su aldea.';
  }

  return `En este fragmento se destaca cómo los personajes perciben lo desconocido. Es un momento clave para entender la curiosidad que impulsa la historia.`;
}

export async function summarizeChapter(chapterTitle: string, paragraphsText: string): Promise<string> {
  if (isBackendSession()) {
    try {
      const data = await postJson<{ summary: string }>('/api/ai/summarize', { title: chapterTitle, text: paragraphsText });
      return data.summary;
    } catch (err) {
      return reedErrorMessage(err);
    }
  }

  return `Quedaste en la llegada de Melquíades y la fascinación por los nuevos inventos. José Arcadio Buendía queda obsesionado con los imanes y su potencial para extraer metales preciosos, mostrando el espíritu fundacional y fantástico de Macondo.`;
}

export async function generateQuiz(chapterTitle: string, paragraphsText: string): Promise<QuizQuestion[]> {
  if (isBackendSession()) {
    try {
      const data = await postJson<{ questions: QuizQuestion[] }>('/api/ai/quiz', { title: chapterTitle, text: paragraphsText });
      return data.questions;
    } catch {
      return []; // QuizModal shows a "could not create the quiz" message for an empty list
    }
  }

  return [
    {
      id: 'q-1',
      question: '¿Qué objeto trajo Melquíades en su primera visita a la aldea?',
      options: ['Un telescopio astronómico', 'Dos lingotes metálicos (imanes)', 'Una lupa gigante', 'Una brújula de oro'],
      correctIndex: 1,
      explanation: 'Melquíades presentó los imanes como la octava maravilla de los sabios alquimistas.'
    },
    {
      id: 'q-2',
      question: '¿De qué material estaban construidas las primeras casas de Macondo?',
      options: ['Ladrillo y teja cocida', 'Piedras de río pulidas', 'Barro y cañabrava', 'Madera de encina'],
      correctIndex: 2,
      explanation: 'Macondo era una aldea de veinte casas hechas de barro y cañabrava a la orilla del río.'
    },
    {
      id: 'q-3',
      question: '¿Por qué el junco supera la tempestad según la fábula?',
      options: ['Porque sus raíces son más profundas que las de la encina', 'Porque se dobla con el viento en lugar de quebrarse', 'Porque el agua lo protege de la tormenta', 'Porque la encina lo resguarda bajo sus ramas'],
      correctIndex: 1,
      explanation: 'El principio de Reed: se dobla, no exige. La flexibilidad le permite resistir la fuerza del viento.'
    }
  ];
}

// ---------- voice (ElevenLabs text to speech) ----------

/** MP3 of the text in the ElevenLabs voice, as an object URL. Throws ApiError (429 = daily limit). */
export async function synthesizeSpeech(text: string): Promise<string> {
  const res = await apiFetch('/api/tts', { method: 'POST', body: JSON.stringify({ text: text.slice(0, 2500) }) });
  return URL.createObjectURL(await res.blob());
}

// ---------- library ----------

type ApiChapter = { number: number; title: string; paragraphs: string[] };
type ApiDocument = {
  id: string;
  title: string;
  author: string | null;
  status: 'processing' | 'ready' | 'failed';
  chapterCount: number;
  paragraphCount: number;
  createdAt: string;
  /** Catalog book: shared public-domain demo book every user can read (not deletable). */
  isPublic: boolean;
  description: string | null;
  progress?: { position: number; percent: number } | null;
};

/** Library card for a backend document; chapters are loaded when the book is opened. */
function toBook(doc: ApiDocument): Book {
  const position = doc.progress?.position ?? 0;
  const percent = Math.round(doc.progress?.percent ?? 0);
  return {
    id: doc.id,
    documentId: doc.id,
    title: doc.title,
    author: doc.author || 'Autor desconocido',
    currentChapterNumber: 1,
    totalChapters: doc.chapterCount,
    totalParagraphs: doc.paragraphCount,
    progressPosition: position,
    progressPercent: percent,
    whereYouLeftOff: doc.progress
      ? `Vas en el ${percent}% del libro.`
      : doc.description || 'Aún no empiezas este libro.',
    hasAudio: true,
    addedAt: doc.createdAt.slice(0, 10),
    tags: doc.isPublic ? ['Biblioteca Reed', 'Dominio público'] : ['Mi biblioteca'],
    recommendationReason: doc.description || undefined,
    chapters: [],
  };
}

/** Fills a backend book's chapters and opens it at the chapter where the reader left off. */
export async function loadBookContent(book: Book): Promise<Book> {
  if (!book.documentId || book.chapters.length) return book;
  const { content } = await (await apiFetch(`/api/documents/${book.documentId}/content`)).json() as {
    content: { chapters: ApiChapter[] };
  };
  let paragraphIndex = 0;
  let currentChapterNumber = 1;
  const chapters: Chapter[] = content.chapters.map((c) => {
    const startIndex = paragraphIndex;
    paragraphIndex += c.paragraphs.length;
    if ((book.progressPosition ?? 0) >= startIndex) currentChapterNumber = c.number;
    return {
      id: `${book.documentId}-ch-${c.number}`,
      number: c.number,
      title: c.title,
      startIndex,
      paragraphs: c.paragraphs.map((text, i) => ({ id: `${book.documentId}-p-${startIndex + i}`, order: i + 1, text })),
    };
  });
  return { ...book, chapters, currentChapterNumber, totalChapters: chapters.length };
}

export async function listLibrary(): Promise<Book[]> {
  const { documents } = await (await apiFetch('/api/documents')).json() as { documents: ApiDocument[] };
  return documents.filter((d) => d.status === 'ready').map(toBook);
}

export async function uploadBook(file: File, title: string, author: string): Promise<Book> {
  const form = new FormData();
  form.append('file', file);
  form.append('title', title);
  if (author) form.append('author', author);
  const { document } = await (await apiFetch('/api/documents', { method: 'POST', body: form })).json() as { document: ApiDocument };
  return loadBookContent(toBook(document));
}

/** Saves where the reader is: `position` is the paragraph index across the whole book. */
export async function saveProgress(documentId: string, position: number, percent: number): Promise<void> {
  await apiFetch(`/api/documents/${documentId}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ position, percent: Math.min(100, Math.max(0, percent)) }),
  });
}
