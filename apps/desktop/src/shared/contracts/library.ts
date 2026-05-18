export type LibraryEntry = {
  libraryEntryId: string;
  sourceId: string;
  sourceTitleId: string;
  titleName: string;
  sourceTitleSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AddLibraryEntryInput = {
  sourceId: string;
  sourceTitleId: string;
  titleName: string;
  sourceTitleSlug: string | null;
};
