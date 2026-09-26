import JSZip from "jszip";
import { extractTextItems } from "unpdf";

// Turns an uploaded book (PDF, EPUB, TXT, MD, HTML) into chapters of paragraphs for the reader.
// We extract text ourselves because the ElevenLabs knowledge-base extraction drops content from PDFs.

export type Chapter = { number: number; title: string; paragraphs: string[] };
export type BookContent = { chapters: Chapter[] };

export const SUPPORTED_EXTENSIONS = [".pdf", ".epub", ".txt", ".md", ".html", ".htm"] as const;

export class UnreadableBookError extends Error {}

// Each paragraph must fit one read-aloud request (MAX_TTS_CHARS = 2500), with room to spare.
const MAX_PARAGRAPH_CHARS = 1800;
// Books without headings are cut into sections of this many paragraphs so the reader stays navigable.
const PARAGRAPHS_PER_SECTION = 60;

const HEADING = /^(#{1,3}\s+.+|(cap[ií]tulo|chapter|parte|part|libro|book|pr[oó]logo|prologue|ep[ií]logo|epilogue)\b[^\n]{0,80})$/i;

export async function extractBookContent(file: File): Promise<BookContent> {
  const name = file.name.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());

  let chapters: Chapter[];
  if (name.endsWith(".pdf")) chapters = await fromPdf(bytes);
  else if (name.endsWith(".epub")) chapters = await fromEpub(bytes);
  else if (name.endsWith(".html") || name.endsWith(".htm")) chapters = fromHtmlDocuments([new TextDecoder().decode(bytes)]);
  else chapters = fromPlainText(new TextDecoder().decode(bytes));

  chapters = chapters
    .map((c) => ({ ...c, paragraphs: c.paragraphs.flatMap(splitLongParagraph).filter(Boolean) }))
    .filter((c) => c.paragraphs.length > 0);
  if (!chapters.length) {
    throw new UnreadableBookError("No readable text found in this file (a scanned PDF has no text layer).");
  }
  return { chapters: chapters.map((c, i) => ({ ...c, number: i + 1 })) };
}

/** Plain text of the whole book, used as the ElevenLabs knowledge-base document. */
export function contentToText(content: BookContent): string {
  return content.chapters.map((c) => `${c.title}\n\n${c.paragraphs.join("\n\n")}`).join("\n\n\n");
}

export function countParagraphs(content: BookContent): number {
  return content.chapters.reduce((n, c) => n + c.paragraphs.length, 0);
}

// ---------- formats ----------

type PdfLine = { text: string; x: number; y: number; right: number; fontSize: number; page: number };

/**
 * PDF text has no blank lines between paragraphs; they are visual gaps. Rebuild lines from
 * positioned text items, then start a paragraph on a larger vertical gap, an indented first line,
 * or a short line that ends a sentence. Headings are "Capítulo…"-style lines or larger fonts.
 */
async function fromPdf(bytes: Uint8Array): Promise<Chapter[]> {
  const { items } = await extractTextItems(bytes);
  const lines: PdfLine[] = [];
  items.forEach((pageItems, page) => {
    let current: PdfLine | undefined;
    for (const item of pageItems) {
      if (current && Math.abs(item.y - current.y) > Math.max(2, item.fontSize * 0.5)) {
        lines.push(current);
        current = undefined;
      }
      if (!current) {
        if (!item.str.trim()) continue;
        current = { text: "", x: item.x, y: item.y, right: item.x, fontSize: 0, page };
      }
      current.text += item.str;
      current.right = Math.max(current.right, item.x + item.width);
      if (item.str.trim()) current.fontSize = Math.max(current.fontSize, item.fontSize);
      if (item.hasEOL) {
        lines.push(current);
        current = undefined;
      }
    }
    if (current) lines.push(current);
  });
  const clean = lines.map((l) => ({ ...l, text: l.text.replace(/\s+/g, " ").trim() })).filter((l) => l.text);
  if (!clean.length) return [];

  const percentile = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) * p)] ?? 0;
  const gaps = clean
    .map((l, i) => (i > 0 && clean[i - 1].page === l.page ? Math.abs(clean[i - 1].y - l.y) : 0))
    .filter((g) => g > 0);
  // Normal line spacing: the tightest gaps (paragraph breaks are the wider ones).
  const lineGap = percentile(gaps, 0.1) || 14;
  const bodyFont = percentile(clean.map((l) => l.fontSize), 0.5) || 12;
  const leftMargin = percentile(clean.map((l) => l.x), 0.5);
  // Full line width: the widest line, so a short sentence-ending line stands out.
  const fullWidth = percentile(clean.map((l) => l.right), 1);

  const blocks: string[] = [];
  let paragraph = "";
  const flush = () => {
    if (paragraph.trim()) blocks.push(paragraph.trim());
    paragraph = "";
  };
  clean.forEach((line, i) => {
    const prev = clean[i - 1];
    const isHeading = line.text.length <= 100 && (HEADING.test(line.text) || line.fontSize >= bodyFont * 1.2);
    if (isHeading) {
      flush();
      blocks.push(line.text);
      return;
    }
    const newParagraph =
      !prev ||
      (prev.page === line.page && Math.abs(prev.y - line.y) > lineGap * 1.5) ||
      line.x > leftMargin + bodyFont * 1.2 ||
      (/[.!?…:»"”]$/.test(prev.text) && prev.right < fullWidth - bodyFont * 3);
    if (newParagraph) flush();
    if (paragraph.endsWith("-") && /^\p{Ll}/u.test(line.text)) paragraph = paragraph.slice(0, -1) + line.text; // re-join hyphenated words
    else paragraph += (paragraph ? " " : "") + line.text;
  });
  flush();
  return fromPlainText(blocks.join("\n\n"));
}

async function fromEpub(bytes: Uint8Array): Promise<Chapter[]> {
  const zip = await JSZip.loadAsync(bytes);
  const container = await zip.file("META-INF/container.xml")?.async("string");
  const opfPath = container?.match(/full-path="([^"]+)"/)?.[1];
  const opf = opfPath ? await zip.file(opfPath)?.async("string") : undefined;
  if (!opfPath || !opf) throw new UnreadableBookError("This EPUB is missing its table of contents (OPF).");

  const base = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
  const manifest = new Map<string, string>();
  for (const m of opf.matchAll(/<item\b[^>]*>/g)) {
    const id = m[0].match(/\bid="([^"]+)"/)?.[1];
    const href = m[0].match(/\bhref="([^"]+)"/)?.[1];
    if (id && href) manifest.set(id, decodeURIComponent(href));
  }
  const spine = [...opf.matchAll(/<itemref\b[^>]*\bidref="([^"]+)"/g)].map((m) => manifest.get(m[1])).filter(Boolean) as string[];

  const docs: string[] = [];
  for (const href of spine) {
    const html = await zip.file(base + href)?.async("string");
    if (html) docs.push(html);
  }
  return fromHtmlDocuments(docs);
}

