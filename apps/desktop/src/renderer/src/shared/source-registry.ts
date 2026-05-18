import type {
  SourceCatalogItem,
  SourceChapterPage,
  SourceChapterSummary,
  SourcePagedResult,
  SourceTitleDetails,
  SourceTitleSummary,
} from "@contracts/source";

export function getSourceCatalog() {
  return window.sourceRegistry.getCatalog();
}

export function browseSourceTitles(sourceId: string, page: number) {
  return window.sourceRegistry.browse(sourceId, page);
}

export function searchSourceTitles(sourceId: string, query: string, page = 1) {
  return window.sourceRegistry.search(sourceId, query, page);
}

export function getSourceTitle(sourceId: string, titleId: string) {
  return window.sourceRegistry.getTitle(sourceId, titleId) as Promise<{
    details: SourceTitleDetails;
    chapters: SourceChapterSummary[];
  }>;
}

export function getSourceChapterPages(sourceId: string, titleId: string, chapterId: string) {
  return window.sourceRegistry.getChapterPages(sourceId, titleId, chapterId) as Promise<
    SourceChapterPage[]
  >;
}

export type SourceBrowseSnapshot = {
  source: SourceCatalogItem;
  results: SourcePagedResult<SourceTitleSummary>;
};
