import type { AddLibraryEntryInput } from "@contracts/library";
import { getDatabase } from "@db/database";
import { LibraryRepository } from "@db/repositories/library-repository";

export function addToLibrary(input: AddLibraryEntryInput) {
  const repository = new LibraryRepository(getDatabase());
  return repository.addOrUpdateEntry(input);
}

export function listLibraryEntries() {
  const repository = new LibraryRepository(getDatabase());
  return repository.listAll();
}
