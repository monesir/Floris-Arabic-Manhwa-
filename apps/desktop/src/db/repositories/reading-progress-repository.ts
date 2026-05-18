import type { DatabaseSync } from "node:sqlite";
import type { ReadingProgressSnapshot } from "@contracts/reader";

type ReadingProgressRow = {
  sourceId: string;
  sourceTitleId: string;
  libraryEntryId: string | null;
  lastReadChapterId: string | null;
  lastReadPageIndex: number;
  lastReadScrollProgress: number;
  updatedAt: string;
};

function mapProgress(row: ReadingProgressRow): ReadingProgressSnapshot {
  return {
    ...row,
  };
}

export class ReadingProgressRepository {
  constructor(private readonly database: DatabaseSync) {}

  getBySourceTitle(sourceId: string, sourceTitleId: string) {
    const row = this.database
      .prepare(
        `
          SELECT
            source_id AS sourceId,
            source_title_id AS sourceTitleId,
            library_entry_id AS libraryEntryId,
            last_read_chapter_id AS lastReadChapterId,
            last_read_page_index AS lastReadPageIndex,
            last_read_scroll_progress AS lastReadScrollProgress,
            updated_at AS updatedAt
          FROM reading_progress
          WHERE source_id = ? AND source_title_id = ?
        `,
      )
      .get(sourceId, sourceTitleId) as ReadingProgressRow | undefined;

    return row ? mapProgress(row) : null;
  }

  upsert(progress: ReadingProgressSnapshot) {
    this.database
      .prepare(
        `
          INSERT INTO reading_progress (
            source_id,
            source_title_id,
            library_entry_id,
            last_read_chapter_id,
            last_read_page_index,
            last_read_scroll_progress,
            updated_at
          )
          VALUES (
            @sourceId,
            @sourceTitleId,
            @libraryEntryId,
            @lastReadChapterId,
            @lastReadPageIndex,
            @lastReadScrollProgress,
            @updatedAt
          )
          ON CONFLICT(source_id, source_title_id) DO UPDATE SET
            library_entry_id = excluded.library_entry_id,
            last_read_chapter_id = excluded.last_read_chapter_id,
            last_read_page_index = excluded.last_read_page_index,
            last_read_scroll_progress = excluded.last_read_scroll_progress,
            updated_at = excluded.updated_at
        `,
      )
      .run(progress);

    return this.getBySourceTitle(progress.sourceId, progress.sourceTitleId);
  }
}
