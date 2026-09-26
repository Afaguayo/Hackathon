export type ReedMode = 'sleeping' | 'companion' | 'teacher' | 'librarian' | 'reader';

export interface Paragraph {
  id: string;
  order: number;
  text: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  audioUrl?: string;
  duration?: number; // seconds
  whereYouLeftOffSummary?: string;
  paragraphs: Paragraph[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  currentChapterNumber: number;
  totalChapters: number;
  progressPercent: number;
  whereYouLeftOff: string;
  hasAudio: boolean;
  coverAccent?: string;
  genre?: string;
  publishedYear?: number;
  addedAt?: string;
  tags?: string[];
  recommendationReason?: string;
  curiosities?: string[];
  chapters: Chapter[];
}

export interface ConversationMessage {
  id: string;
  sender: 'user' | 'reed';
  text: string;
  paragraphQuote?: string;
  timestamp: string;
  socraticLevel?: number; // 1: pista, 2: pregunta razonamiento, 3: explicacion directa
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  type?: 'multiple' | 'boolean' | 'comprehension';
}

export interface ReadingSessionStats {
  bookId: string;
  bookTitle: string;
  chapterTitle: string;
  startParagraphOrder: number;
  endParagraphOrder: number;
  secondsReading: number;
  startedAt: string;
}
