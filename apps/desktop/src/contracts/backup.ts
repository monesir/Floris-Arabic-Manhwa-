export interface TachiyomiBackupCategory {
  name: string;
  order: number;
}

export interface TachiyomiBackupManga {
  title: string;
  url: string;
  sourceId: string;
  readChapterCount: number;
  readChapterNumbers: number[];
  categoryIds: number[];
}

export interface TachiyomiBackupResult {
  manga: TachiyomiBackupManga[];
  categories: TachiyomiBackupCategory[];
}
