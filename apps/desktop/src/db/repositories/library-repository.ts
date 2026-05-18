import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  AddLibraryEntryInput,
  LibraryEntry,
  LibraryListQuery,
  ReadingStatus,
} from "@contracts/library";

const SELECT_LIBRARY_ENTRY = `
  SELECT
    library_entry_id AS libraryEntryId,
    source_id AS sourceId,
    source_title_id AS sourceTitleId,
    title_name AS titleName,
    source_title_slug AS sourceTitleSlug,
    cover_url AS coverUrl,
    reading_status AS readingStatus,
    is_favorite AS isFavorite,
    COALESCE(
      (
        SELECT json_group_array(list_id)
        FROM library_custom_list_memberships
        WHERE library_custom_list_memberships.library_entry_id = library_entries.library_entry_id
      ),
      '[]'
    ) AS listIdsJson,
    COALESCE(
      (
        SELECT pending_update_count
        FROM library_entry_updates
        WHERE library_entry_updates.library_entry_id = library_entries.library_entry_id
      ),
      0
    ) AS pendingUpdateCount,
    (
      SELECT detected_latest_chapter_title
      FROM library_entry_updates
      WHERE library_entry_updates.library_entry_id = library_entries.library_entry_id
    ) AS latestDetectedChapterTitle,
    (
      SELECT detected_latest_chapter_id
      FROM library_entry_updates
      WHERE library_entry_updates.library_entry_id = library_entries.library_entry_id
    ) AS latestDetectedChapterId,
    (
      SELECT last_checked_at
      FROM library_entry_updates
      WHERE library_entry_updates.library_entry_id = library_entries.library_entry_id
    ) AS lastUpdateCheckedAt,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM library_entries
`;

function mapEntry(row: {
  libraryEntryId: string;
  sourceId: string;
  sourceTitleId: string;
  titleName: string;
  sourceTitleSlug: string | null;
  coverUrl: string | null;
  readingStatus: ReadingStatus;
  isFavorite: number;
  listIdsJson: string;
  pendingUpdateCount: number;
  latestDetectedChapterTitle: string | null;
  latestDetectedChapterId: string | null;
  lastUpdateCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}): LibraryEntry {
  return {
    ...row,
    isFavorite: Boolean(row.isFavorite),
    listIds: JSON.parse(row.listIdsJson) as string[],
  };
}

export class LibraryRepository {
  constructor(private readonly database: DatabaseSync) {}

