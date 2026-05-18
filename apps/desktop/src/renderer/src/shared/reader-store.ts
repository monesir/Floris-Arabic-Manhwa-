import type {
  ReaderPreferences,
  ReaderStateSnapshot,
  ReadingProgressSnapshot,
  SaveReadingProgressInput,
} from "@contracts/reader";

export function getReaderState(
  sourceId: string,
  sourceTitleId: string,
  libraryEntryId?: string | null,
) {
  return window.readerStore.getState(sourceId, sourceTitleId, libraryEntryId) as Promise<ReaderStateSnapshot>;
}

export function updateReaderPreferences(preferences: ReaderPreferences) {
  return window.readerStore.updatePreferences(preferences) as Promise<ReaderPreferences>;
}

export function saveReadingProgress(input: SaveReadingProgressInput) {
  return window.readerStore.saveProgress(input) as Promise<ReadingProgressSnapshot | null>;
}
