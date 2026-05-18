import type { DatabaseSync } from "node:sqlite";

const PHASE_ONE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS plugin_registry (
    plugin_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    entry_type TEXT NOT NULL CHECK(entry_type IN ('built-in', 'external')),
    status TEXT NOT NULL CHECK(status IN ('ready', 'invalid', 'disabled')),
    failure_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS source_registry (
    source_id TEXT PRIMARY KEY,
    plugin_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    capabilities_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(plugin_id) REFERENCES plugin_registry(plugin_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS library_entries (
    library_entry_id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    source_title_id TEXT NOT NULL,
    title_name TEXT NOT NULL,
    source_title_slug TEXT,
    cover_url TEXT,
    reading_status TEXT NOT NULL DEFAULT 'plan_to_read',
    is_favorite INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(source_id, source_title_id),
    FOREIGN KEY(source_id) REFERENCES source_registry(source_id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS library_custom_lists (
    list_id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS library_custom_list_memberships (
    list_id TEXT NOT NULL,
    library_entry_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (list_id, library_entry_id),
    FOREIGN KEY(list_id) REFERENCES library_custom_lists(list_id) ON DELETE CASCADE,
    FOREIGN KEY(library_entry_id) REFERENCES library_entries(library_entry_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS library_entry_updates (
    library_entry_id TEXT PRIMARY KEY,
    known_latest_chapter_id TEXT,
    known_latest_chapter_number REAL,
    known_latest_chapter_title TEXT,
    detected_latest_chapter_id TEXT,
    detected_latest_chapter_title TEXT,
    detected_latest_chapter_release_date TEXT,
    pending_update_count INTEGER NOT NULL DEFAULT 0,
    last_checked_at TEXT,
    last_detected_at TEXT,
    FOREIGN KEY(library_entry_id) REFERENCES library_entries(library_entry_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reading_progress (
    source_id TEXT NOT NULL,
    source_title_id TEXT NOT NULL,
    library_entry_id TEXT,
    last_read_chapter_id TEXT,
    last_read_page_index INTEGER NOT NULL DEFAULT 0,
    last_read_scroll_progress REAL NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (source_id, source_title_id),
    FOREIGN KEY(library_entry_id) REFERENCES library_entries(library_entry_id) ON DELETE SET NULL
  );
`;

function ensureColumn(
  database: DatabaseSync,
  tableName: string,
  columnName: string,
  definition: string,
) {
  const columns = database
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name: string }>;

  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
}

export function applyPhaseOneSchema(database: DatabaseSync) {
  database.exec(PHASE_ONE_SCHEMA);
  ensureColumn(database, "library_entries", "cover_url", "TEXT");
  ensureColumn(
    database,
    "library_entries",
    "reading_status",
    "TEXT NOT NULL DEFAULT 'plan_to_read'",
  );
  ensureColumn(database, "library_entries", "is_favorite", "INTEGER NOT NULL DEFAULT 0");
}
