import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  CreateLibraryCustomListInput,
  LibraryCustomList,
} from "@contracts/library";

function mapList(row: {
  listId: string;
  name: string;
  entryCount: number | null;
  createdAt: string;
  updatedAt: string;
}): LibraryCustomList {
  return {
    listId: row.listId,
    name: row.name,
    entryCount: row.entryCount ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class LibraryCustomListRepository {
  constructor(private readonly database: DatabaseSync) {}

  create(input: CreateLibraryCustomListInput) {
    const timestamp = new Date().toISOString();
    const listId = randomUUID();

    this.database
      .prepare(
        `
          INSERT INTO library_custom_lists (
            list_id,
            name,
            created_at,
            updated_at
          )
          VALUES (@listId, @name, @createdAt, @updatedAt)
        `,
      )
      .run({
        listId,
        name: input.name.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      });

    return this.getById(listId);
  }

  delete(listId: string) {
    this.database.prepare(`DELETE FROM library_custom_lists WHERE list_id = ?`).run(listId);
  }

  getById(listId: string) {
    const row = this.database
      .prepare(
        `
          SELECT
            library_custom_lists.list_id AS listId,
            library_custom_lists.name AS name,
            COUNT(library_custom_list_memberships.library_entry_id) AS entryCount,
            library_custom_lists.created_at AS createdAt,
            library_custom_lists.updated_at AS updatedAt
          FROM library_custom_lists
          LEFT JOIN library_custom_list_memberships
            ON library_custom_list_memberships.list_id = library_custom_lists.list_id
          WHERE library_custom_lists.list_id = ?
          GROUP BY library_custom_lists.list_id
        `,
      )
      .get(listId) as Parameters<typeof mapList>[0] | undefined;

    return row ? mapList(row) : null;
  }

  listAll() {
    const rows = this.database
      .prepare(
        `
          SELECT
            library_custom_lists.list_id AS listId,
            library_custom_lists.name AS name,
            COUNT(library_custom_list_memberships.library_entry_id) AS entryCount,
            library_custom_lists.created_at AS createdAt,
            library_custom_lists.updated_at AS updatedAt
          FROM library_custom_lists
          LEFT JOIN library_custom_list_memberships
            ON library_custom_list_memberships.list_id = library_custom_lists.list_id
          GROUP BY library_custom_lists.list_id
          ORDER BY library_custom_lists.updated_at DESC, library_custom_lists.name COLLATE NOCASE ASC
        `,
      )
      .all() as Array<Parameters<typeof mapList>[0]>;

    return rows.map(mapList);
  }

  addEntryMembership(listId: string, libraryEntryId: string) {
    const timestamp = new Date().toISOString();

    this.database
      .prepare(
        `
          INSERT INTO library_custom_list_memberships (
            list_id,
            library_entry_id,
            created_at
          )
          VALUES (@listId, @libraryEntryId, @createdAt)
          ON CONFLICT(list_id, library_entry_id) DO NOTHING
        `,
      )
      .run({
        listId,
        libraryEntryId,
        createdAt: timestamp,
      });

    this.touchList(listId, timestamp);
  }

  removeEntryMembership(listId: string, libraryEntryId: string) {
    this.database
      .prepare(
        `
          DELETE FROM library_custom_list_memberships
          WHERE list_id = @listId AND library_entry_id = @libraryEntryId
        `,
      )
      .run({
        listId,
        libraryEntryId,
      });

    this.touchList(listId, new Date().toISOString());
  }

  private touchList(listId: string, updatedAt: string) {
    this.database
      .prepare(
        `
          UPDATE library_custom_lists
          SET updated_at = @updatedAt
          WHERE list_id = @listId
        `,
      )
      .run({
        listId,
        updatedAt,
      });
  }
}
