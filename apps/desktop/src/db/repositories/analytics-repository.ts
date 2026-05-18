import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  ReadingHistoryItem,
  ReadingSessionSummary,
  ReadingTitleAnalytics,
} from "@contracts/analytics";

export class AnalyticsRepository {
  constructor(private readonly database: DatabaseSync) {}

  closeActiveSessionsAtStartup() {
    this.database
      .prepare(
        `
          UPDATE reading_sessions
          SET
            ended_at = started_at,
            duration_seconds = 0,
            is_active = 0
          WHERE is_active = 1
        `,
      )
      .run();
  }

  logHistory(input: Omit<ReadingHistoryItem, "historyId" | "openedAt">) {
    const historyId = randomUUID();
    const openedAt = new Date().toISOString();

    this.database
      .prepare(
        `
          INSERT INTO reading_history (
            history_id,
            library_entry_id,
            source_id,
            source_title_id,
            title_name,
            chapter_id,
            chapter_title,
            opened_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        historyId,
        input.libraryEntryId,
        input.sourceId,
        input.sourceTitleId,
        input.titleName,
        input.chapterId,
        input.chapterTitle,
        openedAt,
      );

    return historyId;
  }

  startSession(input: Omit<ReadingSessionSummary, "sessionId" | "startedAt" | "endedAt" | "durationSeconds" | "isActive">) {
    const sessionId = randomUUID();
    const startedAt = new Date().toISOString();

    this.database
      .prepare(
        `
          INSERT INTO reading_sessions (
            session_id,
            library_entry_id,
            source_id,
            source_title_id,
            title_name,
            chapter_id,
            chapter_title,
            started_at,
            ended_at,
            duration_seconds,
            is_active
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, 1)
        `,
      )
      .run(
        sessionId,
        input.libraryEntryId,
        input.sourceId,
        input.sourceTitleId,
        input.titleName,
        input.chapterId,
        input.chapterTitle,
        startedAt,
      );

    return sessionId;
  }

  endSession(sessionId: string) {
    const row = this.database
      .prepare(
        `
          SELECT session_id AS sessionId, started_at AS startedAt, is_active AS isActive
          FROM reading_sessions
          WHERE session_id = ?
        `,
      )
      .get(sessionId) as { sessionId: string; startedAt: string; isActive: number } | undefined;

    if (!row || !row.isActive) {
      return null;
    }

    const endedAt = new Date().toISOString();
    const durationSeconds = Math.max(
      0,
      Math.round((Date.parse(endedAt) - Date.parse(row.startedAt)) / 1000),
    );

    this.database
      .prepare(
        `
          UPDATE reading_sessions
          SET
            ended_at = ?,
            duration_seconds = ?,
            is_active = 0
          WHERE session_id = ?
        `,
      )
      .run(endedAt, durationSeconds, sessionId);

    return this.getSession(sessionId);
  }

  getSession(sessionId: string) {
    const row = this.database
      .prepare(
        `
          SELECT
            session_id AS sessionId,
            library_entry_id AS libraryEntryId,
            source_id AS sourceId,
            source_title_id AS sourceTitleId,
            title_name AS titleName,
            chapter_id AS chapterId,
            chapter_title AS chapterTitle,
            started_at AS startedAt,
            ended_at AS endedAt,
            duration_seconds AS durationSeconds,
            is_active AS isActive
          FROM reading_sessions
          WHERE session_id = ?
        `,
      )
      .get(sessionId) as Omit<ReadingSessionSummary, "isActive"> & { isActive: number } | undefined;

    return row
      ? {
          ...row,
          isActive: Boolean(row.isActive),
        }
      : null;
  }

  listHistory(limit = 30) {
    const rows = this.database
      .prepare(
        `
          SELECT
            history_id AS historyId,
            library_entry_id AS libraryEntryId,
            source_id AS sourceId,
            source_title_id AS sourceTitleId,
            title_name AS titleName,
            chapter_id AS chapterId,
            chapter_title AS chapterTitle,
            opened_at AS openedAt
          FROM reading_history
          ORDER BY opened_at DESC
          LIMIT ?
        `,
      )
      .all(limit) as ReadingHistoryItem[];

    return rows;
  }

  listTitleAnalytics() {
    const rows = this.database
      .prepare(
        `
          SELECT
            library_entry_id AS libraryEntryId,
            source_id AS sourceId,
            source_title_id AS sourceTitleId,
            title_name AS titleName,
            COALESCE(SUM(duration_seconds), 0) AS totalReadingSeconds,
            COUNT(*) AS sessionCount,
            MAX(COALESCE(ended_at, started_at)) AS lastReadAt
          FROM reading_sessions
          GROUP BY library_entry_id, source_id, source_title_id, title_name
          ORDER BY totalReadingSeconds DESC, lastReadAt DESC
        `,
      )
      .all() as ReadingTitleAnalytics[];

    return rows;
  }
}
