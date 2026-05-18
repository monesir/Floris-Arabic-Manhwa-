import type { DatabaseSync } from "node:sqlite";

export class LibraryRepository {
  constructor(private readonly database: DatabaseSync) {}

  countEntries() {
    const row = this.database
      .prepare("SELECT COUNT(*) AS total FROM library_entries")
      .get();

    return (row as { total: number } | undefined)?.total ?? 0;
  }
}
