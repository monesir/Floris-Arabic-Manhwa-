import { getDatabase } from "@db/database";
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
    progressRepository: new ReadingProgressRepository(database),
    settingsRepository: new SettingsRepository(database),
  };
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
