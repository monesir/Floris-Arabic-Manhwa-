import { z } from "zod";
import {
  EMPTY_SOURCE_CAPABILITIES,
  type SourceChapterPage,
  type SourceChapterSummary,
  type DerivedTitleActions,
  type SourcePagedResult,
  type SourceCapabilityMap,
  type SourceMetadata,
  type SourceRuntimeContract,
  type SourceTitleDetails,
  type SourceTitleSummary,
} from "@contracts/source";

export type PluginEntryType = "built-in" | "external";
export type PluginStatus = "ready" | "invalid" | "disabled" | "incompatible";
export type PluginRuntimeMode = "built-in" | "manifest-only" | "source-runtime";
export type PluginCompatibilityStatus = "compatible" | "incompatible" | "unknown";

export type ExternalSourceRuntimeHandlers = {
  browse?: (page: number) => Promise<SourcePagedResult<SourceTitleSummary>>;
  search?: (query: string, page?: number) => Promise<SourcePagedResult<SourceTitleSummary>>;
  getTitleDetails?: (titleId: string) => Promise<SourceTitleDetails>;
  listChapters?: (titleId: string) => Promise<SourceChapterSummary[]>;
  getChapterPages?: (titleId: string, chapterId: string) => Promise<SourceChapterPage[]>;
};

export type ExternalPluginRuntimeModule = {
  sourceHandlers?: Record<string, ExternalSourceRuntimeHandlers>;
};

export type PluginRegistryRecord = {
  pluginId: string;
  name: string;
  version: string;
  entryType: PluginEntryType;
  status: PluginStatus;
  failureReason: string | null;
  pluginDirectory: string | null;
  manifestPath: string | null;
  entryFile: string | null;
  runtimeMode: PluginRuntimeMode;
  compatibilityStatus: PluginCompatibilityStatus;
  compatibilityReason: string | null;
  loadedSourceCount: number;
};

export type SourceRegistryRecord = {
  sourceId: string;
  pluginId: string;
  displayName: string;
  language: string;
  baseUrl: string;
  capabilities: SourceCapabilityMap;
};

export type PluginListItem = PluginRegistryRecord & {
  sources: Array<SourceRegistryRecord & { actions: DerivedTitleActions }>;
};

export const sourceCapabilitiesSchema = z.object({
  browse: z.boolean(),
  search: z.boolean(),
  title_details: z.boolean(),
  chapter_list: z.boolean(),
  chapter_pages: z.boolean(),
  downloads: z.boolean(),
});

export const externalPluginSourceSchema = z.object({
  source_id: z.string().min(1),
  display_name: z.string().min(1),
  language: z.string().min(1).default("unknown"),
  base_url: z.string().url().default("https://example.invalid"),
  capabilities: sourceCapabilitiesSchema.default(EMPTY_SOURCE_CAPABILITIES),
});

export const externalPluginManifestSchema = z.object({
  plugin_id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  app_version: z.string().min(1),
  plugin_api_version: z.string().min(1).default("1"),
  entry_file: z.string().min(1).optional(),
  sources: z.array(externalPluginSourceSchema).default([]),
});

export type ExternalPluginManifest = z.infer<typeof externalPluginManifestSchema>;
export type ExternalPluginRuntimeRecord = {
  registry: SourceRegistryRecord;
  runtime: SourceRuntimeContract;
  actions: DerivedTitleActions;
};

export const BUILT_IN_PLUGIN_ID = "core.builtin";
export const AZORA_SOURCE_ID = "azora.series";
export const OLYMPUS_SOURCE_ID = "olympus.series";
export const MANGASWAT_SOURCE_ID = "mangaswat.series";
export const LOCAL_IMPORTS_SOURCE_ID = "local.imports";

export const BUILT_IN_PLUGIN_RECORD: PluginRegistryRecord = {
  pluginId: BUILT_IN_PLUGIN_ID,
  name: "FloirsMNH Built-ins",
  version: "0.1.0",
  entryType: "built-in",
  status: "ready",
  failureReason: null,
  pluginDirectory: null,
  manifestPath: null,
  entryFile: null,
  runtimeMode: "built-in",
  compatibilityStatus: "compatible",
  compatibilityReason: null,
  loadedSourceCount: 4,
};

export const AZORA_SOURCE_RECORD: SourceRegistryRecord = {
  sourceId: AZORA_SOURCE_ID,
  pluginId: BUILT_IN_PLUGIN_ID,
  displayName: "Azora Manga",
  language: "ar",
  baseUrl: "https://azoramoon.com",
  capabilities: {
    ...EMPTY_SOURCE_CAPABILITIES,
    browse: true,
    search: true,
    title_details: true,
    chapter_list: true,
    chapter_pages: true,
    downloads: true,
  },
};

export const OLYMPUS_SOURCE_RECORD: SourceRegistryRecord = {
  sourceId: OLYMPUS_SOURCE_ID,
  pluginId: BUILT_IN_PLUGIN_ID,
  displayName: "Olympus Staff",
  language: "ar",
  baseUrl: "https://olympustaff.com",
  capabilities: {
    ...EMPTY_SOURCE_CAPABILITIES,
    browse: true,
    search: true,
    title_details: true,
    chapter_list: true,
    chapter_pages: true,
    downloads: true,
  },
};

export const LOCAL_IMPORTS_SOURCE_RECORD: SourceRegistryRecord = {
  sourceId: LOCAL_IMPORTS_SOURCE_ID,
  pluginId: BUILT_IN_PLUGIN_ID,
  displayName: "Local Imports",
  language: "mixed",
  baseUrl: "file://local-imports",
  capabilities: {
    ...EMPTY_SOURCE_CAPABILITIES,
    browse: true,
    search: true,
    title_details: true,
    chapter_list: true,
    chapter_pages: true,
  },
};

export const MANGASWAT_SOURCE_RECORD: SourceRegistryRecord = {
  sourceId: MANGASWAT_SOURCE_ID,
  pluginId: BUILT_IN_PLUGIN_ID,
  displayName: "MangaSwat",
  language: "ar",
  baseUrl: "https://meshmanga.com",
  capabilities: {
    ...EMPTY_SOURCE_CAPABILITIES,
    browse: true,
    search: true,
    title_details: true,
    chapter_list: true,
    chapter_pages: true,
    downloads: true,
  },
};

export const AZORA_SOURCE_METADATA: SourceMetadata = {
  pluginId: BUILT_IN_PLUGIN_ID,
  sourceId: AZORA_SOURCE_ID,
  displayName: "Azora Manga",
  language: "ar",
  baseUrl: "https://azoramoon.com",
};

export const OLYMPUS_SOURCE_METADATA: SourceMetadata = {
  pluginId: BUILT_IN_PLUGIN_ID,
  sourceId: OLYMPUS_SOURCE_ID,
  displayName: "Olympus Staff",
  language: "ar",
  baseUrl: "https://olympustaff.com",
};

export const MANGASWAT_SOURCE_METADATA: SourceMetadata = {
  pluginId: BUILT_IN_PLUGIN_ID,
  sourceId: MANGASWAT_SOURCE_ID,
  displayName: "MangaSwat",
  language: "ar",
  baseUrl: "https://meshmanga.com",
};

export const LOCAL_IMPORTS_SOURCE_METADATA: SourceMetadata = {
  pluginId: BUILT_IN_PLUGIN_ID,
  sourceId: LOCAL_IMPORTS_SOURCE_ID,
  displayName: "Local Imports",
  language: "mixed",
  baseUrl: "file://local-imports",
};
