import { ipcMain } from "electron";
import type { ReaderPreferences, ReaderStateSnapshot, SaveReadingProgressInput, ReadingProgressSnapshot } from "@contracts/reader";
import { getReaderState, saveReadingProgress, updateReaderPreferences } from "@services/reader/reader-service";

const GET_READER_STATE_CHANNEL = "reader:get-state";
const UPDATE_READER_PREFERENCES_CHANNEL = "reader:update-preferences";
const SAVE_READER_PROGRESS_CHANNEL = "reader:save-progress";

export function registerReaderIpc() {
  ipcMain.handle(
    GET_READER_STATE_CHANNEL,
    (_, sourceId: string, sourceTitleId: string, libraryEntryId?: string | null): ReaderStateSnapshot =>
      getReaderState(sourceId, sourceTitleId, libraryEntryId),
  );
  ipcMain.handle(
    UPDATE_READER_PREFERENCES_CHANNEL,
    (_, preferences: ReaderPreferences): ReaderPreferences => updateReaderPreferences(preferences),
  );
  ipcMain.handle(
    SAVE_READER_PROGRESS_CHANNEL,
    (_, input: SaveReadingProgressInput): ReadingProgressSnapshot | null => saveReadingProgress(input),
  );
}
