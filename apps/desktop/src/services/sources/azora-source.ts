import {
  AZORA_SOURCE_METADATA,
  AZORA_SOURCE_RECORD,
} from "@contracts/plugin";
import type {
  SourceChapterPage,
  SourceChapterSummary,
  SourcePagedResult,
  SourceRuntimeContract,
  SourceTitleDetails,
  SourceTitleSummary,
} from "@contracts/source";
import { emptyPageResult } from "@services/sources/source-helpers";

const API_BASE_URL = "https://api.azoramoon.com/api";

async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Azora fetch failed: ${response.statusText}`);
  }
  return response.json();
}

async function browse(page: number): Promise<SourcePagedResult<SourceTitleSummary>> {
  const url = `${API_BASE_URL}/query?page=${page}&perPage=25&searchTerm=&orderBy=lastChapterAddedAt&orderDirection=desc`;
  const data = await fetchJson(url);

  if (!data || !data.posts || data.posts.length === 0) {
    return emptyPageResult(page);
  }

  const items: SourceTitleSummary[] = data.posts.map((post: any) => ({
    titleId: post.slug,
    slug: post.slug,
    name: post.postTitle,
    coverUrl: post.featuredImage,
    bannerUrl: post.featuredImage,
    canonicalUrl: `https://azoramoon.com/series/${post.slug}`,
    status: "ongoing",
    statusLabel: null,
    tags: [],
    latestChapterLabel: null,
    descriptionSnippet: post.postDescription || null,
  }));

  return {
    items,
    page,
    hasNextPage: data.posts.length === 25,
  };
}

async function search(query: string, page = 1): Promise<SourcePagedResult<SourceTitleSummary>> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return emptyPageResult<SourceTitleSummary>(page);
  }

  const url = `${API_BASE_URL}/query?page=${page}&perPage=25&searchTerm=${encodeURIComponent(normalizedQuery)}&orderBy=lastChapterAddedAt&orderDirection=desc`;
  const data = await fetchJson(url);

  if (!data || !data.posts || data.posts.length === 0) {
    return emptyPageResult(page);
  }

  const items: SourceTitleSummary[] = data.posts.map((post: any) => ({
    titleId: post.slug,
    slug: post.slug,
    name: post.postTitle,
    coverUrl: post.featuredImage,
    bannerUrl: post.featuredImage,
    canonicalUrl: `https://azoramoon.com/series/${post.slug}`,
    status: "ongoing",
    statusLabel: null,
    tags: [],
    latestChapterLabel: null,
    descriptionSnippet: post.postDescription || null,
  }));

  return {
    items,
    page,
    hasNextPage: data.posts.length === 25,
  };
}

async function getTitleDetails(titleId: string): Promise<SourceTitleDetails> {
  const url = `${API_BASE_URL}/post?postSlug=${titleId}`;
  const data = await fetchJson(url);

  if (!data || !data.post) {
    throw new Error("Azora series not found");
  }

  const post = data.post;
  const description = post.postContent ? post.postContent.replace(/<[^>]+>/g, '').trim() : null;
  const genres = Array.isArray(post.genres) ? post.genres.map((g: any) => g.name).filter(Boolean) : [];
  
  let mappedStatus: "ongoing" | "completed" | "hiatus" | "cancelled" | "unknown" = "unknown";
  let statusLabel = null;
  if (post.seriesStatus === "ONGOING") { mappedStatus = "ongoing"; statusLabel = "مستمرة"; }
  else if (post.seriesStatus === "COMPLETED") { mappedStatus = "completed"; statusLabel = "مكتملة"; }
  else if (post.seriesStatus === "HIATUS") { mappedStatus = "hiatus"; statusLabel = "متوقفة"; }
  else if (post.seriesStatus === "DROPPED") { mappedStatus = "cancelled"; statusLabel = "ملغية"; }

  let lang = "N/A";
  if (post.seriesType === "MANHWA") lang = "Korean (Manhwa)";
  else if (post.seriesType === "MANHUA") lang = "Chinese (Manhua)";
  else if (post.seriesType === "MANGA") lang = "Japanese (Manga)";

  const authors = post.author ? [post.author] : [];
  if (authors.length === 0 && post.studio) authors.push(post.studio);
  if (authors.length === 0 && post.publishingTeam?.name) authors.push(post.publishingTeam.name);
  if (authors.length === 0) authors.push("Unknown");

  return {
    titleId,
    slug: titleId,
    name: post.postTitle,
    coverUrl: post.featuredImage,
    bannerUrl: post.featuredImage,
    canonicalUrl: `https://azoramoon.com/series/${titleId}`,
    status: mappedStatus,
    statusLabel: statusLabel || post.seriesStatus || null,
    tags: genres.slice(0, 10),
    latestChapterLabel: null,
    descriptionSnippet: description,
    description,
    authors,
    artists: post.artist ? [post.artist] : [],
    originalLanguage: lang,
    sourceLabel: "Azora Manga",
  };
}

async function listChapters(titleId: string): Promise<SourceChapterSummary[]> {
  const url = `${API_BASE_URL}/post?postSlug=${titleId}`;
  const data = await fetchJson(url);

  if (!data || !data.post || !data.post.chapters) {
    return [];
  }

  return data.post.chapters
    .map((ch: any) => ({
      chapterId: String(ch.id),
      title: ch.title || `الفصل ${ch.number}`,
      chapterNumber: ch.number,
      volumeNumber: null,
      groupName: null,
      releaseDate: ch.createdAt,
      canonicalUrl: `https://azoramoon.com/series/${titleId}/chapter-${ch.number}`,
      availability: "readable" as const,
      availabilityLabel: "Readable",
    }))
    .sort((a: SourceChapterSummary, b: SourceChapterSummary) => (b.chapterNumber ?? 0) - (a.chapterNumber ?? 0));
}

async function getChapterPages(titleId: string, chapterId: string): Promise<SourceChapterPage[]> {
  const url = `${API_BASE_URL}/chapter?chapterId=${chapterId}`;
  const data = await fetchJson(url);

  if (!data || !data.chapter || !data.chapter.images) {
    return [];
  }

  return data.chapter.images.map((img: any, index: number) => ({
    pageIndex: index,
    imageUrl: img.url || img,
  }));
}

export const azoraSourceRuntime: SourceRuntimeContract = {
  metadata: AZORA_SOURCE_METADATA,
  capabilities: AZORA_SOURCE_RECORD.capabilities,
  browse,
  search,
  getTitleDetails,
  listChapters,
  getChapterPages,
};
