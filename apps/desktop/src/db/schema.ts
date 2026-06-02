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
    status TEXT NOT NULL CHECK(status IN ('ready', 'invalid', 'disabled', 'incompatible')),
    failure_reason TEXT,
    plugin_directory TEXT,
    manifest_path TEXT,
    entry_file TEXT,
    runtime_mode TEXT NOT NULL DEFAULT 'manifest-only' CHECK(runtime_mode IN ('built-in', 'manifest-only', 'source-runtime')),
    compatibility_status TEXT NOT NULL DEFAULT 'unknown' CHECK(compatibility_status IN ('compatible', 'incompatible', 'unknown')),
    compatibility_reason TEXT,
    loaded_source_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS source_registry (
    source_id TEXT PRIMARY KEY,
    plugin_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'unknown',
    base_url TEXT NOT NULL DEFAULT 'https://example.invalid',
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

  CREATE TABLE IF NOT EXISTS download_jobs (
    job_id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    source_title_id TEXT NOT NULL,
    title_name TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    chapter_title TEXT NOT NULL,
    cover_url TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'paused', 'completed', 'failed')),
    destination_type TEXT NOT NULL CHECK(destination_type IN ('app_managed', 'external')),
    destination_path TEXT NOT NULL,
    total_files INTEGER NOT NULL DEFAULT 0,
    completed_files INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS imported_titles (
    imported_title_id TEXT PRIMARY KEY,
    title_name TEXT NOT NULL,
    title_slug TEXT,
    description TEXT,
    cover_path TEXT,
    source_path TEXT NOT NULL,
    import_type TEXT NOT NULL CHECK(import_type IN ('folder', 'cbz', 'pdf')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS imported_chapters (
    imported_chapter_id TEXT PRIMARY KEY,
    imported_title_id TEXT NOT NULL,
    chapter_title TEXT NOT NULL,
    chapter_number REAL,
    source_path TEXT NOT NULL,
    availability TEXT NOT NULL CHECK(availability IN ('readable', 'locked', 'unavailable')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(imported_title_id) REFERENCES imported_titles(imported_title_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS imported_pages (
    imported_page_id TEXT PRIMARY KEY,
    imported_chapter_id TEXT NOT NULL,
    page_index INTEGER NOT NULL,
    asset_path TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(imported_chapter_id) REFERENCES imported_chapters(imported_chapter_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reading_history (
    history_id TEXT PRIMARY KEY,
    library_entry_id TEXT,
    source_id TEXT NOT NULL,
    source_title_id TEXT NOT NULL,
    title_name TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    chapter_title TEXT NOT NULL,
    opened_at TEXT NOT NULL,
    FOREIGN KEY(library_entry_id) REFERENCES library_entries(library_entry_id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS reading_sessions (
    session_id TEXT PRIMARY KEY,
    library_entry_id TEXT,
    source_id TEXT NOT NULL,
    source_title_id TEXT NOT NULL,
    title_name TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    chapter_title TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY(library_entry_id) REFERENCES library_entries(library_entry_id) ON DELETE SET NULL
  );
`;

const READING_PROGRESS_SCHEMA = `
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

const DOWNLOAD_JOBS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS download_jobs (
    job_id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    source_title_id TEXT NOT NULL,
    title_name TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    chapter_title TEXT NOT NULL,
    cover_url TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'paused', 'completed', 'failed')),
    destination_type TEXT NOT NULL CHECK(destination_type IN ('app_managed', 'external')),
    destination_path TEXT NOT NULL,
    total_files INTEGER NOT NULL DEFAULT 0,
    completed_files INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT
  );
`;

const IMPORTED_CONTENT_SCHEMA = `
  CREATE TABLE IF NOT EXISTS imported_titles (
    imported_title_id TEXT PRIMARY KEY,
    title_name TEXT NOT NULL,
    title_slug TEXT,
    description TEXT,
    cover_path TEXT,
    source_path TEXT NOT NULL,
    import_type TEXT NOT NULL CHECK(import_type IN ('folder', 'cbz', 'pdf')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS imported_chapters (
    imported_chapter_id TEXT PRIMARY KEY,
    imported_title_id TEXT NOT NULL,
    chapter_title TEXT NOT NULL,
    chapter_number REAL,
    source_path TEXT NOT NULL,
    availability TEXT NOT NULL CHECK(availability IN ('readable', 'locked', 'unavailable')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(imported_title_id) REFERENCES imported_titles(imported_title_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS imported_pages (
    imported_page_id TEXT PRIMARY KEY,
    imported_chapter_id TEXT NOT NULL,
    page_index INTEGER NOT NULL,
    asset_path TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(imported_chapter_id) REFERENCES imported_chapters(imported_chapter_id) ON DELETE CASCADE
  );
`;

const ANALYTICS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS reading_history (
    history_id TEXT PRIMARY KEY,
    library_entry_id TEXT,
    source_id TEXT NOT NULL,
    source_title_id TEXT NOT NULL,
    title_name TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    chapter_title TEXT NOT NULL,
    opened_at TEXT NOT NULL,
    FOREIGN KEY(library_entry_id) REFERENCES library_entries(library_entry_id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS reading_sessions (
    session_id TEXT PRIMARY KEY,
    library_entry_id TEXT,
    source_id TEXT NOT NULL,
    source_title_id TEXT NOT NULL,
    title_name TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    chapter_title TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
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
  database.exec(READING_PROGRESS_SCHEMA);
  database.exec(DOWNLOAD_JOBS_SCHEMA);
  database.exec(IMPORTED_CONTENT_SCHEMA);
  database.exec(ANALYTICS_SCHEMA);
  ensureColumn(database, "library_entries", "cover_url", "TEXT");
  ensureColumn(
    database,
    "library_entries",
    "reading_status",
    "TEXT NOT NULL DEFAULT 'plan_to_read'",
  );
  ensureColumn(database, "library_entries", "is_favorite", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(database, "plugin_registry", "plugin_directory", "TEXT");
  ensureColumn(database, "plugin_registry", "manifest_path", "TEXT");
  ensureColumn(database, "plugin_registry", "entry_file", "TEXT");
  ensureColumn(
    database,
    "plugin_registry",
    "runtime_mode",
    "TEXT NOT NULL DEFAULT 'manifest-only'",
  );
  ensureColumn(
    database,
    "plugin_registry",
    "compatibility_status",
    "TEXT NOT NULL DEFAULT 'unknown'",
  );
  ensureColumn(database, "plugin_registry", "compatibility_reason", "TEXT");
  ensureColumn(database, "plugin_registry", "loaded_source_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(database, "source_registry", "language", "TEXT NOT NULL DEFAULT 'unknown'");
  ensureColumn(
    database,
    "source_registry",
    "base_url",
    "TEXT NOT NULL DEFAULT 'https://example.invalid'",
  );
}
