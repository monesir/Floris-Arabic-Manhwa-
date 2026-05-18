import type { AddLibraryEntryInput, LibraryEntry } from "@contracts/library";
import type { PluginListItem } from "@contracts/plugin";
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
    };
    libraryStore: {
      add: (input: AddLibraryEntryInput) => Promise<LibraryEntry>;
      list: () => Promise<LibraryEntry[]>;
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
  }
}
