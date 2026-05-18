import type {
  AddLibraryEntryInput,
  CreateLibraryCustomListInput,
  LibraryCustomList,
  LibraryEntry,
  LibraryListQuery,
  ReadingStatus,
} from "@contracts/library";

export function addLibraryEntry(input: AddLibraryEntryInput) {
  return window.libraryStore.add(input) as Promise<LibraryEntry>;
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

export function listLibraryLists() {
  return window.libraryLists.list() as Promise<LibraryCustomList[]>;
}

export function addLibraryEntryToList(libraryEntryId: string, listId: string) {
  return window.libraryLists.addEntry(libraryEntryId, listId) as Promise<LibraryEntry | null>;
}

export function removeLibraryEntryFromList(libraryEntryId: string, listId: string) {
  return window.libraryLists.removeEntry(libraryEntryId, listId) as Promise<LibraryEntry | null>;
}
