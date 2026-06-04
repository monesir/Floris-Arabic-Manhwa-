import { ipcMain } from "electron";
import type { ReadingHistoryItem, ReadingTitleAnalytics, ReadingSessionSummary } from "@contracts/analytics";
import {
  listReadingHistory,
  listReadingTitleAnalytics,
  clearAllReadingHistory,
  listReadChapterIds,
  getAllReadChapterCounts,
  listCompletedChapterIds,
  getAllCompletedChapterCounts,
  markChapterCompleted,
} from "@services/analytics/analytics-service";
import { endReadingSession, startReadingSession } from "@services/reader/reader-service";

const LIST_READING_HISTORY_CHANNEL = "analytics:list-history";
const LIST_READING_TITLE_ANALYTICS_CHANNEL = "analytics:list-title-analytics";
const START_READING_SESSION_CHANNEL = "reader:start-session";
const END_READING_SESSION_CHANNEL = "reader:end-session";
const CLEAR_HISTORY_CHANNEL = "analytics:clear-history";
const LIST_READ_CHAPTERS_CHANNEL = "analytics:list-read-chapters";
const ALL_READ_CHAPTER_COUNTS_CHANNEL = "analytics:all-read-counts";
const LIST_COMPLETED_CHAPTERS_CHANNEL = "analytics:list-completed-chapters";
const ALL_COMPLETED_CHAPTER_COUNTS_CHANNEL = "analytics:all-completed-counts";
const MARK_CHAPTER_COMPLETED_CHANNEL = "analytics:mark-chapter-completed";

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
  ipcMain.handle(
    CLEAR_HISTORY_CHANNEL,
    (): void => clearAllReadingHistory(),
  );
  ipcMain.handle(
    LIST_READ_CHAPTERS_CHANNEL,
    (_, sourceId: string, sourceTitleId: string): string[] => listReadChapterIds(sourceId, sourceTitleId),
  );
  ipcMain.handle(
    ALL_READ_CHAPTER_COUNTS_CHANNEL,
    (): Record<string, number> => getAllReadChapterCounts(),
  );
  ipcMain.handle(
    LIST_COMPLETED_CHAPTERS_CHANNEL,
    (_, sourceId: string, sourceTitleId: string): string[] =>
      listCompletedChapterIds(sourceId, sourceTitleId),
  );
  ipcMain.handle(
    ALL_COMPLETED_CHAPTER_COUNTS_CHANNEL,
    (): Record<string, number> => getAllCompletedChapterCounts(),
  );
  ipcMain.handle(
    MARK_CHAPTER_COMPLETED_CHANNEL,
    (_, input: {
      sourceId: string;
      sourceTitleId: string;
      chapterId: string;
      libraryEntryId: string | null;
      completedAt: string;
    }): void => markChapterCompleted(input),
  );
}
