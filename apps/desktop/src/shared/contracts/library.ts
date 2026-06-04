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
  listIds: string[];
  pendingUpdateCount: number;
  totalChapterCount: number;
  latestDetectedChapterTitle: string | null;
  latestDetectedChapterId: string | null;
  lastUpdateCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LibraryCustomList = {
  listId: string;
  name: string;
  entryCount: number;
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
  listId?: string | "all";
  sort?: "updated_desc" | "created_desc" | "title_asc" | "title_desc";
};

export type CreateLibraryCustomListInput = {
  name: string;
};

export type LibraryUpdateItem = {
  libraryEntryId: string;
  titleName: string;
  coverUrl: string | null;
  sourceId: string;
  sourceTitleId: string;
  pendingUpdateCount: number;
  latestDetectedChapterId: string | null;
  latestDetectedChapterTitle: string | null;
  latestDetectedChapterReleaseDate: string | null;
  lastUpdateCheckedAt: string | null;
};

export type LibraryRefreshSummary = {
  checkedCount: number;
  updatedCount: number;
  updates: LibraryUpdateItem[];
};
