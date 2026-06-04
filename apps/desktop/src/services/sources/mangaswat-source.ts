import {
  MANGASWAT_SOURCE_METADATA,
  MANGASWAT_SOURCE_RECORD,
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

const API_BASE_URL = "https://meshmanga.com/v2/api/v2";

const API_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "User-Agent": "ktor-client",
};

// Simple rate limiter: 1 request per second to avoid 429
let lastRequestTime = 0;
async function rateLimitedFetch(url: string) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
  }
  lastRequestTime = Date.now();
  return fetch(url, { headers: API_HEADERS });
}

async function fetchJson(url: string) {
  const response = await rateLimitedFetch(url);
  if (!response.ok) {
    throw new Error(`MangaSwat fetch failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function mapMangaSummary(item: any): SourceTitleSummary {
  const tags = Array.isArray(item.genres)
    ? item.genres.map((g: any) => g.name).filter(Boolean)
    : [];

  let statusStr: "ongoing" | "completed" | "hiatus" | "cancelled" | "unknown" = "unknown";
  if (item.status?.name === "ongoing") statusStr = "ongoing";
  else if (item.status?.name === "completed") statusStr = "completed";

  // /series/ returns `id`, /series/releases returns `serie_id`
  const numericId = item.serie_id || item.id;

  return {
    titleId: String(numericId),
    slug: item.slug || String(numericId),
    name: item.title,
    coverUrl: item.poster?.thumbnail || item.poster?.medium || null,
    bannerUrl: item.poster?.medium || item.poster?.thumbnail || null,
    canonicalUrl: `https://meshmanga.com/series/${item.slug}`,
    status: statusStr,
    statusLabel: item.status?.name || null,
    tags,
    latestChapterLabel: null,
    descriptionSnippet: null,
  };
}

async function browse(page: number): Promise<SourcePagedResult<SourceTitleSummary>> {
  const url = `${API_BASE_URL}/series/releases?page_size=20&page=${page}`;
  const data = await fetchJson(url);

  if (!data || !data.results || data.results.length === 0) {
    return emptyPageResult(page);
  }

  const items: SourceTitleSummary[] = data.results.map(mapMangaSummary);

  return {
    items,
    page,
    hasNextPage: !!data.next,
  };
}

async function search(query: string, page = 1): Promise<SourcePagedResult<SourceTitleSummary>> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return emptyPageResult<SourceTitleSummary>(page);
  }

  const url = `${API_BASE_URL}/series/?search=${encodeURIComponent(normalizedQuery)}&page=${page}`;
  const data = await fetchJson(url);

  if (!data || !data.results || data.results.length === 0) {
    return emptyPageResult(page);
  }

  const items: SourceTitleSummary[] = data.results.map(mapMangaSummary);

  return {
    items,
    page,
    hasNextPage: !!data.next,
  };
}

async function getTitleDetails(titleId: string): Promise<SourceTitleDetails> {
  const url = `${API_BASE_URL}/series/${titleId}`;
  const data = await fetchJson(url);

  if (!data || !data.title) {
    throw new Error("MangaSwat series not found");
  }

  const story = data.story
    ? data.story.replace(/<[^>]+>/g, "").trim()
    : null;

  const tags = Array.isArray(data.genres)
    ? data.genres.map((g: any) => g.name).filter(Boolean)
    : [];

  let mappedStatus: "ongoing" | "completed" | "hiatus" | "cancelled" | "unknown" = "unknown";
  let statusLabel = null;
  if (data.status?.name === "ongoing") { mappedStatus = "ongoing"; statusLabel = "مستمرة"; }
  else if (data.status?.name === "completed") { mappedStatus = "completed"; statusLabel = "مكتملة"; }

  let typeLabel = "N/A";
  if (data.type?.name === "manhwa") typeLabel = "Korean (Manhwa)";
  else if (data.type?.name === "manhua") typeLabel = "Chinese (Manhua)";
  else if (data.type?.name === "manga") typeLabel = "Japanese (Manga)";

  // Author/artist can be string or object with .name
  const extractName = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (val.name) return val.name;
    return null;
  };

  const authorName = extractName(data.author);
  const artistName = extractName(data.artist);
  const authors = authorName ? [authorName] : ["Unknown"];
  const artists = artistName ? [artistName] : [];

  return {
    titleId,
    slug: data.slug || titleId,
    name: data.title,
    coverUrl: data.poster?.thumbnail || data.poster?.medium || null,
    bannerUrl: data.cover?.medium || data.poster?.medium || null,
    canonicalUrl: `https://meshmanga.com/series/${data.slug}`,
    status: mappedStatus,
    statusLabel: statusLabel || data.status?.name || null,
    tags: tags.slice(0, 10),
    latestChapterLabel: null,
    descriptionSnippet: story,
    description: story,
    authors,
    artists,
    originalLanguage: typeLabel,
    sourceLabel: "MangaSwat",
  };
}

async function listChapters(titleId: string): Promise<SourceChapterSummary[]> {
  const allChapters: SourceChapterSummary[] = [];
  let url: string | null = `${API_BASE_URL}/chapters/?serie=${titleId}&order_by=-order&page_size=200`;

  while (url) {
    const data = await fetchJson(url);

    if (!data || !data.results) break;

    for (const ch of data.results) {
      // Extract chapter number from title like "الفصل 165 من ..."
      let chapterNumber: number | null = null;
      if (ch.chapter != null) {
        chapterNumber = Number(ch.chapter);
      }
      if (chapterNumber == null || isNaN(chapterNumber)) {
        const match = ch.title?.match(/(\d+(?:\.\d+)?)/);
        if (match) chapterNumber = Number(match[1]);
      }

      allChapters.push({
        chapterId: String(ch.id),
        title: ch.title || `الفصل ${chapterNumber ?? "?"}`,
        chapterNumber: chapterNumber ?? null,
        volumeNumber: null,
        groupName: null,
        releaseDate: ch.created_at || null,
        canonicalUrl: `https://meshmanga.com/chapter/${ch.id}`,
        availability: "readable" as const,
        availabilityLabel: "Readable",
      });
    }

    url = data.next || null;
  }

  return allChapters;
}

async function getChapterPages(_titleId: string, chapterId: string): Promise<SourceChapterPage[]> {
  const url = `${API_BASE_URL}/chapters/${chapterId}`;
  const data = await fetchJson(url);

  if (!data || !data.images || data.images.length === 0) {
    return [];
  }

  return data.images
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    .map((img: any, index: number) => ({
      pageIndex: index,
      imageUrl: img.image,
    }));
}

export const mangaswatSourceRuntime: SourceRuntimeContract = {
  metadata: MANGASWAT_SOURCE_METADATA,
  capabilities: MANGASWAT_SOURCE_RECORD.capabilities,
  browse,
  search,
  getTitleDetails,
  listChapters,
  getChapterPages,
};