/** One chapter per document (EPUB spine item), split further at <h1>/<h2>. */
function fromHtmlDocuments(docs: string[]): Chapter[] {
  const chapters: Chapter[] = [];
  for (const doc of docs) {
    const body = (doc.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? doc)
      .replace(/<(script|style|nav)[\s\S]*?<\/\1>/gi, "");
    let current: Chapter | undefined;
    for (const m of body.matchAll(/<(h[1-3]|p|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
      const text = htmlToText(m[2]);
      if (!text) continue;
      if (/^h[12]$/i.test(m[1]) || (!current && /^h3$/i.test(m[1]))) {
        current = { number: 0, title: text.slice(0, 120), paragraphs: [] };
        chapters.push(current);
      } else {
        if (!current) {
          current = { number: 0, title: `Capítulo ${chapters.length + 1}`, paragraphs: [] };
          chapters.push(current);
        }
        current.paragraphs.push(text);
      }
    }
  }
  return chapters.filter((c) => c.paragraphs.length > 0);
}

function fromPlainText(text: string): Chapter[] {
  const blocks = text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((b) => b.replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim())
    .filter(Boolean);

  const chapters: Chapter[] = [];
  let current: Chapter | undefined;
  for (const block of blocks) {
    if (HEADING.test(block) && block.length <= 100) {
      current = { number: 0, title: block.replace(/^#+\s*/, ""), paragraphs: [] };
      chapters.push(current);
    } else {
      if (!current) {
        current = { number: 0, title: "Capítulo 1", paragraphs: [] };
        chapters.push(current);
      }
      current.paragraphs.push(block);
    }
  }
  // No headings at all: cut one giant chapter into sections.
  if (chapters.length === 1 && chapters[0].paragraphs.length > PARAGRAPHS_PER_SECTION) {
    const all = chapters[0].paragraphs;
    return Array.from({ length: Math.ceil(all.length / PARAGRAPHS_PER_SECTION) }, (_, i) => ({
      number: 0,
      title: `Parte ${i + 1}`,
      paragraphs: all.slice(i * PARAGRAPHS_PER_SECTION, (i + 1) * PARAGRAPHS_PER_SECTION),
    }));
  }
  return chapters.filter((c) => c.paragraphs.length > 0);
}

// ---------- helpers ----------

function splitLongParagraph(paragraph: string): string[] {
  if (paragraph.length <= MAX_PARAGRAPH_CHARS) return [paragraph];
  const sentences = paragraph.match(/[^.!?…]+[.!?…]+["»”’)]*\s*|[^.!?…]+$/g) ?? [paragraph];
  const out: string[] = [];
  let chunk = "";
  for (const s of sentences) {
    if (chunk && (chunk + s).length > MAX_PARAGRAPH_CHARS) {
      out.push(chunk.trim());
      chunk = "";
    }
    // A single "sentence" longer than the limit (no punctuation) is hard-cut.
    for (let i = 0; i < s.length; i += MAX_PARAGRAPH_CHARS) {
      const piece = s.slice(i, i + MAX_PARAGRAPH_CHARS);
      if ((chunk + piece).length > MAX_PARAGRAPH_CHARS) {
        out.push(chunk.trim());
        chunk = "";
      }
      chunk += piece;
    }
  }
  if (chunk.trim()) out.push(chunk.trim());
  return out;
}

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»", ldquo: "“", rdquo: "”",
  lsquo: "‘", rsquo: "’", mdash: "—", ndash: "–", hellip: "…", iexcl: "¡", iquest: "¿", aacute: "á", eacute: "é",
  iacute: "í", oacute: "ó", uacute: "ú", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú",
  ntilde: "ñ", Ntilde: "Ñ", uuml: "ü", Uuml: "Ü",
};

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}
