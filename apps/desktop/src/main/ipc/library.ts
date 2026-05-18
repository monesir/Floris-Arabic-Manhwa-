import { ipcMain } from "electron";
import type {
  AddLibraryEntryInput,
  LibraryListQuery,
  ReadingStatus,
} from "@contracts/library";
import {
  addToLibrary,
  listLibraryEntries,
  setLibraryFavorite,
  setLibraryReadingStatus,
} from "@library/library-service";

const ADD_TO_LIBRARY_CHANNEL = "library:add";
const LIST_LIBRARY_CHANNEL = "library:list";
const UPDATE_LIBRARY_STATUS_CHANNEL = "library:update-status";
const UPDATE_LIBRARY_FAVORITE_CHANNEL = "library:update-favorite";

export function registerLibraryIpc() {
  ipcMain.handle(ADD_TO_LIBRARY_CHANNEL, (_, input: AddLibraryEntryInput) => addToLibrary(input));
  ipcMain.handle(LIST_LIBRARY_CHANNEL, (_, query?: LibraryListQuery) => listLibraryEntries(query));
  ipcMain.handle(
    UPDATE_LIBRARY_STATUS_CHANNEL,
    (_, libraryEntryId: string, readingStatus: ReadingStatus) =>
      setLibraryReadingStatus(libraryEntryId, readingStatus),
  );
  ipcMain.handle(
    UPDATE_LIBRARY_FAVORITE_CHANNEL,
    (_, libraryEntryId: string, isFavorite: boolean) =>
      setLibraryFavorite(libraryEntryId, isFavorite),
  );
}
