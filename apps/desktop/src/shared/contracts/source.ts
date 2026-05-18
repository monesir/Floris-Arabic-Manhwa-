export type SourceCapability =
  | "browse"
  | "search"
  | "title_details"
  | "chapter_list"
  | "chapter_pages"
  | "downloads";

export type SourceCapabilityMap = Record<SourceCapability, boolean>;

export type SourceTitleStatus = "ongoing" | "completed" | "hiatus" | "cancelled" | "unknown";
export type SourceChapterAvailability = "readable" | "locked" | "unavailable";

export type SourceMetadata = {
  pluginId: string;
  sourceId: string;
  displayName: string;
  language: string;
  baseUrl: string;
};

export type SourceTitleSummary = {
  titleId: string;
  slug: string;
  name: string;
  coverUrl: string | null;
  bannerUrl: string | null;
  canonicalUrl: string;
  status: SourceTitleStatus;
  statusLabel: string | null;
  tags: string[];
  latestChapterLabel: string | null;
  descriptionSnippet: string | null;
};

export type SourceTitleDetails = SourceTitleSummary & {
  description: string | null;
  authors: string[];
  artists: string[];
  originalLanguage: string | null;
  sourceLabel: string | null;
};

export type SourceChapterSummary = {
  chapterId: string;
  title: string;
  chapterNumber: number | null;
  volumeNumber: number | null;
  groupName: string | null;
  releaseDate: string | null;
  canonicalUrl: string;
  availability: SourceChapterAvailability;
  availabilityLabel: string | null;
};

export type SourceChapterPage = {
  pageIndex: number;
  imageUrl: string;
};

export type SourcePagedResult<T> = {
  items: T[];
  page: number;
  hasNextPage: boolean;
};

export type SourceRuntimeContract = {
  metadata: SourceMetadata;
  capabilities: SourceCapabilityMap;
  browse?: (page: number) => Promise<SourcePagedResult<SourceTitleSummary>>;
  search?: (query: string, page?: number) => Promise<SourcePagedResult<SourceTitleSummary>>;
  getTitleDetails?: (titleId: string) => Promise<SourceTitleDetails>;
  listChapters?: (titleId: string) => Promise<SourceChapterSummary[]>;
  getChapterPages?: (titleId: string, chapterId: string) => Promise<SourceChapterPage[]>;
};

export type DerivedTitleActions = {
  canBrowse: boolean;
  canSearch: boolean;
  canViewTitle: boolean;
  canReadChapters: boolean;
  canDownload: boolean;
};

export function deriveTitleActions(capabilities: SourceCapabilityMap): DerivedTitleActions {
  return {
    canBrowse: capabilities.browse,
    canSearch: capabilities.search,
    canViewTitle: capabilities.title_details,
    canReadChapters: capabilities.chapter_list && capabilities.chapter_pages,
    canDownload: capabilities.downloads,
  };
}

export const EMPTY_SOURCE_CAPABILITIES: SourceCapabilityMap = {
  browse: false,
  search: false,
  title_details: false,
  chapter_list: false,
  chapter_pages: false,
  downloads: false,
};

export type SourceCatalogItem = {
  metadata: SourceMetadata;
  capabilities: SourceCapabilityMap;
  actions: DerivedTitleActions;
};
