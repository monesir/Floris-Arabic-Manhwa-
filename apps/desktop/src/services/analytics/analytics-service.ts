import { getDatabase } from "@db/database";
import { AnalyticsRepository } from "@db/repositories/analytics-repository";

export function listReadingHistory() {
  return new AnalyticsRepository(getDatabase()).listHistory();
}

export function listReadingTitleAnalytics() {
  return new AnalyticsRepository(getDatabase()).listTitleAnalytics();
}

export function clearAllReadingHistory() {
  return new AnalyticsRepository(getDatabase()).clearAllHistory();
}

export function listReadChapterIds(sourceId: string, sourceTitleId: string) {
  return new AnalyticsRepository(getDatabase()).listReadChapterIds(sourceId, sourceTitleId);
}

export function getAllReadChapterCounts() {
  return new AnalyticsRepository(getDatabase()).getAllReadChapterCounts();
}

export function listCompletedChapterIds(sourceId: string, sourceTitleId: string) {
  return new AnalyticsRepository(getDatabase()).listCompletedChapterIds(sourceId, sourceTitleId);
}

export function getAllCompletedChapterCounts() {
  return new AnalyticsRepository(getDatabase()).getAllCompletedChapterCounts();
}

export function markChapterCompleted(input: {
  sourceId: string;
  sourceTitleId: string;
  chapterId: string;
  libraryEntryId: string | null;
  completedAt: string;
}) {
  return new AnalyticsRepository(getDatabase()).markChapterCompleted(input);
}
