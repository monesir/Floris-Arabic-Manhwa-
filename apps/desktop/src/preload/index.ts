import { contextBridge, ipcRenderer } from "electron";
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
import type {
  ReaderPreferences,
  ReaderStateSnapshot,
  ReadingProgressSnapshot,
  SaveReadingProgressInput,
} from "@contracts/reader";
import type {
  DownloadJob,
  DownloadQueueSummary,
  EnqueueDownloadInput,
} from "@contracts/downloads";
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

contextBridge.exposeInMainWorld("appShell", {
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node,
  },
});

contextBridge.exposeInMainWorld("appSettings", {
  get() {
    return ipcRenderer.invoke("settings:get") as Promise<AppSettingsSnapshot>;
  },
  setLanguage(language: AppLanguage) {
    return ipcRenderer.invoke(
      "settings:set-language",
      language,
    ) as Promise<AppSettingsSnapshot>;
  },
});

contextBridge.exposeInMainWorld("pluginRegistry", {
  getState() {
    return ipcRenderer.invoke("plugins:get-state") as Promise<{
      pluginDirectory: string;
      plugins: PluginListItem[];
    }>;
  },
});

contextBridge.exposeInMainWorld("libraryStore", {
  add(input: AddLibraryEntryInput) {
    return ipcRenderer.invoke("library:add", input) as Promise<LibraryEntry>;
  },
  list(query?: LibraryListQuery) {
    return ipcRenderer.invoke("library:list", query) as Promise<LibraryEntry[]>;
  },
  updateStatus(libraryEntryId: string, readingStatus: ReadingStatus) {
    return ipcRenderer.invoke(
      "library:update-status",
      libraryEntryId,
      readingStatus,
    ) as Promise<LibraryEntry | null>;
  },
  updateFavorite(libraryEntryId: string, isFavorite: boolean) {
    return ipcRenderer.invoke(
      "library:update-favorite",
      libraryEntryId,
      isFavorite,
    ) as Promise<LibraryEntry | null>;
  },
  refreshUpdates() {
    return ipcRenderer.invoke("library:refresh-updates") as Promise<LibraryRefreshSummary>;
  },
  listUpdates() {
    return ipcRenderer.invoke("library:list-updates") as Promise<LibraryUpdateItem[]>;
  },
});

contextBridge.exposeInMainWorld("libraryLists", {
  create(input: CreateLibraryCustomListInput) {
    return ipcRenderer.invoke("library-lists:create", input) as Promise<LibraryCustomList>;
  },
  list() {
    return ipcRenderer.invoke("library-lists:list") as Promise<LibraryCustomList[]>;
  },
  addEntry(libraryEntryId: string, listId: string) {
    return ipcRenderer.invoke("library-lists:add-entry", libraryEntryId, listId) as Promise<LibraryEntry | null>;
  },
  removeEntry(libraryEntryId: string, listId: string) {
    return ipcRenderer.invoke("library-lists:remove-entry", libraryEntryId, listId) as Promise<LibraryEntry | null>;
  },
});

contextBridge.exposeInMainWorld("sourceRegistry", {
  getCatalog() {
    return ipcRenderer.invoke("sources:get-catalog") as Promise<SourceCatalogItem[]>;
  },
  browse(sourceId: string, page: number) {
    return ipcRenderer.invoke(
      "sources:browse",
      sourceId,
      page,
    ) as Promise<SourcePagedResult<SourceTitleSummary>>;
  },
  search(sourceId: string, query: string, page?: number) {
    return ipcRenderer.invoke(
      "sources:search",
      sourceId,
      query,
      page,
    ) as Promise<SourcePagedResult<SourceTitleSummary>>;
  },
  getTitle(sourceId: string, titleId: string) {
    return ipcRenderer.invoke("sources:get-title", sourceId, titleId) as Promise<{
      details: SourceTitleDetails;
      chapters: SourceChapterSummary[];
    }>;
  },
  getChapterPages(sourceId: string, titleId: string, chapterId: string) {
    return ipcRenderer.invoke(
      "sources:get-chapter-pages",
      sourceId,
      titleId,
      chapterId,
    ) as Promise<SourceChapterPage[]>;
  },
});

contextBridge.exposeInMainWorld("readerStore", {
  getState(sourceId: string, sourceTitleId: string, libraryEntryId?: string | null) {
    return ipcRenderer.invoke(
      "reader:get-state",
      sourceId,
      sourceTitleId,
      libraryEntryId,
    ) as Promise<ReaderStateSnapshot>;
  },
  updatePreferences(preferences: ReaderPreferences) {
    return ipcRenderer.invoke("reader:update-preferences", preferences) as Promise<ReaderPreferences>;
  },
  saveProgress(input: SaveReadingProgressInput) {
    return ipcRenderer.invoke("reader:save-progress", input) as Promise<ReadingProgressSnapshot | null>;
  },
});

contextBridge.exposeInMainWorld("downloadsStore", {
  enqueue(input: EnqueueDownloadInput) {
    return ipcRenderer.invoke("downloads:enqueue", input) as Promise<DownloadJob | null>;
  },
  list() {
    return ipcRenderer.invoke("downloads:list") as Promise<DownloadJob[]>;
  },
  getSummary() {
    return ipcRenderer.invoke("downloads:get-summary") as Promise<DownloadQueueSummary>;
  },
});
