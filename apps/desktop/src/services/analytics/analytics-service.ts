import { getDatabase } from "@db/database";
import { AnalyticsRepository } from "@db/repositories/analytics-repository";

export function listReadingHistory() {
  return new AnalyticsRepository(getDatabase()).listHistory();
}

export function listReadingTitleAnalytics() {
  return new AnalyticsRepository(getDatabase()).listTitleAnalytics();
}
