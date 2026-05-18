import {
  OLYMPUS_SOURCE_METADATA,
  OLYMPUS_SOURCE_RECORD,
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

const BASE_URL = OLYMPUS_SOURCE_METADATA.baseUrl;

function buildSeriesUrl(titleId: string) {
  return new URL(`/series/${titleId}`, BASE_URL).toString();
}

function buildBrowseUrl(page: number) {
  const url = new URL("/series", BASE_URL);

  if (page > 1) {
    url.searchParams.set("page", String(page));
  }

  return url.toString();
}

function parseBrowseCards(html: string, page: number): SourcePagedResult<SourceTitleSummary> {
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
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length !== 2 || parts[0] !== "series") {
      return;
    }

    const titleId = parts[1];
    const card = $(anchor).closest(".manga-box, .manga-list-item, .card, .series-card, .box");
    const container = card.length ? card : $(anchor).parent();
    const name =
      trimText(container.find("h3, h4, .manga-title, .entry-title").first().text()) ||
      trimText($(anchor).attr("title")) ||
      trimText($(anchor).text());

    if (!name) {
      return;
    }

    const coverUrl =
      toAbsoluteUrl(BASE_URL, container.find("img").first().attr("src")) ??
      toAbsoluteUrl(BASE_URL, $('meta[property="og:image"]').attr("content"));
    const statusLabel =
      container
        .find("span, p")
        .map((_, node) => trimText($(node).text()))
        .get()
        .find((text) => /(مستمر|مكتمل|متوقف|ملغي|ongoing|complete)/i.test(text)) ?? null;
    const descriptionSnippet = trimText(container.find("p").last().text()) || null;
    const latestChapterLabel =
      container
        .find('a[href*="/series/"]')
        .map((_, node) => trimText($(node).text()))
        .get()
        .find((text) => /فصل|chapter/i.test(text)) ?? null;

    itemsById.set(titleId, {
      titleId,
      slug: titleId,
      name,
      coverUrl,
      bannerUrl: coverUrl,
      canonicalUrl: buildSeriesUrl(titleId),
      status: parseTitleStatus(statusLabel),
      statusLabel,
      tags: [],
      latestChapterLabel,
      descriptionSnippet,
    });
  });

  if (itemsById.size === 0) {
    return emptyPageResult(page);
  }

  const hasNextPage = $('a[rel="next"], a[href*="?page="]').length > 0;

  return {
    items: [...itemsById.values()],
    page,
    hasNextPage,
  };
}

async function browse(page: number) {
  const html = await fetchHtml(buildBrowseUrl(page));
  return parseBrowseCards(html, page);
}

async function search(query: string, page = 1) {
  if (!query.trim()) {
    return emptyPageResult<SourceTitleSummary>(page);
  }

  const html = await fetchHtml(
    new URL(`/ajax/search?keyword=${encodeURIComponent(query)}`, BASE_URL).toString(),
    {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );
  const $ = load(html);
  const items: SourceTitleSummary[] = $('a[href*="/series/"]')
    .map((_, anchor) => {
      const href = $(anchor).attr("href");
      const absoluteUrl = toAbsoluteUrl(BASE_URL, href);

      if (!absoluteUrl) {
        return null;
      }

      const url = new URL(absoluteUrl);
      const parts = url.pathname.split("/").filter(Boolean);
      const titleId = parts.at(-1);

      if (!titleId) {
        return null;
      }

      const coverUrl = toAbsoluteUrl(BASE_URL, $(anchor).find("img").attr("src"));
      const tags = $(anchor)
        .find("span")
        .map((__, node) => trimText($(node).text()))
        .get()
        .filter(Boolean);

      return {
        titleId,
        slug: titleId,
        name: trimText($(anchor).find("h4").text()) || titleId,
        coverUrl,
        bannerUrl: coverUrl,
        canonicalUrl: buildSeriesUrl(titleId),
        status: "unknown" as const,
        statusLabel: null,
        tags,
        latestChapterLabel: trimText($(anchor).find("p").last().text()) || null,
        descriptionSnippet: null,
      };
    })
    .get()
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    items,
    page,
    hasNextPage: false,
  };
}

