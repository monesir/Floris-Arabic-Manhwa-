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

export function clearReadingHistory() {
  return window.analyticsStore.clearHistory() as Promise<void>;
}

export function listReadChapterIds(sourceId: string, sourceTitleId: string) {
  return window.analyticsStore.listReadChapterIds(sourceId, sourceTitleId) as Promise<string[]>;
}

export function getAllReadChapterCounts() {
  return window.analyticsStore.getAllReadChapterCounts() as Promise<Record<string, number>>;
}

export function listCompletedChapterIds(sourceId: string, sourceTitleId: string) {
  return window.analyticsStore.listCompletedChapterIds(sourceId, sourceTitleId) as Promise<string[]>;
}

export function getAllCompletedChapterCounts() {
  return window.analyticsStore.getAllCompletedChapterCounts() as Promise<Record<string, number>>;
}
