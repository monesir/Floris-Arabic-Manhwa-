import type {
  AddLibraryEntryInput,
  CreateLibraryCustomListInput,
  LibraryCustomList,
  LibraryEntry,
  LibraryListQuery,
  LibraryRefreshSummary,
  LibraryUpdateItem,
  ReadingStatus,
} from "@contracts/library";

export function addLibraryEntry(input: AddLibraryEntryInput) {
  return window.libraryStore.add(input) as Promise<LibraryEntry>;
}

export function removeLibraryEntry(libraryEntryId: string) {
  return window.libraryStore.remove(libraryEntryId) as Promise<void>;
}

export function listLibraryEntries(query?: LibraryListQuery) {
  return window.libraryStore.list(query) as Promise<LibraryEntry[]>;
}

export function updateLibraryEntryStatus(libraryEntryId: string, readingStatus: ReadingStatus) {
  return window.libraryStore.updateStatus(libraryEntryId, readingStatus) as Promise<LibraryEntry | null>;
}

export function updateLibraryEntryFavorite(libraryEntryId: string, isFavorite: boolean) {
  return window.libraryStore.updateFavorite(libraryEntryId, isFavorite) as Promise<LibraryEntry | null>;
}

export function createLibraryList(input: CreateLibraryCustomListInput) {
  return window.libraryLists.create(input) as Promise<LibraryCustomList>;
}

export function deleteLibraryList(listId: string) {
  return window.libraryLists.delete(listId) as Promise<void>;
}

export function listLibraryLists() {
  return window.libraryLists.list() as Promise<LibraryCustomList[]>;
}

export function addLibraryEntryToList(libraryEntryId: string, listId: string) {
  return window.libraryLists.addEntry(libraryEntryId, listId) as Promise<LibraryEntry | null>;
}

export function removeLibraryEntryFromList(libraryEntryId: string, listId: string) {
  return window.libraryLists.removeEntry(libraryEntryId, listId) as Promise<LibraryEntry | null>;
}

export function refreshLibraryUpdates() {
  return window.libraryStore.refreshUpdates() as Promise<LibraryRefreshSummary>;
}

export function listLibraryUpdates() {
  return window.libraryStore.listUpdates() as Promise<LibraryUpdateItem[]>;
}

export function updateLibraryTotalChapterCount(libraryEntryId: string, totalChapterCount: number) {
  return window.libraryStore.updateTotalChapterCount(libraryEntryId, totalChapterCount) as Promise<void>;
}

export function updateLibraryEntryCover(sourceId: string, sourceTitleId: string, coverUrl: string) {
  return window.libraryStore.updateCover(sourceId, sourceTitleId, coverUrl) as Promise<LibraryEntry | null>;
}
