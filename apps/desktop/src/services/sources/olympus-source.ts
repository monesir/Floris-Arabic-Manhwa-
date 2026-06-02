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
  fetchCheerio,
  fetchHtml,
  toAbsoluteUrl,
} from "@services/sources/source-helpers";
import { load } from "cheerio";

const BASE_URL = OLYMPUS_SOURCE_METADATA.baseUrl;

function getHighResImage(input: string | undefined | null) {
  if (!input) return "";
  let url = toAbsoluteUrl(BASE_URL, input);
  if (!url) return "";
  
  if (url.includes('/thumbnail_')) {
    url = url.replace('/thumbnail_', '/');
  } else if (url.includes('-150x150')) {
    url = url.replace('-150x150', '');
  } else if (url.includes('-193x278')) {
    url = url.replace('-193x278', '');
  }
  return url;
}

function trimText(text?: string | null) {
  return (text || "").replace(/\s+/g, " ").trim();
}

async function browse(page: number): Promise<SourcePagedResult<SourceTitleSummary>> {
  const url = new URL("/", BASE_URL);
  if (page > 1) {
    url.searchParams.set("page", String(page));
  }

  const html = await fetchHtml(url.toString(), {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const $ = load(html);
  const itemsById = new Map<string, SourceTitleSummary>();

  $('.uta').each((_, el) => {
    const a = $(el).find('.info a').first();
    if (!a.length) return;
    
    const href = toAbsoluteUrl(BASE_URL, a.attr('href'));
    if (!href) return;

    let title = trimText(a.find('h3').text());
    const imgSrc = $(el).find('.imgu img').attr('src') || $(el).find('.imgu img').attr('data-src');
    
    if (title && imgSrc && href) {
      const parsedUrl = new URL(href);
      const parts = parsedUrl.pathname.split("/").filter(Boolean);
      const titleId = parts.at(-1);

      if (titleId && !itemsById.has(titleId)) {
        if (title.length > 50) title = title.substring(0, 50) + '...';
        const coverUrl = getHighResImage(imgSrc);

        itemsById.set(titleId, {
          titleId,
          slug: titleId,
          name: title,
          coverUrl,
          bannerUrl: coverUrl,
          canonicalUrl: href,
          status: "unknown" as const,
          statusLabel: null,
          tags: [],
          latestChapterLabel: null,
          descriptionSnippet: null,
        });
      }
    }
  });

  if (itemsById.size === 0) {
    return emptyPageResult(page);
  }

  return {
    items: [...itemsById.values()],
    page,
    hasNextPage: itemsById.size >= 10,
  };
}

async function search(query: string, page = 1): Promise<SourcePagedResult<SourceTitleSummary>> {
  if (!query.trim()) return emptyPageResult<SourceTitleSummary>(page);

  const html = await fetchHtml(
    new URL(`/ajax/search?keyword=${encodeURIComponent(query)}`, BASE_URL).toString(),
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "X-Requested-With": "XMLHttpRequest",
      },
    }
  );
  const $ = load(html);
  const itemsById = new Map<string, SourceTitleSummary>();

  $('a').each((_, el) => {
    const href = toAbsoluteUrl(BASE_URL, $(el).attr('href'));
    if (href && href.includes('/series/')) {
      let title = trimText($(el).find('h4').first().text());
      const imgSrc = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');

      if (title && imgSrc && !itemsById.has(href)) {
        const parsedUrl = new URL(href);
        const parts = parsedUrl.pathname.split("/").filter(Boolean);
        const titleId = parts.at(-1);

        if (titleId && !itemsById.has(titleId)) {
          if (title.length > 50) title = title.substring(0, 50) + '...';
          const coverUrl = getHighResImage(imgSrc);

          itemsById.set(titleId, {
            titleId,
            slug: titleId,
            name: title,
            coverUrl,
            bannerUrl: coverUrl,
            canonicalUrl: href,
            status: "unknown" as const,
            statusLabel: null,
            tags: [],
            latestChapterLabel: null,
            descriptionSnippet: null,
          });
        }
      }
    }
  });

  return {
    items: [...itemsById.values()],
    page,
    hasNextPage: false,
  };
}

