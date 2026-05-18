import type {
  AddLibraryEntryInput,
  CreateLibraryCustomListInput,
  LibraryListQuery,
  ReadingStatus,
} from "@contracts/library";
import { getDatabase } from "@db/database";
import { LibraryCustomListRepository } from "@db/repositories/library-custom-list-repository";
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

export function createLibraryCustomList(input: CreateLibraryCustomListInput) {
  const repository = new LibraryCustomListRepository(getDatabase());
  return repository.create(input);
}

export function listLibraryCustomLists() {
  const repository = new LibraryCustomListRepository(getDatabase());
  return repository.listAll();
}

export function addLibraryEntryToCustomList(libraryEntryId: string, listId: string) {
  const repository = new LibraryCustomListRepository(getDatabase());
  repository.addEntryMembership(listId, libraryEntryId);

  const libraryRepository = new LibraryRepository(getDatabase());
  return libraryRepository.getById(libraryEntryId);
}

export function removeLibraryEntryFromCustomList(libraryEntryId: string, listId: string) {
  const repository = new LibraryCustomListRepository(getDatabase());
  repository.removeEntryMembership(listId, libraryEntryId);

  const libraryRepository = new LibraryRepository(getDatabase());
  return libraryRepository.getById(libraryEntryId);
}
