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
import {
  emptyPageResult,
  extractNumericSuffix,
  fetchCheerio,
  fetchHtml,
  parseChapterAvailability,
  parseTitleStatus,
  toAbsoluteUrl,
  trimText,
} from "@services/sources/source-helpers";
import { load } from "cheerio";

const BASE_URL = AZORA_SOURCE_METADATA.baseUrl;

function buildSeriesUrl(titleId: string) {
  return new URL(`/series/${titleId}`, BASE_URL).toString();
}

function buildBrowseUrl(page: number, query?: string) {
  const url = new URL("/series/", BASE_URL);

  if (page > 1) {
    url.searchParams.set("page", String(page));
  }

  if (query) {
    url.searchParams.set("searchTerm", query);
  }

  return url.toString();
}

function resolveTitleIdFromHref(href: string) {
  const url = new URL(href, BASE_URL);
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[1] ?? parts[0] ?? href;
}

function resolveChapterIdFromHref(href: string) {
  const url = new URL(href, BASE_URL);
  const parts = url.pathname.split("/").filter(Boolean);
  return parts.at(-1) ?? href;
}

function parseTitleCards(html: string, page: number): SourcePagedResult<SourceTitleSummary> {
  const $ = load(html);
  const itemsById = new Map<string, SourceTitleSummary>();

  $('a[href*="/series/"]').each((_, anchor) => {
    const href = $(anchor).attr("href");

    if (!href) {
      return;
    }

    const absoluteUrl = toAbsoluteUrl(BASE_URL, href);

    if (!absoluteUrl) {
      return;
    }

    const url = new URL(absoluteUrl);

    if (!url.pathname.startsWith("/series/")) {
      return;
    }

    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length !== 2) {
      return;
    }

    const titleId = parts[1];
    const card = $(anchor).closest("div.relative.h-full, div.relative.h-full.p-1, div.relative.h-full.p-2");
    const container = card.length ? card : $(anchor).parent();
    const name =
      trimText(container.find(`a[href="${href}"]`).not(anchor).first().text()) ||
      trimText($(anchor).attr("title")) ||
      trimText($(anchor).text());

    if (!name) {
      return;
    }

    const coverUrl = toAbsoluteUrl(BASE_URL, container.find("img").first().attr("src"));
    const badgeLabels = container.find("span").map((_, node) => trimText($(node).text())).get();
    const latestChapterLabel =
      container.find('a[href*="/chapter-"]').first().find("span").last().text().trim() ||
      container.find('a[href*="/chapter-"]').first().text().trim() ||
      null;
    const descriptionSnippet = trimText(container.find("p").last().text()) || null;
    const statusLabel =
      badgeLabels.find((label) => /(مستمر|مكتمل|متوقف|ملغي|ongoing|complete)/i.test(label)) ??
      (/(مستمر|مكتمل|متوقف|ملغي|ongoing|complete)/i.test(descriptionSnippet ?? "") ? descriptionSnippet : null);
    const tags = badgeLabels.filter(
      (label) =>
        label &&
        label !== statusLabel &&
        label !== "Pinned" &&
        !/الفصل|chapter/i.test(label),
    );

    if (!itemsById.has(titleId)) {
      itemsById.set(titleId, {
        titleId,
        slug: titleId,
        name,
        coverUrl,
        bannerUrl: coverUrl,
        canonicalUrl: buildSeriesUrl(titleId),
        status: parseTitleStatus(statusLabel),
        statusLabel,
        tags,
        latestChapterLabel,
        descriptionSnippet,
      });
    }
  });

  if (itemsById.size === 0) {
    return emptyPageResult(page);
  }

  const hasNextPage =
    $('a[href*="/series/?page="], a[href*="/series?page="], a[rel="next"]').length > 0;

  return {
    items: [...itemsById.values()],
    page,
    hasNextPage,
  };
}

