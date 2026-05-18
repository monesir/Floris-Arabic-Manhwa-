import { load } from "cheerio";
import type {
  SourceChapterAvailability,
  SourcePagedResult,
  SourceTitleStatus,
} from "@contracts/source";

const DEFAULT_HEADERS: HeadersInit = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  "accept-language": "ar,en-US;q=0.9,en;q=0.8",
};

export async function fetchHtml(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...DEFAULT_HEADERS,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

export async function fetchCheerio(url: string, init?: RequestInit) {
  const html = await fetchHtml(url, init);
  return load(html);
}

export function toAbsoluteUrl(baseUrl: string, value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

export function extractNumericSuffix(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(/(\d+(?:\.\d+)?)(?!.*\d)/);
  return match ? Number(match[1]) : null;
}

export function parseTitleStatus(value: string | null | undefined): SourceTitleStatus {
  const normalized = (value ?? "").trim().toLowerCase();

  if (!normalized) {
    return "unknown";
  }

  if (/(مستمر|ongoing|active)/.test(normalized)) {
    return "ongoing";
  }

  if (/(مكتمل|completed|complete|finished)/.test(normalized)) {
    return "completed";
  }

  if (/(متوقف|توقف|hiatus|paused)/.test(normalized)) {
    return "hiatus";
  }

  if (/(ملغي|cancelled|canceled|dropped)/.test(normalized)) {
    return "cancelled";
  }

  return "unknown";
}

export function parseChapterAvailability(
  value: string | null | undefined,
  classNames: string[] = [],
): SourceChapterAvailability {
  const haystack = `${value ?? ""} ${classNames.join(" ")}`.toLowerCase();

  if (/(lock|locked|مقفول|مغلق|purchase|coin|premium|paid)/.test(haystack)) {
    return "locked";
  }

  if (/(unavailable|missing|coming soon|soon)/.test(haystack)) {
    return "unavailable";
  }

  return "readable";
}

export function emptyPageResult<T>(page: number): SourcePagedResult<T> {
  return {
    items: [],
    page,
    hasNextPage: false,
  };
}

export function trimText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}
