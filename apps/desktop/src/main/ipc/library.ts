import { ipcMain } from "electron";
import type {
  AddLibraryEntryInput,
  CreateLibraryCustomListInput,
  LibraryListQuery,
  LibraryRefreshSummary,
  LibraryUpdateItem,
  ReadingStatus,
} from "@contracts/library";
import {
  addLibraryEntryToCustomList,
  addToLibrary,
  removeFromLibrary,
  createLibraryCustomList,
  deleteLibraryCustomList,
  listLibraryEntries,
  listLibraryCustomLists,
  listLibraryUpdates,
  refreshLibraryUpdates,
  removeLibraryEntryFromCustomList,
  setLibraryFavorite,
  setLibraryReadingStatus,
  updateLibraryCover,
  updateLibraryTotalChapterCount,
} from "@library/library-service";

const ADD_TO_LIBRARY_CHANNEL = "library:add";
const REMOVE_FROM_LIBRARY_CHANNEL = "library:remove";
const LIST_LIBRARY_CHANNEL = "library:list";
const UPDATE_LIBRARY_STATUS_CHANNEL = "library:update-status";
const UPDATE_LIBRARY_FAVORITE_CHANNEL = "library:update-favorite";
const CREATE_LIBRARY_LIST_CHANNEL = "library-lists:create";
const DELETE_LIBRARY_LIST_CHANNEL = "library-lists:delete";
const LIST_LIBRARY_LISTS_CHANNEL = "library-lists:list";
const ADD_LIBRARY_LIST_MEMBERSHIP_CHANNEL = "library-lists:add-entry";
const REMOVE_LIBRARY_LIST_MEMBERSHIP_CHANNEL = "library-lists:remove-entry";
const REFRESH_LIBRARY_UPDATES_CHANNEL = "library:refresh-updates";
const LIST_LIBRARY_UPDATES_CHANNEL = "library:list-updates";
const UPDATE_TOTAL_CHAPTERS_CHANNEL = "library:update-total-chapters";
const UPDATE_LIBRARY_COVER_CHANNEL = "library:update-cover";

export function registerLibraryIpc() {
  ipcMain.handle(ADD_TO_LIBRARY_CHANNEL, async (_, input: AddLibraryEntryInput) => addToLibrary(input));
  ipcMain.handle(REMOVE_FROM_LIBRARY_CHANNEL, async (_, libraryEntryId: string) => removeFromLibrary(libraryEntryId));
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
  ipcMain.handle(DELETE_LIBRARY_LIST_CHANNEL, (_, listId: string) =>
    deleteLibraryCustomList(listId),
  );
  ipcMain.handle(LIST_LIBRARY_LISTS_CHANNEL, () => listLibraryCustomLists());
  ipcMain.handle(ADD_LIBRARY_LIST_MEMBERSHIP_CHANNEL, (_, libraryEntryId: string, listId: string) =>
    addLibraryEntryToCustomList(libraryEntryId, listId),
  );
  ipcMain.handle(REMOVE_LIBRARY_LIST_MEMBERSHIP_CHANNEL, (_, libraryEntryId: string, listId: string) =>
    removeLibraryEntryFromCustomList(libraryEntryId, listId),
  );
  ipcMain.handle(
    REFRESH_LIBRARY_UPDATES_CHANNEL,
    (): Promise<LibraryRefreshSummary> => refreshLibraryUpdates(),
  );
  ipcMain.handle(
    LIST_LIBRARY_UPDATES_CHANNEL,
    (): Promise<LibraryUpdateItem[]> | LibraryUpdateItem[] => listLibraryUpdates(),
  );
  ipcMain.handle(
    UPDATE_TOTAL_CHAPTERS_CHANNEL,
    (_, libraryEntryId: string, totalChapterCount: number): void =>
      updateLibraryTotalChapterCount(libraryEntryId, totalChapterCount),
  );
  ipcMain.handle(
    UPDATE_LIBRARY_COVER_CHANNEL,
    (_, sourceId: string, sourceTitleId: string, coverUrl: string) =>
      updateLibraryCover(sourceId, sourceTitleId, coverUrl),
  );
}
