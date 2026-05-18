import { z } from "zod";
import {
  EMPTY_SOURCE_CAPABILITIES,
  type DerivedTitleActions,
  type SourceCapabilityMap,
  type SourceMetadata,
} from "@contracts/source";

export type PluginEntryType = "built-in" | "external";
export type PluginStatus = "ready" | "invalid" | "disabled";

export type PluginRegistryRecord = {
  pluginId: string;
  name: string;
  version: string;
  entryType: PluginEntryType;
  status: PluginStatus;
  failureReason: string | null;
};

export type SourceRegistryRecord = {
  sourceId: string;
  pluginId: string;
  displayName: string;
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
  sources: z.array(externalPluginSourceSchema).default([]),
});

export type ExternalPluginManifest = z.infer<typeof externalPluginManifestSchema>;

export const BUILT_IN_PLUGIN_ID = "core.builtin";
export const AZORA_SOURCE_ID = "azora.series";
export const OLYMPUS_SOURCE_ID = "olympus.series";

export const BUILT_IN_PLUGIN_RECORD: PluginRegistryRecord = {
  pluginId: BUILT_IN_PLUGIN_ID,
  name: "FloirsMNH Built-ins",
  version: "0.1.0",
  entryType: "built-in",
  status: "ready",
  failureReason: null,
};

export const AZORA_SOURCE_RECORD: SourceRegistryRecord = {
  sourceId: AZORA_SOURCE_ID,
  pluginId: BUILT_IN_PLUGIN_ID,
  displayName: "Azora Manga",
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
