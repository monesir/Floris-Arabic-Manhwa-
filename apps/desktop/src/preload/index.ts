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
import type { ImportResult } from "@contracts/imports";
import type {
  ReadingHistoryItem,
  ReadingSessionSummary,
  ReadingTitleAnalytics,
} from "@contracts/analytics";
import type {
  ReaderPreferences,
  ReaderStateSnapshot,
  ReadingProgressSnapshot,
  SaveReadingProgressInput,
} from "@contracts/reader";
import type {
  DownloadJob,
  DownloadQueueSummary,
  DownloadSettingsSnapshot,
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
import type { TachiyomiBackupResult } from "@contracts/backup";

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
  rescan() {
    return ipcRenderer.invoke("plugins:rescan") as Promise<{
      pluginDirectory: string;
      plugins: PluginListItem[];
    }>;
  },
});

contextBridge.exposeInMainWorld("libraryStore", {
  add(input: AddLibraryEntryInput) {
    return ipcRenderer.invoke("library:add", input) as Promise<LibraryEntry>;
  },
  remove(libraryEntryId: string) {
    return ipcRenderer.invoke("library:remove", libraryEntryId) as Promise<void>;
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
  updateTotalChapterCount(libraryEntryId: string, totalChapterCount: number) {
    return ipcRenderer.invoke("library:update-total-chapters", libraryEntryId, totalChapterCount) as Promise<void>;
  },
  updateCover(sourceId: string, sourceTitleId: string, coverUrl: string) {
    return ipcRenderer.invoke("library:update-cover", sourceId, sourceTitleId, coverUrl) as Promise<LibraryEntry | null>;
  },
});

contextBridge.exposeInMainWorld("libraryLists", {
  create(input: CreateLibraryCustomListInput) {
    return ipcRenderer.invoke("library-lists:create", input) as Promise<LibraryCustomList>;
  },
  delete(listId: string) {
    return ipcRenderer.invoke("library-lists:delete", listId) as Promise<void>;
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
  getSettings() {
    return ipcRenderer.invoke("downloads:get-settings") as Promise<DownloadSettingsSnapshot>;
  },
  setDestinationType(destinationType: "app_managed" | "external") {
    return ipcRenderer.invoke(
      "downloads:set-destination-type",
      destinationType,
    ) as Promise<DownloadSettingsSnapshot>;
  },
  pickExternalDirectory() {
    return ipcRenderer.invoke("downloads:pick-external-directory") as Promise<DownloadSettingsSnapshot>;
  },
  retry(jobId: string) {
    return ipcRenderer.invoke("downloads:retry", jobId) as Promise<DownloadJob | null>;
  },
});

contextBridge.exposeInMainWorld("importsStore", {
  importFolder() {
    return ipcRenderer.invoke("imports:folder") as Promise<ImportResult | null>;
  },
  importCbz() {
    return ipcRenderer.invoke("imports:cbz") as Promise<ImportResult | null>;
  },
  importPdf() {
    return ipcRenderer.invoke("imports:pdf") as Promise<ImportResult | null>;
  },
});

contextBridge.exposeInMainWorld("analyticsStore", {
  listHistory() {
    return ipcRenderer.invoke("analytics:list-history") as Promise<ReadingHistoryItem[]>;
  },
  listTitleAnalytics() {
    return ipcRenderer.invoke("analytics:list-title-analytics") as Promise<ReadingTitleAnalytics[]>;
  },
  clearHistory() {
    return ipcRenderer.invoke("analytics:clear-history") as Promise<void>;
  },
  listReadChapterIds(sourceId: string, sourceTitleId: string) {
    return ipcRenderer.invoke("analytics:list-read-chapters", sourceId, sourceTitleId) as Promise<string[]>;
  },
  getAllReadChapterCounts() {
    return ipcRenderer.invoke("analytics:all-read-counts") as Promise<Record<string, number>>;
  },
  listCompletedChapterIds(sourceId: string, sourceTitleId: string) {
    return ipcRenderer.invoke("analytics:list-completed-chapters", sourceId, sourceTitleId) as Promise<string[]>;
  },
  getAllCompletedChapterCounts() {
    return ipcRenderer.invoke("analytics:all-completed-counts") as Promise<Record<string, number>>;
  },
  markChapterCompleted(input: {
    sourceId: string;
    sourceTitleId: string;
    chapterId: string;
    libraryEntryId: string | null;
    completedAt: string;
  }) {
    return ipcRenderer.invoke("analytics:mark-chapter-completed", input) as Promise<void>;
  },
  startReaderSession(input: {
    sourceId: string;
    sourceTitleId: string;
    libraryEntryId?: string | null;
    titleName: string;
    chapterId: string;
    chapterTitle: string;
  }) {
    return ipcRenderer.invoke("reader:start-session", input) as Promise<string>;
  },
  endReaderSession(sessionId: string) {
    return ipcRenderer.invoke("reader:end-session", sessionId) as Promise<ReadingSessionSummary | null>;
  },
});

contextBridge.exposeInMainWorld("coverCache", {
  resolve(remoteUrl: string) {
    return ipcRenderer.invoke("covers:resolve", remoteUrl) as Promise<string>;
  },
  clear() {
    return ipcRenderer.invoke("covers:clear") as Promise<boolean>;
  },
  getSize() {
    return ipcRenderer.invoke("covers:size") as Promise<number>;
  }
});

contextBridge.exposeInMainWorld("backupStore", {
  openTachiyomi() {
    return ipcRenderer.invoke("backup:open-tachiyomi") as Promise<TachiyomiBackupResult | null>;
  },
});
