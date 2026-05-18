import type {
  AddLibraryEntryInput,
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
