import { ipcMain } from "electron";
import {
  browseSourceTitles,
  getSourceChapterPages,
  getSourceTitleDetails,
  listSourceCatalog,
  searchSourceTitles,
} from "@services/sources/source-registry";

const GET_SOURCE_CATALOG_CHANNEL = "sources:get-catalog";
const BROWSE_SOURCE_CHANNEL = "sources:browse";
const SEARCH_SOURCE_CHANNEL = "sources:search";
const GET_SOURCE_TITLE_CHANNEL = "sources:get-title";
const GET_SOURCE_CHAPTER_PAGES_CHANNEL = "sources:get-chapter-pages";

export function registerSourceIpc() {
  ipcMain.handle(GET_SOURCE_CATALOG_CHANNEL, () => listSourceCatalog());
  ipcMain.handle(BROWSE_SOURCE_CHANNEL, (_, sourceId: string, page: number) =>
    browseSourceTitles(sourceId, page),
  );
  ipcMain.handle(SEARCH_SOURCE_CHANNEL, (_, sourceId: string, query: string, page?: number) =>
    searchSourceTitles(sourceId, query, page),
  );
  ipcMain.handle(GET_SOURCE_TITLE_CHANNEL, (_, sourceId: string, titleId: string) =>
    getSourceTitleDetails(sourceId, titleId),
  );
  ipcMain.handle(
    GET_SOURCE_CHAPTER_PAGES_CHANNEL,
    (_, sourceId: string, titleId: string, chapterId: string) =>
      getSourceChapterPages(sourceId, titleId, chapterId),
  );
}
