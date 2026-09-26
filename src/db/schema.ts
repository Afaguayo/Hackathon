import { index, integer, pgEnum, pgTable, primaryKey, real, text, timestamp, uuid } from "drizzle-orm/pg-core";

// userId columns hold the auth provider's user id (Clerk later; a demo id until then).

export const documentStatus = pgEnum("document_status", ["processing", "ready", "failed"]);

/** A book/article a user uploaded. Its text lives in the ElevenLabs knowledge base, searched by its own agent. */
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    author: text("author"),
    fileName: text("file_name"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    status: documentStatus("status").notNull().default("processing"),
    error: text("error"),
    elevenlabsKnowledgeBaseId: text("elevenlabs_knowledge_base_id"),
    elevenlabsAgentId: text("elevenlabs_agent_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("documents_user_idx").on(t.userId)],
);

/** Where a user is in a document. One row per (user, document). */
export const readingProgress = pgTable(
  "reading_progress",
  {
    userId: text("user_id").notNull(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0), // UI-defined: page, paragraph, or character offset
    percent: real("percent").notNull().default(0),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.documentId] })],
);

/** One voice session with the companion (filled from the ElevenLabs post-call webhook). */
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }),
    elevenlabsConversationId: text("elevenlabs_conversation_id").unique(),
    summary: text("summary"),
    durationSeconds: integer("duration_seconds"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("conversations_user_doc_idx").on(t.userId, t.documentId)],
);

export const messageRole = pgEnum("message_role", ["user", "agent"]);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: messageRole("role").notNull(),
    text: text("text").notNull(),
    secondsFromStart: real("seconds_from_start"),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId)],
);

export const noteType = pgEnum("note_type", ["highlight", "note", "definition"]);

/** Highlights, notes and word definitions the reader (or the agent) saved. */
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    type: noteType("type").notNull().default("note"),
    quote: text("quote"), // the passage it refers to
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notes_user_doc_idx").on(t.userId, t.documentId)],
);

export type Document = typeof documents.$inferSelect;
