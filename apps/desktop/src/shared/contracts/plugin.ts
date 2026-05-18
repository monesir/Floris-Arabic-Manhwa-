export type PluginEntryType = "built-in" | "external";
export type PluginStatus = "ready" | "invalid" | "disabled";
export type SourceCapability =
  | "browse"
  | "search"
  | "title_details"
  | "chapter_list"
  | "chapter_pages"
  | "downloads";

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
  capabilities: Partial<Record<SourceCapability, boolean>>;
};

export const BUILT_IN_PLUGIN_ID = "core.builtin";
export const PLACEHOLDER_SOURCE_ID = "core.placeholder";

export const BUILT_IN_PLUGIN_RECORD: PluginRegistryRecord = {
  pluginId: BUILT_IN_PLUGIN_ID,
  name: "FloirsMNH Built-ins",
  version: "0.1.0",
  entryType: "built-in",
  status: "ready",
  failureReason: null,
};

export const PLACEHOLDER_SOURCE_RECORD: SourceRegistryRecord = {
  sourceId: PLACEHOLDER_SOURCE_ID,
  pluginId: BUILT_IN_PLUGIN_ID,
  displayName: "Placeholder Source",
  capabilities: {
    browse: false,
    search: false,
    title_details: false,
    chapter_list: false,
    chapter_pages: false,
    downloads: false,
  },
};

