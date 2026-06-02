import { deriveTitleActions, type SourceCatalogItem } from "@contracts/source";
import { getActiveSourceRuntimes } from "@services/plugins/plugin-registry";

function getRuntimeRecord(sourceId: string) {
  return getActiveSourceRuntimes().find((source) => source.metadata.sourceId === sourceId) ?? null;
}

export function listSourceCatalog(): SourceCatalogItem[] {
  return getActiveSourceRuntimes().map((source) => ({
    metadata: source.metadata,
    capabilities: source.capabilities,
    actions: deriveTitleActions(source.capabilities),
  }));
}

export async function browseSourceTitles(sourceId: string, page: number) {
  const source = getRuntimeRecord(sourceId);

  if (!source?.browse) {
    throw new Error(`Source ${sourceId} does not support browse`);
  }

  return source.browse(page);
}

export async function searchSourceTitles(sourceId: string, query: string, page = 1) {
  const source = getRuntimeRecord(sourceId);

  if (!source?.search) {
    throw new Error(`Source ${sourceId} does not support search`);
  }

  return source.search(query, page);
}

export async function getSourceTitleDetails(sourceId: string, titleId: string) {
  const source = getRuntimeRecord(sourceId);

  if (!source?.getTitleDetails) {
    throw new Error(`Source ${sourceId} does not support title details`);
  }

  const details = await source.getTitleDetails(titleId);
  const chapters = source.listChapters
    ? await source.listChapters(titleId)
    : [];

  return {
    details,
    chapters,
  };
}

export async function getSourceChapterPages(sourceId: string, titleId: string, chapterId: string) {
  const source = getRuntimeRecord(sourceId);

  if (!source?.getChapterPages) {
    throw new Error(`Source ${sourceId} does not support chapter pages`);
  }

  return source.getChapterPages(titleId, chapterId);
}
