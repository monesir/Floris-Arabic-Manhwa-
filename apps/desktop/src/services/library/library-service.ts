import type {
  AddLibraryEntryInput,
  LibraryListQuery,
  ReadingStatus,
} from "@contracts/library";
import { getDatabase } from "@db/database";
import { LibraryRepository } from "@db/repositories/library-repository";

export function addToLibrary(input: AddLibraryEntryInput) {
  const repository = new LibraryRepository(getDatabase());
  return repository.addOrUpdateEntry(input);
}

export function listLibraryEntries(query?: LibraryListQuery) {
  const repository = new LibraryRepository(getDatabase());
  return repository.listAll(query);
}

export function setLibraryReadingStatus(libraryEntryId: string, readingStatus: ReadingStatus) {
  const repository = new LibraryRepository(getDatabase());
  return repository.updateReadingStatus(libraryEntryId, readingStatus);
}

export function setLibraryFavorite(libraryEntryId: string, isFavorite: boolean) {
  const repository = new LibraryRepository(getDatabase());
  return repository.updateFavorite(libraryEntryId, isFavorite);
}
