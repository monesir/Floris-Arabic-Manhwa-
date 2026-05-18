import type {
  ReadingHistoryItem,
  ReadingSessionSummary,
  ReadingTitleAnalytics,
} from "@contracts/analytics";

export function listReadingHistory() {
  return window.analyticsStore.listHistory() as Promise<ReadingHistoryItem[]>;
}

export function listReadingTitleAnalytics() {
  return window.analyticsStore.listTitleAnalytics() as Promise<ReadingTitleAnalytics[]>;
}

export function startReaderSession(input: {
  sourceId: string;
  sourceTitleId: string;
  libraryEntryId?: string | null;
  titleName: string;
  chapterId: string;
  chapterTitle: string;
}) {
  return window.analyticsStore.startReaderSession(input) as Promise<string>;
}

export function endReaderSession(sessionId: string) {
  return window.analyticsStore.endReaderSession(sessionId) as Promise<ReadingSessionSummary | null>;
}
