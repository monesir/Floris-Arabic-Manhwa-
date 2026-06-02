import type {
  AddLibraryEntryInput,
  CreateLibraryCustomListInput,
  LibraryCustomList,
  LibraryEntry,
  LibraryListQuery,
  LibraryRefreshSummary,
  LibraryUpdateItem,
  ReadingStatus,
} from "@contracts/library";
import type { PluginListItem } from "@contracts/plugin";
import type { ImportResult } from "@contracts/imports";
import type {
  ReadingHistoryItem,
  ReadingSessionSummary,
  ReadingTitleAnalytics,
} from "@contracts/analytics";
import type {
  DownloadJob,
  DownloadQueueSummary,
  DownloadSettingsSnapshot,
  EnqueueDownloadInput,
} from "@contracts/downloads";
import type {
  ReaderPreferences,
  ReaderStateSnapshot,
  ReadingProgressSnapshot,
  SaveReadingProgressInput,
} from "@contracts/reader";
import type {
  AppLanguage,
  AppSettingsSnapshot,
} from "@contracts/settings";
import type {
  SourceCatalogItem,
  SourceChapterPage,
  SourceChapterSummary,
  SourcePagedResult,
  SourceTitleDetails,
  SourceTitleSummary,
} from "@contracts/source";

export {};

declare module "*.css";

declare global {
  interface Window {
    appShell: {
      platform: NodeJS.Platform;
      versions: {
        chrome: string;
        electron: string;
        node: string;
      };
    };
    appSettings: {
      get: () => Promise<AppSettingsSnapshot>;
      setLanguage: (language: AppLanguage) => Promise<AppSettingsSnapshot>;
    };
    pluginRegistry: {
      getState: () => Promise<{
        pluginDirectory: string;
        plugins: PluginListItem[];
      }>;
      rescan: () => Promise<{
        pluginDirectory: string;
        plugins: PluginListItem[];
      }>;
    };
    libraryStore: {
      add: (input: AddLibraryEntryInput) => Promise<LibraryEntry>;
      list: (query?: LibraryListQuery) => Promise<LibraryEntry[]>;
      updateStatus: (
        libraryEntryId: string,
        readingStatus: ReadingStatus,
      ) => Promise<LibraryEntry | null>;
      updateFavorite: (
        libraryEntryId: string,
        isFavorite: boolean,
      ) => Promise<LibraryEntry | null>;
      refreshUpdates: () => Promise<LibraryRefreshSummary>;
      listUpdates: () => Promise<LibraryUpdateItem[]>;
    };
    libraryLists: {
      create: (input: CreateLibraryCustomListInput) => Promise<LibraryCustomList>;
      list: () => Promise<LibraryCustomList[]>;
      addEntry: (libraryEntryId: string, listId: string) => Promise<LibraryEntry | null>;
      removeEntry: (libraryEntryId: string, listId: string) => Promise<LibraryEntry | null>;
    };
    sourceRegistry: {
      getCatalog: () => Promise<SourceCatalogItem[]>;
      browse: (sourceId: string, page: number) => Promise<SourcePagedResult<SourceTitleSummary>>;
      search: (sourceId: string, query: string, page?: number) => Promise<SourcePagedResult<SourceTitleSummary>>;
      getTitle: (sourceId: string, titleId: string) => Promise<{
        details: SourceTitleDetails;
        chapters: SourceChapterSummary[];
      }>;
      getChapterPages: (
        sourceId: string,
        titleId: string,
        chapterId: string,
      ) => Promise<SourceChapterPage[]>;
    };
    readerStore: {
      getState: (
        sourceId: string,
        sourceTitleId: string,
        libraryEntryId?: string | null,
      ) => Promise<ReaderStateSnapshot>;
      updatePreferences: (preferences: ReaderPreferences) => Promise<ReaderPreferences>;
      saveProgress: (input: SaveReadingProgressInput) => Promise<ReadingProgressSnapshot | null>;
    };
    downloadsStore: {
      enqueue: (input: EnqueueDownloadInput) => Promise<DownloadJob | null>;
      list: () => Promise<DownloadJob[]>;
      getSummary: () => Promise<DownloadQueueSummary>;
      getSettings: () => Promise<DownloadSettingsSnapshot>;
      setDestinationType: (
        destinationType: "app_managed" | "external",
      ) => Promise<DownloadSettingsSnapshot>;
      pickExternalDirectory: () => Promise<DownloadSettingsSnapshot>;
      retry: (jobId: string) => Promise<DownloadJob | null>;
    };
    importsStore: {
      importFolder: () => Promise<ImportResult | null>;
      importCbz: () => Promise<ImportResult | null>;
      importPdf: () => Promise<ImportResult | null>;
    };
    analyticsStore: {
      listHistory: () => Promise<ReadingHistoryItem[]>;
      listTitleAnalytics: () => Promise<ReadingTitleAnalytics[]>;
      startReaderSession: (input: {
        sourceId: string;
        sourceTitleId: string;
        libraryEntryId?: string | null;
        titleName: string;
        chapterId: string;
        chapterTitle: string;
      }) => Promise<string>;
      endReaderSession: (sessionId: string) => Promise<ReadingSessionSummary | null>;
    };
  }
}
