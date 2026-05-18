import { pathToFileURL } from "node:url";
import {
  LOCAL_IMPORTS_SOURCE_METADATA,
  LOCAL_IMPORTS_SOURCE_RECORD,
} from "@contracts/plugin";
import type {
  SourceChapterPage,
  SourceChapterSummary,
  SourcePagedResult,
  SourceRuntimeContract,
  SourceTitleDetails,
  SourceTitleSummary,
} from "@contracts/source";
import { getDatabase } from "@db/database";
import {
  ImportedContentRepository,
  type ImportedChapterRecord,
  type ImportedTitleRecord,
} from "@db/repositories/imported-content-repository";

function repository() {
  return new ImportedContentRepository(getDatabase());
}

function fileUrl(value: string | null) {
  return value ? pathToFileURL(value).toString() : null;
}

function mapTitle(title: ImportedTitleRecord): SourceTitleSummary {
  const chapters = repository().listChapters(title.importedTitleId);
  const latestChapter = chapters[0] ?? null;

  return {
    titleId: title.importedTitleId,
    slug: title.titleSlug ?? title.importedTitleId,
    name: title.titleName,
    coverUrl: fileUrl(title.coverPath),
    bannerUrl: fileUrl(title.coverPath),
    canonicalUrl: fileUrl(title.sourcePath) ?? LOCAL_IMPORTS_SOURCE_METADATA.baseUrl,
    status: "completed",
    statusLabel: "Imported",
    tags: [title.importType.toUpperCase(), "Local"],
    latestChapterLabel: latestChapter?.chapterTitle ?? null,
    descriptionSnippet: title.description,
  };
}

function mapDetails(title: ImportedTitleRecord): SourceTitleDetails {
  const summary = mapTitle(title);

  return {
    ...summary,
    description: title.description,
    authors: [],
    artists: [],
    originalLanguage: null,
    sourceLabel: "Local Imports",
  };
}

function mapChapter(chapter: ImportedChapterRecord): SourceChapterSummary {
  return {
    chapterId: chapter.importedChapterId,
    title: chapter.chapterTitle,
    chapterNumber: chapter.chapterNumber,
    volumeNumber: null,
    groupName: "Local Import",
    releaseDate: chapter.createdAt,
    canonicalUrl: fileUrl(chapter.sourcePath) ?? LOCAL_IMPORTS_SOURCE_METADATA.baseUrl,
    availability: chapter.availability,
    availabilityLabel:
      chapter.availability === "readable"
        ? "Readable"
        : chapter.availability === "unavailable"
          ? "Unavailable"
          : "Locked",
  };
}

async function browse(page: number): Promise<SourcePagedResult<SourceTitleSummary>> {
  const titles = repository().listTitles().map(mapTitle);
  return {
    items: page === 1 ? titles : [],
    page,
    hasNextPage: false,
  };
}

async function search(query: string, page = 1): Promise<SourcePagedResult<SourceTitleSummary>> {
  const titles = repository().searchTitles(query.trim()).map(mapTitle);
  return {
    items: page === 1 ? titles : [],
    page,
    hasNextPage: false,
  };
}

async function getTitleDetails(titleId: string): Promise<SourceTitleDetails> {
  const title = repository().getTitle(titleId);

  if (!title) {
    throw new Error(`Imported title ${titleId} not found.`);
  }

  return mapDetails(title);
}

async function listChapters(titleId: string): Promise<SourceChapterSummary[]> {
  return repository().listChapters(titleId).map(mapChapter);
}

async function getChapterPages(_titleId: string, chapterId: string): Promise<SourceChapterPage[]> {
  return repository()
    .listPages(chapterId)
    .map((page) => ({
      pageIndex: page.pageIndex,
      imageUrl: pathToFileURL(page.assetPath).toString(),
    }));
}

export const localImportsSourceRuntime: SourceRuntimeContract = {
  metadata: LOCAL_IMPORTS_SOURCE_METADATA,
  capabilities: LOCAL_IMPORTS_SOURCE_RECORD.capabilities,
  browse,
  search,
  getTitleDetails,
  listChapters,
  getChapterPages,
};
