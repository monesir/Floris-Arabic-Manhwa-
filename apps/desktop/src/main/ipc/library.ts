import { ipcMain } from "electron";
import type {
  AddLibraryEntryInput,
  CreateLibraryCustomListInput,
  LibraryListQuery,
  ReadingStatus,
} from "@contracts/library";
import {
  addLibraryEntryToCustomList,
  addToLibrary,
  createLibraryCustomList,
  listLibraryEntries,
  listLibraryCustomLists,
  removeLibraryEntryFromCustomList,
  setLibraryFavorite,
  setLibraryReadingStatus,
} from "@library/library-service";

const ADD_TO_LIBRARY_CHANNEL = "library:add";
const LIST_LIBRARY_CHANNEL = "library:list";
const UPDATE_LIBRARY_STATUS_CHANNEL = "library:update-status";
const UPDATE_LIBRARY_FAVORITE_CHANNEL = "library:update-favorite";
const CREATE_LIBRARY_LIST_CHANNEL = "library-lists:create";
const LIST_LIBRARY_LISTS_CHANNEL = "library-lists:list";
const ADD_LIBRARY_LIST_MEMBERSHIP_CHANNEL = "library-lists:add-entry";
const REMOVE_LIBRARY_LIST_MEMBERSHIP_CHANNEL = "library-lists:remove-entry";

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
  ipcMain.handle(CREATE_LIBRARY_LIST_CHANNEL, (_, input: CreateLibraryCustomListInput) =>
    createLibraryCustomList(input),
  );
  ipcMain.handle(LIST_LIBRARY_LISTS_CHANNEL, () => listLibraryCustomLists());
  ipcMain.handle(ADD_LIBRARY_LIST_MEMBERSHIP_CHANNEL, (_, libraryEntryId: string, listId: string) =>
    addLibraryEntryToCustomList(libraryEntryId, listId),
  );
  ipcMain.handle(REMOVE_LIBRARY_LIST_MEMBERSHIP_CHANNEL, (_, libraryEntryId: string, listId: string) =>
    removeLibraryEntryFromCustomList(libraryEntryId, listId),
  );
}
