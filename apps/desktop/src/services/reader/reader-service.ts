import { getDatabase } from "@db/database";
import { AnalyticsRepository } from "@db/repositories/analytics-repository";
import { LibraryRepository } from "@db/repositories/library-repository";
import { ReadingProgressRepository } from "@db/repositories/reading-progress-repository";
import { SettingsRepository } from "@db/repositories/settings-repository";
import {
  DEFAULT_READER_PREFERENCES,
  readerFitModeSchema,
  readerModeSchema,
  readerPreferencesSchema,
  readerStateSnapshotSchema,
  saveReadingProgressInputSchema,
  type ReaderPreferences,
  type ReaderStateSnapshot,
  type SaveReadingProgressInput,
} from "@contracts/reader";

const READER_MODE_KEY = "reader.mode";
const READER_FIT_MODE_KEY = "reader.fit_mode";
const READER_ZOOM_KEY = "reader.zoom_percent";

function getRepositories() {
  const database = getDatabase();

  return {
    libraryRepository: new LibraryRepository(database),
    analyticsRepository: new AnalyticsRepository(database),
    progressRepository: new ReadingProgressRepository(database),
    settingsRepository: new SettingsRepository(database),
  };
}

function ensureAnalyticsTables() {
  const database = getDatabase();

  database.exec(`
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
  `);
}

function readPreferences(repository: SettingsRepository): ReaderPreferences {
  const mode = readerModeSchema
    .catch(DEFAULT_READER_PREFERENCES.mode)
    .parse(repository.getValue(READER_MODE_KEY));
  const fitMode = readerFitModeSchema
    .catch(DEFAULT_READER_PREFERENCES.fitMode)
    .parse(repository.getValue(READER_FIT_MODE_KEY));
  const zoomPercent = Number(repository.getValue(READER_ZOOM_KEY) ?? DEFAULT_READER_PREFERENCES.zoomPercent);

  return readerPreferencesSchema.parse({
    mode,
    fitMode,
    zoomPercent: Number.isFinite(zoomPercent) ? zoomPercent : DEFAULT_READER_PREFERENCES.zoomPercent,
  });
}

function writePreferences(repository: SettingsRepository, preferences: ReaderPreferences) {
  repository.setValue(READER_MODE_KEY, preferences.mode);
  repository.setValue(READER_FIT_MODE_KEY, preferences.fitMode);
  repository.setValue(READER_ZOOM_KEY, String(preferences.zoomPercent));
}

export function getReaderState(sourceId: string, sourceTitleId: string, libraryEntryId?: string | null) {
  const { libraryRepository, progressRepository, settingsRepository } = getRepositories();
  const linkedLibraryEntry =
    libraryEntryId
      ? libraryRepository.getById(libraryEntryId)
      : libraryRepository.getBySourceIdentity(sourceId, sourceTitleId);
  const progress = progressRepository.getBySourceTitle(sourceId, sourceTitleId);

  return readerStateSnapshotSchema.parse({
    libraryEntryId: linkedLibraryEntry?.libraryEntryId ?? progress?.libraryEntryId ?? null,
    preferences: readPreferences(settingsRepository),
    progress,
  } satisfies ReaderStateSnapshot);
}

export function updateReaderPreferences(preferences: ReaderPreferences) {
  const { settingsRepository } = getRepositories();
  const nextPreferences = readerPreferencesSchema.parse(preferences);

  writePreferences(settingsRepository, nextPreferences);

  return readPreferences(settingsRepository);
}

export function saveReadingProgress(input: SaveReadingProgressInput) {
  const { libraryRepository, progressRepository } = getRepositories();
  const parsedInput = saveReadingProgressInputSchema.parse(input);
  const linkedLibraryEntry =
    parsedInput.libraryEntryId
      ? libraryRepository.getById(parsedInput.libraryEntryId)
      : libraryRepository.getBySourceIdentity(parsedInput.sourceId, parsedInput.sourceTitleId);
  const timestamp = new Date().toISOString();

  if (linkedLibraryEntry && linkedLibraryEntry.readingStatus === "plan_to_read") {
    libraryRepository.updateReadingStatus(linkedLibraryEntry.libraryEntryId, "reading");
  }

  return progressRepository.upsert({
    sourceId: parsedInput.sourceId,
    sourceTitleId: parsedInput.sourceTitleId,
    libraryEntryId: linkedLibraryEntry?.libraryEntryId ?? parsedInput.libraryEntryId ?? null,
    lastReadChapterId: parsedInput.chapterId,
    lastReadPageIndex: parsedInput.pageIndex,
    lastReadScrollProgress: parsedInput.scrollProgress,
    updatedAt: timestamp,
  });
}

export function startReadingSession(input: {
  sourceId: string;
  sourceTitleId: string;
  libraryEntryId?: string | null;
  titleName: string;
  chapterId: string;
  chapterTitle: string;
}) {
  const { libraryRepository, analyticsRepository } = getRepositories();
  const linkedLibraryEntry =
    input.libraryEntryId
      ? libraryRepository.getById(input.libraryEntryId)
      : libraryRepository.getBySourceIdentity(input.sourceId, input.sourceTitleId);

  analyticsRepository.logHistory({
    libraryEntryId: linkedLibraryEntry?.libraryEntryId ?? input.libraryEntryId ?? null,
    sourceId: input.sourceId,
    sourceTitleId: input.sourceTitleId,
    titleName: input.titleName,
    chapterId: input.chapterId,
    chapterTitle: input.chapterTitle,
  });

  return analyticsRepository.startSession({
    libraryEntryId: linkedLibraryEntry?.libraryEntryId ?? input.libraryEntryId ?? null,
    sourceId: input.sourceId,
    sourceTitleId: input.sourceTitleId,
    titleName: input.titleName,
    chapterId: input.chapterId,
    chapterTitle: input.chapterTitle,
  });
}

export function endReadingSession(sessionId: string) {
  const { analyticsRepository } = getRepositories();
  return analyticsRepository.endSession(sessionId);
}

export function bootstrapReaderAnalytics() {
  ensureAnalyticsTables();
  const { analyticsRepository } = getRepositories();
  analyticsRepository.closeActiveSessionsAtStartup();
}
