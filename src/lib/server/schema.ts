import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const files = sqliteTable('files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  url: text('url').notNull().unique(),
  path: text('path').notNull(),
  size: integer('size').notNull(),
  mimeType: text('mime_type').notNull(),
  referenceCount: integer('reference_count').notNull().default(1),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull(),
  lastReferencedAt: integer('last_referenced_at', { mode: 'timestamp' }).notNull()
});

// Add any indexes
// sql`CREATE INDEX IF NOT EXISTS idx_files_url ON files(url)`;

// Export the schema for use in migrations
export const schema = {
  files
};
