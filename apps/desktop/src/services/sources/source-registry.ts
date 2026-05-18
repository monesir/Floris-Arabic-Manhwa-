import { deriveTitleActions, type SourceCatalogItem } from "@contracts/source";
import { builtInPluginRuntime } from "@plugins/builtins/placeholder-plugin";

function getRuntimeRecord(sourceId: string) {
  return builtInPluginRuntime.sources.find((source) => source.registry.sourceId === sourceId) ?? null;
}

export function listSourceCatalog(): SourceCatalogItem[] {
  return builtInPluginRuntime.sources.map((source) => ({
    metadata: source.runtime.metadata,
    capabilities: source.runtime.capabilities,
    actions: deriveTitleActions(source.runtime.capabilities),
  }));
}

export async function browseSourceTitles(sourceId: string, page: number) {
  const source = getRuntimeRecord(sourceId);

  if (!source?.runtime.browse) {
    throw new Error(`Source ${sourceId} does not support browse`);
  }

  return source.runtime.browse(page);
}

export async function searchSourceTitles(sourceId: string, query: string, page = 1) {
  const source = getRuntimeRecord(sourceId);

  if (!source?.runtime.search) {
    throw new Error(`Source ${sourceId} does not support search`);
  }

  return source.runtime.search(query, page);
}

export async function getSourceTitleDetails(sourceId: string, titleId: string) {
  const source = getRuntimeRecord(sourceId);

  if (!source?.runtime.getTitleDetails) {
    throw new Error(`Source ${sourceId} does not support title details`);
  }

  const details = await source.runtime.getTitleDetails(titleId);
  const chapters = source.runtime.listChapters
    ? await source.runtime.listChapters(titleId)
    : [];

  return {
    details,
    chapters,
  };
}

export async function getSourceChapterPages(sourceId: string, titleId: string, chapterId: string) {
  const source = getRuntimeRecord(sourceId);

  if (!source?.runtime.getChapterPages) {
    throw new Error(`Source ${sourceId} does not support chapter pages`);
  }

  return source.runtime.getChapterPages(titleId, chapterId);
}