  addOrUpdateEntry(input: AddLibraryEntryInput) {
    const existing = this.database
      .prepare(
        `
          ${SELECT_LIBRARY_ENTRY}
          WHERE source_id = @sourceId AND source_title_id = @sourceTitleId
        `,
      )
      .get({
        sourceId: input.sourceId,
        sourceTitleId: input.sourceTitleId,
      }) as ReturnType<typeof mapEntry> | undefined;

    const timestamp = new Date().toISOString();

    if (existing) {
      this.database
        .prepare(
          `
            UPDATE library_entries
            SET
              title_name = @titleName,
              source_title_slug = @sourceTitleSlug,
              cover_url = @coverUrl,
              updated_at = @updatedAt
            WHERE library_entry_id = @libraryEntryId
          `,
        )
        .run({
          libraryEntryId: existing.libraryEntryId,
          titleName: input.titleName,
          sourceTitleSlug: input.sourceTitleSlug,
          coverUrl: input.coverUrl,
          updatedAt: timestamp,
        });

      return this.getById(existing.libraryEntryId);
    }

    const libraryEntryId = randomUUID();

    this.database
      .prepare(
        `
          INSERT INTO library_entries (
            library_entry_id,
            source_id,
            source_title_id,
            title_name,
            source_title_slug,
            cover_url,
            reading_status,
            is_favorite,
            created_at,
            updated_at
          )
          VALUES (
            @libraryEntryId,
            @sourceId,
            @sourceTitleId,
            @titleName,
            @sourceTitleSlug,
            @coverUrl,
            'plan_to_read',
            0,
            @createdAt,
            @updatedAt
          )
        `,
      )
      .run({
        libraryEntryId,
        sourceId: input.sourceId,
        sourceTitleId: input.sourceTitleId,
        titleName: input.titleName,
        sourceTitleSlug: input.sourceTitleSlug,
        coverUrl: input.coverUrl,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

    return this.getById(libraryEntryId);
  }

  getById(libraryEntryId: string) {
    const row = this.database
      .prepare(
        `
          ${SELECT_LIBRARY_ENTRY}
          WHERE library_entry_id = ?
        `,
      )
      .get(libraryEntryId) as Parameters<typeof mapEntry>[0] | undefined;

    return row ? mapEntry(row) : null;
  }

  listAll(query: LibraryListQuery = {}) {
    const whereParts: string[] = [];
    const params: Record<string, string | number> = {};

    if (query.search?.trim()) {
      whereParts.push("(title_name LIKE @search OR source_title_slug LIKE @search)");
      params.search = `%${query.search.trim()}%`;
    }

    if (query.readingStatus && query.readingStatus !== "all") {
      whereParts.push("reading_status = @readingStatus");
      params.readingStatus = query.readingStatus;
    }

    if (query.favoritesOnly) {
      whereParts.push("is_favorite = 1");
    }

    if (query.listId && query.listId !== "all") {
      whereParts.push(
        `EXISTS (
          SELECT 1
          FROM library_custom_list_memberships
          WHERE library_custom_list_memberships.library_entry_id = library_entries.library_entry_id
            AND library_custom_list_memberships.list_id = @listId
        )`,
      );
      params.listId = query.listId;
    }

    const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
    const orderClause =
      query.sort === "title_asc"
        ? "ORDER BY title_name COLLATE NOCASE ASC"
        : query.sort === "title_desc"
          ? "ORDER BY title_name COLLATE NOCASE DESC"
          : query.sort === "created_desc"
            ? "ORDER BY created_at DESC"
            : "ORDER BY updated_at DESC";

    const rows = this.database
      .prepare(
        `
          ${SELECT_LIBRARY_ENTRY}
          ${whereClause}
          ${orderClause}
        `,
      )
      .all(params) as Array<Parameters<typeof mapEntry>[0]>;

    return rows.map(mapEntry);
  }

  updateReadingStatus(libraryEntryId: string, readingStatus: ReadingStatus) {
    const timestamp = new Date().toISOString();

    this.database
      .prepare(
        `
          UPDATE library_entries
          SET
            reading_status = @readingStatus,
            updated_at = @updatedAt
          WHERE library_entry_id = @libraryEntryId
        `,
      )
      .run({
        libraryEntryId,
        readingStatus,
        updatedAt: timestamp,
      });

    return this.getById(libraryEntryId);
  }

  updateFavorite(libraryEntryId: string, isFavorite: boolean) {
    const timestamp = new Date().toISOString();

    this.database
      .prepare(
        `
          UPDATE library_entries
          SET
            is_favorite = @isFavorite,
            updated_at = @updatedAt
          WHERE library_entry_id = @libraryEntryId
        `,
      )
      .run({
        libraryEntryId,
        isFavorite: isFavorite ? 1 : 0,
        updatedAt: timestamp,
      });

    return this.getById(libraryEntryId);
  }

  listForRefresh() {
    const rows = this.database
      .prepare(
        `
          SELECT
            library_entry_id AS libraryEntryId,
            source_id AS sourceId,
            source_title_id AS sourceTitleId,
            title_name AS titleName
          FROM library_entries
          ORDER BY updated_at DESC
        `,
      )
      .all() as Array<{
        libraryEntryId: string;
        sourceId: string;
        sourceTitleId: string;
        titleName: string;
      }>;

    return rows;
  }

  countEntries() {
    const row = this.database
      .prepare("SELECT COUNT(*) AS total FROM library_entries")
      .get();

    return (row as { total: number } | undefined)?.total ?? 0;
  }
}
