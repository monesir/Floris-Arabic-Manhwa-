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
