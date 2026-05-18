import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import type { AddLibraryEntryInput, LibraryEntry } from "@contracts/library";

export class LibraryRepository {
  constructor(private readonly database: DatabaseSync) {}

  addOrUpdateEntry(input: AddLibraryEntryInput) {
    const existing = this.database
      .prepare(
        `
          SELECT
            library_entry_id AS libraryEntryId,
            source_id AS sourceId,
            source_title_id AS sourceTitleId,
            title_name AS titleName,
            source_title_slug AS sourceTitleSlug,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM library_entries
          WHERE source_id = @sourceId AND source_title_id = @sourceTitleId
        `,
      )
      .get({
        sourceId: input.sourceId,
        sourceTitleId: input.sourceTitleId,
      }) as LibraryEntry | undefined;

    const timestamp = new Date().toISOString();

    if (existing) {
      this.database
        .prepare(
          `
            UPDATE library_entries
            SET
              title_name = @titleName,
              source_title_slug = @sourceTitleSlug,
              updated_at = @updatedAt
            WHERE library_entry_id = @libraryEntryId
          `,
        )
        .run({
          libraryEntryId: existing.libraryEntryId,
          titleName: input.titleName,
          sourceTitleSlug: input.sourceTitleSlug,
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
            created_at,
            updated_at
          )
          VALUES (
            @libraryEntryId,
            @sourceId,
            @sourceTitleId,
            @titleName,
            @sourceTitleSlug,
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
        createdAt: timestamp,
        updatedAt: timestamp,
      });

    return this.getById(libraryEntryId);
  }

  getById(libraryEntryId: string) {
    const row = this.database
      .prepare(
        `
          SELECT
            library_entry_id AS libraryEntryId,
            source_id AS sourceId,
            source_title_id AS sourceTitleId,
            title_name AS titleName,
            source_title_slug AS sourceTitleSlug,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM library_entries
          WHERE library_entry_id = ?
        `,
      )
      .get(libraryEntryId);

    return row as LibraryEntry | null;
  }

  listAll() {
    const rows = this.database
      .prepare(
        `
          SELECT
            library_entry_id AS libraryEntryId,
            source_id AS sourceId,
            source_title_id AS sourceTitleId,
            title_name AS titleName,
            source_title_slug AS sourceTitleSlug,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM library_entries
          ORDER BY updated_at DESC, created_at DESC
        `,
      )
      .all();

    return rows as LibraryEntry[];
  }

  countEntries() {
    const row = this.database
      .prepare("SELECT COUNT(*) AS total FROM library_entries")
      .get();

    return (row as { total: number } | undefined)?.total ?? 0;
  }
}
