import type { DatabaseSync } from "node:sqlite";
import type { LibraryUpdateItem } from "@contracts/library";

type PersistLibraryUpdateInput = {
  libraryEntryId: string;
  knownLatestChapterId: string | null;
  knownLatestChapterNumber: number | null;
  knownLatestChapterTitle: string | null;
  detectedLatestChapterId: string | null;
  detectedLatestChapterTitle: string | null;
  detectedLatestChapterReleaseDate: string | null;
  pendingUpdateCount: number;
  lastCheckedAt: string;
  lastDetectedAt: string | null;
};

function mapUpdate(row: {
  libraryEntryId: string;
  titleName: string;
  coverUrl: string | null;
  sourceId: string;
  sourceTitleId: string;
  pendingUpdateCount: number;
  latestDetectedChapterId: string | null;
  latestDetectedChapterTitle: string | null;
  latestDetectedChapterReleaseDate: string | null;
  lastUpdateCheckedAt: string | null;
}): LibraryUpdateItem {
  return {
    libraryEntryId: row.libraryEntryId,
    titleName: row.titleName,
    coverUrl: row.coverUrl,
    sourceId: row.sourceId,
    sourceTitleId: row.sourceTitleId,
    pendingUpdateCount: row.pendingUpdateCount,
    latestDetectedChapterId: row.latestDetectedChapterId,
    latestDetectedChapterTitle: row.latestDetectedChapterTitle,
    latestDetectedChapterReleaseDate: row.latestDetectedChapterReleaseDate,
    lastUpdateCheckedAt: row.lastUpdateCheckedAt,
  };
}

export class LibraryUpdateRepository {
  constructor(private readonly database: DatabaseSync) {}

  getByLibraryEntryId(libraryEntryId: string) {
    const row = this.database
      .prepare(
        `
          SELECT
            library_entry_id AS libraryEntryId,
            known_latest_chapter_id AS knownLatestChapterId,
            known_latest_chapter_number AS knownLatestChapterNumber,
            known_latest_chapter_title AS knownLatestChapterTitle,
            detected_latest_chapter_id AS detectedLatestChapterId,
            detected_latest_chapter_title AS detectedLatestChapterTitle,
            detected_latest_chapter_release_date AS detectedLatestChapterReleaseDate,
            pending_update_count AS pendingUpdateCount,
            last_checked_at AS lastCheckedAt,
            last_detected_at AS lastDetectedAt
          FROM library_entry_updates
          WHERE library_entry_id = ?
        `,
      )
      .get(libraryEntryId) as PersistLibraryUpdateInput | undefined;

    return row ?? null;
  }

  upsert(input: PersistLibraryUpdateInput) {
    this.database
      .prepare(
        `
          INSERT INTO library_entry_updates (
            library_entry_id,
            known_latest_chapter_id,
            known_latest_chapter_number,
            known_latest_chapter_title,
            detected_latest_chapter_id,
            detected_latest_chapter_title,
            detected_latest_chapter_release_date,
            pending_update_count,
            last_checked_at,
            last_detected_at
          )
          VALUES (
            @libraryEntryId,
            @knownLatestChapterId,
            @knownLatestChapterNumber,
            @knownLatestChapterTitle,
            @detectedLatestChapterId,
            @detectedLatestChapterTitle,
            @detectedLatestChapterReleaseDate,
            @pendingUpdateCount,
            @lastCheckedAt,
            @lastDetectedAt
          )
          ON CONFLICT(library_entry_id) DO UPDATE SET
            known_latest_chapter_id = excluded.known_latest_chapter_id,
            known_latest_chapter_number = excluded.known_latest_chapter_number,
            known_latest_chapter_title = excluded.known_latest_chapter_title,
            detected_latest_chapter_id = excluded.detected_latest_chapter_id,
            detected_latest_chapter_title = excluded.detected_latest_chapter_title,
            detected_latest_chapter_release_date = excluded.detected_latest_chapter_release_date,
            pending_update_count = excluded.pending_update_count,
            last_checked_at = excluded.last_checked_at,
            last_detected_at = excluded.last_detected_at
        `,
      )
      .run(input);
  }

  listPendingUpdates() {
    const rows = this.database
      .prepare(
        `
          SELECT
            library_entries.library_entry_id AS libraryEntryId,
            library_entries.title_name AS titleName,
            library_entries.cover_url AS coverUrl,
            library_entries.source_id AS sourceId,
            library_entries.source_title_id AS sourceTitleId,
            library_entry_updates.pending_update_count AS pendingUpdateCount,
            library_entry_updates.detected_latest_chapter_id AS latestDetectedChapterId,
            library_entry_updates.detected_latest_chapter_title AS latestDetectedChapterTitle,
            library_entry_updates.detected_latest_chapter_release_date AS latestDetectedChapterReleaseDate,
            library_entry_updates.last_checked_at AS lastUpdateCheckedAt
          FROM library_entry_updates
          INNER JOIN library_entries
            ON library_entries.library_entry_id = library_entry_updates.library_entry_id
          WHERE library_entry_updates.pending_update_count > 0
          ORDER BY library_entry_updates.last_detected_at DESC, library_entries.updated_at DESC
        `,
      )
      .all() as Array<Parameters<typeof mapUpdate>[0]>;

    return rows.map(mapUpdate);
  }
}