function parseTitleDetails($: ReturnType<typeof load>, titleId: string): SourceTitleDetails {
  const canonicalUrl =
    $('link[rel="canonical"]').attr("href") ??
    buildSeriesUrl(titleId);
  const ogTitle = trimText($('meta[property="og:title"]').attr("content"));
  const name = ogTitle || trimText($("title").text()).replace(/\s+مانهوا$/i, "");
  const description = trimText($('meta[property="og:description"]').attr("content")) || null;
  const coverUrl =
    toAbsoluteUrl(BASE_URL, $('meta[property="og:image"]').attr("content")) ??
    toAbsoluteUrl(BASE_URL, $("img").first().attr("src"));
  const statusLabel =
    $('p, span, div')
      .map((_, node) => trimText($(node).text()))
      .get()
      .find((text) => /(مستمر|مكتمل|متوقف|ملغي|ongoing|complete)/i.test(text)) ?? null;

  const tags = $('a[href*="genres"], a[href*="genre"], button, span')
    .map((_, node) => trimText($(node).text()))
    .get()
    .filter((text) => text.length > 1 && text.length < 30)
    .filter((text) => !/(trackers|refresh|view|continue|options|creator|status|language)/i.test(text));

  return {
    titleId,
    slug: titleId,
    name,
    coverUrl,
    bannerUrl: coverUrl,
    canonicalUrl,
    status: parseTitleStatus(statusLabel),
    statusLabel,
    tags: [...new Set(tags)].slice(0, 12),
    latestChapterLabel: null,
    descriptionSnippet: description,
    description,
    authors: [],
    artists: [],
    originalLanguage: "Korean",
    sourceLabel: "Azora Manga",
  };
}

function parseChapterList($: ReturnType<typeof load>, titleId: string): SourceChapterSummary[] {
  const chaptersById = new Map<string, SourceChapterSummary>();

  $('a[href*="/chapter-"]').each((_, anchor) => {
    const href = $(anchor).attr("href");

    if (!href) {
      return;
    }

    const absoluteUrl = toAbsoluteUrl(BASE_URL, href);

    if (!absoluteUrl) {
      return;
    }

    const chapterId = resolveChapterIdFromHref(absoluteUrl);
    const chapterText =
      trimText($(anchor).find("span").first().text()) ||
      trimText($(anchor).text());
    const chapterContainer = $(anchor);
    const lockedOverlay =
      chapterContainer.find("div.absolute.inset-0").length > 0 &&
      chapterContainer.find('svg path[fill-rule="evenodd"]').length > 0;
    const availability = parseChapterAvailability(
      lockedOverlay ? "locked" : chapterText,
      [
        $(anchor).attr("class") ?? "",
        $(anchor).find("svg").attr("class") ?? "",
      ],
    );

    chaptersById.set(chapterId, {
      chapterId,
      title: chapterText || `Chapter ${chapterId}`,
      chapterNumber: extractNumericSuffix(chapterId),
      volumeNumber: null,
      groupName: null,
      releaseDate: chapterContainer.find("time").attr("datetime") ?? null,
      canonicalUrl: absoluteUrl,
      availability,
      availabilityLabel:
        availability === "locked" ? "Locked" : availability === "unavailable" ? "Unavailable" : "Readable",
    });
  });

  return [...chaptersById.values()].sort((left, right) => {
    const leftNumber = left.chapterNumber ?? 0;
    const rightNumber = right.chapterNumber ?? 0;
    return rightNumber - leftNumber;
  });
}

async function browse(page: number) {
  const html = await fetchHtml(buildBrowseUrl(page));
  return parseTitleCards(html, page);
}

async function search(query: string, page = 1) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return emptyPageResult<SourceTitleSummary>(page);
  }

  const html = await fetchHtml(buildBrowseUrl(page, normalizedQuery));
  return parseTitleCards(html, page);
}

async function getTitleDetails(titleId: string) {
  const $ = await fetchCheerio(buildSeriesUrl(titleId));
  return parseTitleDetails($, titleId);
}

async function listChapters(titleId: string) {
  const $ = await fetchCheerio(buildSeriesUrl(titleId));
  return parseChapterList($, titleId);
}

async function getChapterPages(titleId: string, chapterId: string): Promise<SourceChapterPage[]> {
  const chapterUrl = new URL(`/series/${titleId}/${chapterId}`, BASE_URL).toString();
  const $ = await fetchCheerio(chapterUrl);
  const pages = $('[data-reader-page-image], img[src*="/upload/series/"], img[src*="storage.azoramoon.com"]')
    .map((index, image) => {
      const src = $(image).attr("src") ?? $(image).attr("data-src");
      const absoluteUrl = toAbsoluteUrl(BASE_URL, src);

      if (!absoluteUrl) {
        return null;
      }

      return {
        pageIndex: index,
        imageUrl: absoluteUrl,
      };
    })
    .get()
    .filter((page): page is SourceChapterPage => page !== null);

  return pages;
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
