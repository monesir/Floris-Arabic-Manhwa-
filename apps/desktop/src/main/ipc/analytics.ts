import { ipcMain } from "electron";
import type { ReadingHistoryItem, ReadingTitleAnalytics, ReadingSessionSummary } from "@contracts/analytics";
import { listReadingHistory, listReadingTitleAnalytics } from "@services/analytics/analytics-service";
import { endReadingSession, startReadingSession } from "@services/reader/reader-service";

const LIST_READING_HISTORY_CHANNEL = "analytics:list-history";
const LIST_READING_TITLE_ANALYTICS_CHANNEL = "analytics:list-title-analytics";
const START_READING_SESSION_CHANNEL = "reader:start-session";
const END_READING_SESSION_CHANNEL = "reader:end-session";

export function registerAnalyticsIpc() {
  ipcMain.handle(
    LIST_READING_HISTORY_CHANNEL,
    (): ReadingHistoryItem[] => listReadingHistory(),
  );
  ipcMain.handle(
    LIST_READING_TITLE_ANALYTICS_CHANNEL,
    (): ReadingTitleAnalytics[] => listReadingTitleAnalytics(),
  );
  ipcMain.handle(
    START_READING_SESSION_CHANNEL,
    (
      _,
      input: {
        sourceId: string;
        sourceTitleId: string;
        libraryEntryId?: string | null;
        titleName: string;
        chapterId: string;
        chapterTitle: string;
      },
    ): string => startReadingSession(input),
  );
  ipcMain.handle(
    END_READING_SESSION_CHANNEL,
    (_, sessionId: string): ReadingSessionSummary | null => endReadingSession(sessionId),
  );
}
