export type ReedMode = 'sleeping' | 'companion' | 'teacher' | 'librarian' | 'reader';

export interface Paragraph {
  id: string;
  order: number;
  text: string;
  /** When true, this paragraph is its own page (for example a PDF page). */
  pageBreak?: boolean;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  audioUrl?: string;
  duration?: number; // seconds
  whereYouLeftOffSummary?: string;
  /** Backend books: index of this chapter's first paragraph across the whole book (for progress). */
  startIndex?: number;
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
  /** Set for books stored in the backend (the user's uploads); sample books don't have it. */
  documentId?: string;
  totalParagraphs?: number;
  /** Saved reading position: paragraph index across the whole book. */
  progressPosition?: number;
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

export type ReadingStatus = 'unread' | 'reading' | 'finished';

export type AppView = 'library' | 'catalog' | 'profile' | 'reader';

/** Progress belongs to the user, not to the catalog book. */
export interface UserBookRecord {
  bookId: string;
  currentChapter: number;
  currentPage: number;
  progress: number;
  status: ReadingStatus;
  addedAt: string;
  lastReadAt: string | null;
}

export interface ReadingPrefs {
  fontScale: 'sm' | 'md' | 'lg';
  font: 'serif' | 'sans';
  leading: 'compact' | 'normal' | 'wide';
  theme: 'light' | 'sepia' | 'dark';
}

export interface ReadingActivity {
  readDates: string[];
  nightSessions: number;
  readerModeUses: number;
  quizzesCompleted: number;
  readingSeconds: number;
  unlocked: string[];
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  requirement: string;
  emoji: string;
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
