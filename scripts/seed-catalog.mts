// Seeds the shared demo catalog: public-domain educational books every user can read.
//   npm run db:seed-catalog            # add missing books (idempotent, keyed by source URL)
//   npm run db:seed-catalog -- --dry-run   # show what would be added, write nothing
// Needs .env / .env.local with DATABASE_URL, ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID.
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";

config({ path: [".env.local", ".env"], quiet: true });

const { getDb, schema } = await import("../src/db");
const { CATALOG_USER_ID } = await import("../src/db/schema");
const { extractBookContent, contentToText, countParagraphs } = await import("../src/lib/book-text");
const { createDocumentAgent, deleteAgent, deleteKnowledgeDoc, uploadKnowledgeText } = await import("../src/lib/elevenlabs");
type RawChapter = import("../src/lib/book-text").RawChapter;

// Spanish public-domain books from Project Gutenberg, chosen to show Reed on different subjects.
const CATALOG = [
  {
    gutenbergId: 66373,
    title: "Reglas y consejos sobre investigación científica",
    author: "Santiago Ramón y Cajal",
    description:
      "El Nobel de Medicina de 1906 explica cómo piensa y trabaja un investigador: la voluntad, la curiosidad y el método. Ideal para pedirle a Reed ejemplos actuales de cada consejo.",
  },
  {
    gutenbergId: 11598,
    title: "La Montaña",
    author: "Élisée Reclus",
    description:
      "Un geógrafo recorre la montaña de la cumbre al valle: rocas, glaciares, bosques y la vida que la habita. Ciencias de la Tierra contadas como una historia; pídele a Reed que te explique cada fenómeno.",
  },
  {
    gutenbergId: 26284,
    title: "El Mar",
    author: "Jules Michelet",
    description:
      "Historia natural del océano: mareas, corrientes, peces y el origen de la vida en el agua, escrita con pasión por un historiador francés. Buen libro para resúmenes por capítulo y quizzes.",
  },
  {
    gutenbergId: 64974,
    title: "El Hombre Mediocre",
    author: "José Ingenieros",
    description:
      "Ensayo clásico de psicología y ética sobre los ideales, la rutina y el carácter. Perfecto para debatir con Reed y ponerte a prueba con preguntas de comprensión.",
  },
  {
    gutenbergId: 22899,
    title: "Ariel",
    author: "José Enrique Rodó",
    description:
      "Un maestro se despide de sus alumnos con una lección sobre la juventud, la educación y la cultura. Ensayo breve e influyente en América Latina; pídele a Reed que te resuma cada idea.",
  },
];

const dryRun = process.argv.includes("--dry-run");
const USER_AGENT = "Mozilla/5.0 (reading-companion catalog seed)";

/**
 * Removes Project Gutenberg's header/license pages and mentions, transcriber notes and tiny front
 * matter, and Gutenberg's #small caps# markup. Runs before chapters are numbered and named.
 */
function cleanGutenberg(chapters: RawChapter[]): RawChapter[] {
  const isBoilerplate = (text: string) => /project gutenberg|gutenberg™|gutenberg\.org/i.test(text);
  let kept = chapters
    .filter((c) => !isBoilerplate(c.title) && !/transcri(p|t)/i.test(c.title + " " + (c.paragraphs[0] ?? "")))
    .map((c) => ({
      ...c,
      paragraphs: c.paragraphs.filter((p) => !isBoilerplate(p)).map((p) => p.replace(/^#([^#]+)#$/, "$1")),
    }))
    .filter((c) => c.paragraphs.length > 0);
  // Title pages and printer's imprints: short chapters before the first substantial one.
  const firstReal = kept.findIndex((c) => c.paragraphs.join(" ").length >= 600);
  if (firstReal > 0) kept = kept.slice(firstReal);
  return kept;
}

async function seedBook(book: (typeof CATALOG)[number]) {
  const source = `https://www.gutenberg.org/ebooks/${book.gutenbergId}`;
  const db = getDb();
  const [existing] = await db
    .select({ id: schema.documents.id })
    .from(schema.documents)
    .where(and(eq(schema.documents.source, source), eq(schema.documents.isPublic, true)));
  if (existing) return console.log(`= ${book.title}: already in the catalog`);

  const res = await fetch(`${source}.epub.noimages`, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`download failed (${res.status})`);
  const file = new File([await res.arrayBuffer()], `${book.gutenbergId}.epub`, { type: "application/epub+zip" });
  const content = await extractBookContent(file, { clean: cleanGutenberg });
  const paragraphs = countParagraphs(content);
  console.log(`+ ${book.title}: ${content.chapters.length} chapters, ${paragraphs} paragraphs`);
  if (dryRun) {
    for (const c of content.chapters.slice(0, 3)) console.log(`    [${c.number}] ${c.title} :: ${c.paragraphs[0].slice(0, 80)}`);
    return;
  }

  let documentId: string | undefined, knowledgeBaseId: string | undefined, agentId: string | undefined;
  try {
    [{ id: documentId }] = await db
      .insert(schema.documents)
      .values({
        userId: CATALOG_USER_ID,
        isPublic: true,
        title: book.title,
        author: book.author,
        description: book.description,
        source,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        content,
        chapterCount: content.chapters.length,
        paragraphCount: paragraphs,
      })
      .returning({ id: schema.documents.id });
    knowledgeBaseId = await uploadKnowledgeText(contentToText(content), book.title);
    agentId = await createDocumentAgent(knowledgeBaseId, book.title);
    await db
      .update(schema.documents)
      .set({ status: "ready", elevenlabsKnowledgeBaseId: knowledgeBaseId, elevenlabsAgentId: agentId, updatedAt: new Date() })
      .where(eq(schema.documents.id, documentId));
    console.log(`  ready (document ${documentId})`);
  } catch (err) {
    // Leave nothing half-created: a failed book can simply be seeded again.
    await Promise.allSettled([agentId && deleteAgent(agentId), knowledgeBaseId && deleteKnowledgeDoc(knowledgeBaseId)]);
    if (documentId) await db.delete(schema.documents).where(eq(schema.documents.id, documentId));
    throw err;
  }
}

let failed = 0;
for (const book of CATALOG) {
  try {
    await seedBook(book);
  } catch (err) {
    failed++;
    console.error(`! ${book.title}: ${err instanceof Error ? err.message : err}`);
  }
}
console.log(dryRun ? "Dry run: nothing written." : failed ? `${failed} book(s) failed; run again to retry.` : "Catalog is up to date.");
process.exit(failed ? 1 : 0);
