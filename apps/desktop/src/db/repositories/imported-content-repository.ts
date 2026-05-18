import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

export type ImportedTitleRecord = {
  importedTitleId: string;
  titleName: string;
  titleSlug: string | null;
  description: string | null;
  coverPath: string | null;
  sourcePath: string;
  importType: "folder" | "cbz" | "pdf";
  createdAt: string;
  updatedAt: string;
};

export type ImportedChapterRecord = {
  importedChapterId: string;
  importedTitleId: string;
  chapterTitle: string;
  chapterNumber: number | null;
  sourcePath: string;
  availability: "readable" | "locked" | "unavailable";
  createdAt: string;
  updatedAt: string;
};

export type ImportedPageRecord = {
  importedPageId: string;
  importedChapterId: string;
  pageIndex: number;
  assetPath: string;
  createdAt: string;
};

export class ImportedContentRepository {
  constructor(private readonly database: DatabaseSync) {}

  createTitle(input: Omit<ImportedTitleRecord, "importedTitleId" | "createdAt" | "updatedAt">) {
    const importedTitleId = randomUUID();
    const now = new Date().toISOString();

    this.database
      .prepare(
        `
          INSERT INTO imported_titles (
            imported_title_id,
            title_name,
            title_slug,
            description,
            cover_path,
            source_path,
            import_type,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        importedTitleId,
        input.titleName,
        input.titleSlug,
        input.description,
        input.coverPath,
        input.sourcePath,
        input.importType,
        now,
        now,
      );

    return importedTitleId;
  }

  createChapter(input: Omit<ImportedChapterRecord, "importedChapterId" | "createdAt" | "updatedAt">) {
    const importedChapterId = randomUUID();
    const now = new Date().toISOString();

    this.database
      .prepare(
        `
          INSERT INTO imported_chapters (
            imported_chapter_id,
            imported_title_id,
            chapter_title,
            chapter_number,
            source_path,
            availability,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        importedChapterId,
        input.importedTitleId,
        input.chapterTitle,
        input.chapterNumber,
        input.sourcePath,
        input.availability,
        now,
        now,
      );

    return importedChapterId;
  }

  createPage(input: Omit<ImportedPageRecord, "importedPageId" | "createdAt">) {
    const importedPageId = randomUUID();
    const now = new Date().toISOString();

    this.database
      .prepare(
        `
          INSERT INTO imported_pages (
            imported_page_id,
            imported_chapter_id,
            page_index,
            asset_path,
            created_at
          )
          VALUES (?, ?, ?, ?, ?)
        `,
      )
      .run(
        importedPageId,
        input.importedChapterId,
        input.pageIndex,
        input.assetPath,
        now,
      );

    return importedPageId;
  }

  listTitles() {
    return this.database
      .prepare(
        `
          SELECT
            imported_title_id AS importedTitleId,
            title_name AS titleName,
            title_slug AS titleSlug,
            description,
            cover_path AS coverPath,
            source_path AS sourcePath,
            import_type AS importType,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM imported_titles
          ORDER BY updated_at DESC
        `,
      )
      .all() as ImportedTitleRecord[];
  }

  searchTitles(query: string) {
    return this.database
      .prepare(
        `
          SELECT
            imported_title_id AS importedTitleId,
            title_name AS titleName,
            title_slug AS titleSlug,
            description,
            cover_path AS coverPath,
            source_path AS sourcePath,
            import_type AS importType,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM imported_titles
          WHERE title_name LIKE @query OR COALESCE(title_slug, '') LIKE @query
          ORDER BY updated_at DESC
        `,
      )
      .all({ query: `%${query}%` }) as ImportedTitleRecord[];
  }

  getTitle(importedTitleId: string) {
    const row = this.database
      .prepare(
        `
          SELECT
            imported_title_id AS importedTitleId,
            title_name AS titleName,
            title_slug AS titleSlug,
            description,
            cover_path AS coverPath,
            source_path AS sourcePath,
            import_type AS importType,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM imported_titles
          WHERE imported_title_id = ?
        `,
      )
      .get(importedTitleId) as ImportedTitleRecord | undefined;

    return row ?? null;
  }

  listChapters(importedTitleId: string) {
    return this.database
      .prepare(
        `
          SELECT
            imported_chapter_id AS importedChapterId,
            imported_title_id AS importedTitleId,
            chapter_title AS chapterTitle,
            chapter_number AS chapterNumber,
            source_path AS sourcePath,
            availability,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM imported_chapters
          WHERE imported_title_id = ?
          ORDER BY COALESCE(chapter_number, 0) DESC, chapter_title COLLATE NOCASE DESC
        `,
      )
      .all(importedTitleId) as ImportedChapterRecord[];
  }

  listPages(importedChapterId: string) {
    return this.database
      .prepare(
        `
          SELECT
            imported_page_id AS importedPageId,
            imported_chapter_id AS importedChapterId,
            page_index AS pageIndex,
            asset_path AS assetPath,
            created_at AS createdAt
          FROM imported_pages
          WHERE imported_chapter_id = ?
          ORDER BY page_index ASC
        `,
      )
      .all(importedChapterId) as ImportedPageRecord[];
  }
}
