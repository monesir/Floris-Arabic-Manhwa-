export type SourceCapability =
  | "browse"
  | "search"
  | "title_details"
  | "chapter_list"
  | "chapter_pages"
  | "downloads";

export type SourceCapabilityMap = Record<SourceCapability, boolean>;

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
};

export type SourceTitleDetails = SourceTitleSummary & {
  description: string | null;
  tags: string[];
  status: "ongoing" | "completed" | "hiatus" | "unknown";
};

export type SourceChapterSummary = {
  chapterId: string;
  title: string;
  chapterNumber: number | null;
  volumeNumber: number | null;
  groupName: string | null;
};

export type SourceChapterPage = {
  pageIndex: number;
  imageUrl: string;
};

export type SourceRuntimeContract = {
  metadata: SourceMetadata;
  capabilities: SourceCapabilityMap;
  browse?: (page: number) => Promise<SourceTitleSummary[]>;
  search?: (query: string) => Promise<SourceTitleSummary[]>;
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

