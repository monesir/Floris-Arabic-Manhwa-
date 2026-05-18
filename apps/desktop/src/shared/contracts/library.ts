export type ReadingStatus =
  | "reading"
  | "completed"
  | "on_hold"
  | "dropped"
  | "plan_to_read";

export type LibraryEntry = {
  libraryEntryId: string;
  sourceId: string;
  sourceTitleId: string;
  titleName: string;
  sourceTitleSlug: string | null;
  coverUrl: string | null;
  readingStatus: ReadingStatus;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AddLibraryEntryInput = {
  sourceId: string;
  sourceTitleId: string;
  titleName: string;
  sourceTitleSlug: string | null;
  coverUrl: string | null;
};

export type LibraryListQuery = {
  search?: string;
  readingStatus?: ReadingStatus | "all";
  favoritesOnly?: boolean;
  sort?: "updated_desc" | "created_desc" | "title_asc" | "title_desc";
};