async function getTitleDetails(titleId: string): Promise<SourceTitleDetails> {
  const url = new URL(`/series/${titleId}`, BASE_URL).toString();
  const $ = await fetchCheerio(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });

  const name = trimText($('h1').first().text()) || trimText($('.tt').first().text());
  
  let coverUrl = getHighResImage($('.comic-cover img').attr('src') || $('.limit img').attr('src') || $('img').first().attr('src'));
  
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    if (src && src.includes('/images/manga/')) {
      coverUrl = getHighResImage(src);
    }
  });
  
  let status = 'Unknown';
  let author = 'Unknown';
  let artist = 'Unknown';
  const genres: string[] = [];
  let description = '';
  
  $('p, div.summary, div.desc, div.info-desc, span').each((_, el) => {
    const text = trimText($(el).text());
    if (text.length > 150 && text.length < 2000 && !text.includes('{') && !description) {
      if (text.length > 100 && !text.includes('الرئيسية قائمة المانغا')) {
        description = text;
      }
    }
  });

  let originalLanguage: string | null = null;

  $('.full-list-info').each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes('الحالة:')) status = text.replace('الحالة:', '').trim();
    if (text.includes('الرسام:')) artist = text.replace('الرسام:', '').trim();
    if (text.includes('النوع:')) {
      originalLanguage = text.replace('النوع:', '').trim();
    }
  });

  // Extract actual genres
  $('a.subtitle').each((_, el) => {
    const tag = trimText($(el).text());
    if (tag && !genres.includes(tag)) genres.push(tag);
  });
  
  if (status === 'Unknown' && $.html().includes('مستمرة')) status = 'مستمرة';

  const mappedStatus = /(مستمر|مستمرة|ongoing)/i.test(status) ? 'ongoing' : /(مكتمل|complete)/i.test(status) ? 'completed' : 'unknown';

  return {
    titleId,
    slug: titleId,
    name,
    coverUrl,
    bannerUrl: coverUrl,
    canonicalUrl: url,
    status: mappedStatus,
    statusLabel: status !== 'Unknown' ? status : null,
    tags: genres.slice(0, 10),
    latestChapterLabel: null,
    descriptionSnippet: description,
    description: description || null,
    authors: author !== 'Unknown' ? [author] : [],
    artists: artist !== 'Unknown' ? [artist] : [],
    originalLanguage,
    sourceLabel: "Olympus Staff",
  };
}

async function listChapters(titleId: string): Promise<SourceChapterSummary[]> {
  const chaptersById = new Map<string, SourceChapterSummary>();
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage && page <= 8) {
    const url = new URL(`/series/${titleId}`, BASE_URL);
    if (page > 1) {
      url.searchParams.set("page", String(page));
    }

    const $ = await fetchCheerio(url.toString(), { headers: { 'User-Agent': 'Mozilla/5.0' } });

    $('a[href]').each((_, el) => {
      const href = toAbsoluteUrl(BASE_URL, $(el).attr('href'));
      if (!href || !href.includes(`/series/${titleId}/`)) return;

      const parsedUrl = new URL(href);
      const parts = parsedUrl.pathname.split("/").filter(Boolean);
      
      if (parts.length < 3 || parts[1] !== titleId) return;

      const chapterId = parts.at(-1);
      if (!chapterId || chapterId.includes('?')) return;

      const chapterNumberMatch = chapterId.match(/(\d+(\.\d+)?)/);
      const chapterNumber = chapterNumberMatch ? Number.parseFloat(chapterNumberMatch[1]) : null;

      if (!chaptersById.has(chapterId)) {
        chaptersById.set(chapterId, {
          chapterId,
          title: `الفصل ${chapterNumber ?? chapterId}`,
          chapterNumber,
          volumeNumber: null,
          groupName: "Olympus Staff",
          releaseDate: null,
          canonicalUrl: href,
          availability: "readable" as const,
          availabilityLabel: "Readable",
        });
      }
    });

    hasNextPage = $(`a.page-link[href*="page=${page + 1}"]`).length > 0;
    page += 1;
  }

  return [...chaptersById.values()].sort((a, b) => (b.chapterNumber ?? 0) - (a.chapterNumber ?? 0));
}

async function getChapterPages(titleId: string, chapterId: string): Promise<SourceChapterPage[]> {
  const chapterUrl = new URL(`/series/${titleId}/${chapterId}`, BASE_URL).toString();
  const $ = await fetchCheerio(chapterUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const images: string[] = [];
  
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    const fullUrl = toAbsoluteUrl(BASE_URL, src);
    if (fullUrl && (fullUrl.includes('/uploads/manga_') || fullUrl.includes('chapter'))) {
      if (!images.includes(fullUrl)) images.push(fullUrl);
    }
  });

  if (images.length === 0) {
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && !src.includes('logo') && !src.includes('avatar') && !src.includes('icon') && !src.includes('banner')) {
        const absolute = toAbsoluteUrl(BASE_URL, src);
        if (absolute && !images.includes(absolute)) {
          images.push(absolute);
        }
      }
    });
  }

  return images.map((imageUrl, index) => ({
    pageIndex: index,
    imageUrl,
  }));
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