function parseTitleDetails($: ReturnType<typeof load>, titleId: string): SourceTitleDetails {
  const name =
    trimText($('meta[property="og:title"]').attr("content")).replace(/\s*-\s*مانجا مترجمة$/i, "") ||
    trimText($("title").text());
  const description = trimText($('meta[name="description"]').attr("content")) || null;
  const coverUrl = toAbsoluteUrl(BASE_URL, $('meta[property="og:image"]').attr("content"));
  const detailLines = $("p, span, div")
    .map((_, node) => trimText($(node).text()))
    .get();
  const statusLabel = detailLines.find((text) => /(مستمر|مكتمل|متوقف|ملغي|ongoing|complete)/i.test(text)) ?? null;
  const tags = detailLines.filter((text) => /(مانهوا|مانها|مانجا|كورية|صيني|ياباني)/i.test(text));

  return {
    titleId,
    slug: titleId,
    name,
    coverUrl,
    bannerUrl: coverUrl,
    canonicalUrl:
      $('meta[property="og:url"]').attr("content") ??
      buildSeriesUrl(titleId),
    status: parseTitleStatus(statusLabel),
    statusLabel,
    tags: [...new Set(tags)].slice(0, 8),
    latestChapterLabel: null,
    descriptionSnippet: description,
    description,
    authors: [],
    artists: [],
    originalLanguage: tags.find((tag) => /كورية|korean/i.test(tag)) ? "Korean" : null,
    sourceLabel: "Olympus Staff",
  };
}

async function listChapters(titleId: string) {
  const chaptersById = new Map<string, SourceChapterSummary>();
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage && page <= 8) {
    const url = new URL(`/series/${titleId}`, BASE_URL);

    if (page > 1) {
      url.searchParams.set("page", String(page));
    }

    const $ = await fetchCheerio(url.toString());

    $('a[href^="/series/"], a[href*="/series/"]').each((_, anchor) => {
      const href = $(anchor).attr("href");

      if (!href) {
        return;
      }

      const absoluteUrl = toAbsoluteUrl(BASE_URL, href);

      if (!absoluteUrl) {
        return;
      }

      const parsedUrl = new URL(absoluteUrl);
      const parts = parsedUrl.pathname.split("/").filter(Boolean);

      if (parts.length !== 3 || parts[1] !== titleId) {
        return;
      }

      const chapterId = parts[2];
      const container = $(anchor).closest(".chapter-card, .row, li, .card, .episode-item");
      const text = trimText($(anchor).text()) || trimText(container.text());
      const classNames = [
        $(anchor).attr("class") ?? "",
        container.attr("class") ?? "",
      ];
      const lockedByModal =
        $(anchor).attr("data-bs-toggle") === "modal" ||
        container.find('[data-bs-toggle="modal"]').length > 0;
      const availability = lockedByModal
        ? "locked"
        : parseChapterAvailability(text, classNames);

      chaptersById.set(chapterId, {
        chapterId,
        title: text || `Chapter ${chapterId}`,
        chapterNumber: extractNumericSuffix(chapterId) ?? extractNumericSuffix(text),
        volumeNumber: null,
        groupName: "Olympus Staff",
        releaseDate: null,
        canonicalUrl: absoluteUrl,
        availability,
        availabilityLabel:
          availability === "locked" ? "Locked" : availability === "unavailable" ? "Unavailable" : "Readable",
      });
    });

    hasNextPage = $(`a[href="/series/${titleId}?page=${page + 1}"], a[href*="?page=${page + 1}"]`).length > 0;
    page += 1;
  }

  return [...chaptersById.values()].sort((left, right) => {
    const leftNumber = left.chapterNumber ?? 0;
    const rightNumber = right.chapterNumber ?? 0;
    return rightNumber - leftNumber;
  });
}

async function getTitleDetails(titleId: string) {
  const $ = await fetchCheerio(buildSeriesUrl(titleId));
  return parseTitleDetails($, titleId);
}

async function getChapterPages(titleId: string, chapterId: string): Promise<SourceChapterPage[]> {
  const chapterUrl = new URL(`/series/${titleId}/${chapterId}`, BASE_URL).toString();
  const $ = await fetchCheerio(chapterUrl);
  const pages = $("img.manga-chapter-img, img[src*='/images/chapter/'], .manga-chapter-img img")
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

export const olympusSourceRuntime: SourceRuntimeContract = {
  metadata: OLYMPUS_SOURCE_METADATA,
  capabilities: OLYMPUS_SOURCE_RECORD.capabilities,
  browse,
  search,
  getTitleDetails,
  listChapters,
  getChapterPages,
};
