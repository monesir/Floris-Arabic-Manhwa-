import type { AddLibraryEntryInput, LibraryEntry } from "@contracts/library";

export function addLibraryEntry(input: AddLibraryEntryInput) {
  return window.libraryStore.add(input) as Promise<LibraryEntry>;
}

export function listLibraryEntries() {
  return window.libraryStore.list() as Promise<LibraryEntry[]>;
}
