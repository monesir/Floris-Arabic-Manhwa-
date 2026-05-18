export type ReadingHistoryItem = {
  historyId: string;
  libraryEntryId: string | null;
  sourceId: string;
  sourceTitleId: string;
  titleName: string;
  chapterId: string;
  chapterTitle: string;
  openedAt: string;
};

export type ReadingSessionSummary = {
  sessionId: string;
  libraryEntryId: string | null;
  sourceId: string;
  sourceTitleId: string;
  titleName: string;
  chapterId: string;
  chapterTitle: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  isActive: boolean;
};

export type ReadingTitleAnalytics = {
  libraryEntryId: string | null;
  sourceId: string;
  sourceTitleId: string;
  titleName: string;
  totalReadingSeconds: number;
  sessionCount: number;
  lastReadAt: string | null;
};
