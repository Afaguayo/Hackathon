import { Book, Chapter, Paragraph } from '../types';

export interface ReaderPage {
  index: number;
  chapterNumber: number;
  chapterTitle: string;
  pageInChapter: number;
  paragraphs: Paragraph[];
}

const TARGET_CHARS = 520;

export function paginateBook(book: Book): ReaderPage[] {
  const pages: ReaderPage[] = [];

  book.chapters.forEach((chapter) => {
    let bucket: Paragraph[] = [];
    let size = 0;
    let pageInChapter = 1;

    const flush = () => {
      if (!bucket.length) return;
      pages.push({
        index: pages.length,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        pageInChapter,
        paragraphs: bucket,
      });
      pageInChapter += 1;
      bucket = [];
      size = 0;
    };

    for (const paragraph of chapter.paragraphs) {
      if (paragraph.pageBreak) {
        flush();
        bucket = [paragraph];
        flush();
        continue;
      }
      if (bucket.length && size + paragraph.text.length > TARGET_CHARS) flush();
      bucket.push(paragraph);
      size += paragraph.text.length;
    }
    flush();
  });

  return pages;
}

export function progressForPage(pageIndex: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round(((pageIndex + 1) / total) * 100);
}

export function pageIndexForPosition(pages: ReaderPage[], chapterNumber: number, globalPage: number): number {
  if (globalPage >= 1 && globalPage <= pages.length) return globalPage - 1;
  const byChapter = pages.findIndex((page) => page.chapterNumber === chapterNumber);
  return byChapter >= 0 ? byChapter : 0;
}

export function chapterStarts(pages: ReaderPage[]): ReaderPage[] {
  const seen = new Set<number>();
  return pages.filter((page) => {
    if (seen.has(page.chapterNumber)) return false;
    seen.add(page.chapterNumber);
    return true;
  });
}

const HEADING = /^(cap[ií]tulo|chapter)\s+(\d+|[ivxlcdm]+)\b[.:\-\s–—]*(.*)$/i;

export function chaptersFromPlainText(raw: string): Chapter[] {
  const blocks = raw.replace(/\r/g, '').split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const chapters: Chapter[] = [];
  let current: Chapter | null = null;

  const ensure = () => {
    if (current) return current;
    current = {
      id: `ch-${chapters.length + 1}`,
      number: chapters.length + 1,
      title: 'Lectura',
      paragraphs: [],
    };
    chapters.push(current);
    return current;
  };

  for (const block of blocks) {
    const firstLine = block.split('\n')[0].trim();
    const match = firstLine.match(HEADING);
    if (match && firstLine.length < 90) {
      const number = chapters.length + 1;
      const subtitle = (match[3] || '').trim();
      current = {
        id: `ch-${number}-${crypto.randomUUID()}`,
        number,
        title: subtitle ? `Capítulo ${number} · ${subtitle}` : `Capítulo ${number}`,
        paragraphs: [],
      };
      chapters.push(current);
      const rest = block.slice(firstLine.length).trim();
      if (rest) {
        current.paragraphs.push({
          id: `p-${number}-0`,
          order: 1,
          text: rest.replace(/\s+/g, ' '),
        });
      }
      continue;
    }

    const chapter = ensure();
    chapter.paragraphs.push({
      id: `p-${chapter.number}-${chapter.paragraphs.length}`,
      order: chapter.paragraphs.length + 1,
      text: block.replace(/\s+/g, ' '),
    });
  }

  return chapters.filter((chapter) => chapter.paragraphs.length > 0);
}

export function chaptersFromPdfPages(pageTexts: string[]): Chapter[] {
  const pages = pageTexts.map((text) => text.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (!pages.length) return [];

  const hasHeading = pages.some((page) => HEADING.test(page.slice(0, 90)));
  if (!hasHeading) {
    return [{
      id: 'ch-lectura',
      number: 1,
      title: 'Lectura',
      paragraphs: pages.map((text, index) => ({
        id: `pdf-p-${index + 1}`,
        order: index + 1,
        text,
        pageBreak: true,
      })),
    }];
  }

  const chapters: Chapter[] = [];
  let current: Chapter | null = null;

  pages.forEach((text, index) => {
    const match = text.match(HEADING);
    if (match && match.index === 0) {
      const number = chapters.length + 1;
      const subtitle = (match[3] || '').trim().slice(0, 80);
      current = {
        id: `ch-${number}`,
        number,
        title: subtitle ? `Capítulo ${number} · ${subtitle}` : `Capítulo ${number}`,
        paragraphs: [],
      };
      chapters.push(current);
      const body = text.slice(match[0].length).trim();
      if (body) {
        current.paragraphs.push({
          id: `pdf-p-${index + 1}`,
          order: 1,
          text: body,
          pageBreak: true,
        });
      }
      return;
    }

    if (!current) {
      current = { id: 'ch-1', number: 1, title: 'Lectura', paragraphs: [] };
      chapters.push(current);
    }
    current.paragraphs.push({
      id: `pdf-p-${index + 1}`,
      order: current.paragraphs.length + 1,
      text,
      pageBreak: true,
    });
  });

  return chapters.filter((chapter) => chapter.paragraphs.length > 0);
}

export function buildUploadedBook(title: string, author: string, chapters: Chapter[]): Book {
  return {
    id: `upload-${crypto.randomUUID()}`,
    title: title.trim() || 'Libro sin título',
    author: author.trim() || 'Autor desconocido',
    currentChapterNumber: 1,
    totalChapters: chapters.length,
    progressPercent: 0,
    whereYouLeftOff: 'Sin empezar',
    hasAudio: true,
    genre: 'Subido por ti',
    addedAt: new Date().toISOString(),
    chapters,
  };
}
