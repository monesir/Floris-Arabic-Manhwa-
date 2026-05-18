import { z } from "zod";

export const readerModeSchema = z.enum(["vertical", "horizontal", "rtl", "webtoon"]);
export type ReaderMode = z.infer<typeof readerModeSchema>;

export const readerFitModeSchema = z.enum(["fit-width", "fit-height", "free"]);
export type ReaderFitMode = z.infer<typeof readerFitModeSchema>;

export const readerPreferencesSchema = z.object({
  mode: readerModeSchema,
  fitMode: readerFitModeSchema,
  zoomPercent: z.number().int().min(50).max(250),
});

export type ReaderPreferences = z.infer<typeof readerPreferencesSchema>;

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  mode: "vertical",
  fitMode: "fit-width",
  zoomPercent: 100,
};

export const readingProgressSnapshotSchema = z.object({
  sourceId: z.string(),
  sourceTitleId: z.string(),
  libraryEntryId: z.string().nullable(),
  lastReadChapterId: z.string().nullable(),
  lastReadPageIndex: z.number().int().min(0),
  lastReadScrollProgress: z.number().min(0).max(1),
  updatedAt: z.string(),
});

export type ReadingProgressSnapshot = z.infer<typeof readingProgressSnapshotSchema>;

export const readerStateSnapshotSchema = z.object({
  libraryEntryId: z.string().nullable(),
  preferences: readerPreferencesSchema,
  progress: readingProgressSnapshotSchema.nullable(),
});

export type ReaderStateSnapshot = z.infer<typeof readerStateSnapshotSchema>;

export const saveReadingProgressInputSchema = z.object({
  sourceId: z.string(),
  sourceTitleId: z.string(),
  libraryEntryId: z.string().nullable().optional(),
  chapterId: z.string(),
  pageIndex: z.number().int().min(0),
  scrollProgress: z.number().min(0).max(1),
});

export type SaveReadingProgressInput = z.infer<typeof saveReadingProgressInputSchema>;
