import { QuizQuestion } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export async function explainParagraph(paragraphText: string, userQuestion: string): Promise<string> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paragraph: paragraphText, question: userQuestion })
    });
    if (res.ok) {
      const data = await res.json();
      return data.explanation;
    }
  } catch {
    // Backend offline / development fallback
  }

  // Fallback explicativo con la voz y tono de Reed:
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
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: chapterTitle, text: paragraphsText })
    });
    if (res.ok) {
      const data = await res.json();
      return data.summary;
    }
  } catch {
    // Backend offline fallback
  }

  return `Quedaste en la llegada de Melquíades y la fascinación por los nuevos inventos. José Arcadio Buendía queda obsesionado con los imanes y su potencial para extraer metales preciosos, mostrando el espíritu fundacional y fantástico de Macondo.`;
}

export async function generateQuiz(chapterTitle: string, paragraphsText: string): Promise<QuizQuestion[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: chapterTitle, text: paragraphsText })
    });
    if (res.ok) {
      const data = await res.json();
      return data.questions;
    }
  } catch {
    // Backend offline fallback
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
