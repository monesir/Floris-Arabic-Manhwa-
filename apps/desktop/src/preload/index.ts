import { contextBridge, ipcRenderer } from "electron";
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
