import type { LibraryEntry } from "@contracts/library";

export type ImportKind = "folder" | "cbz" | "pdf";

export type ImportResult = {
  libraryEntry: LibraryEntry;
  importedTitleId: string;
  importKind: ImportKind;
};
