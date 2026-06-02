import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import type {
  ExternalPluginManifest,
  ExternalPluginRuntimeModule,
  ExternalSourceRuntimeHandlers,
  PluginRegistryRecord,
  SourceRegistryRecord,
} from "@contracts/plugin";
import {
  externalPluginManifestSchema,
} from "@contracts/plugin";
import { deriveTitleActions, type SourceCapability, type SourceRuntimeContract } from "@contracts/source";

type DiscoveryRecord = {
  plugin: PluginRegistryRecord;
  sources: SourceRegistryRecord[];
  runtimes: Array<{
    registry: SourceRegistryRecord;
    runtime: SourceRuntimeContract;
    actions: ReturnType<typeof deriveTitleActions>;
  }>;
};

const MANIFEST_FILE_NAME = "plugin.json";
const SUPPORTED_PLUGIN_API_VERSION = "1";
const SUPPORTED_APP_VERSION = "0.1.0";

const capabilityHandlerMap: Record<SourceCapability, keyof ExternalSourceRuntimeHandlers> = {
  browse: "browse",
  search: "search",
  title_details: "getTitleDetails",
  chapter_list: "listChapters",
  chapter_pages: "getChapterPages",
  downloads: "getChapterPages",
};

function createPluginRecord(
  input: Partial<PluginRegistryRecord> & Pick<PluginRegistryRecord, "pluginId" | "name" | "version" | "entryType" | "status">,
): PluginRegistryRecord {
  return {
    failureReason: null,
    pluginDirectory: null,
    manifestPath: null,
    entryFile: null,
    runtimeMode: "manifest-only",
    compatibilityStatus: "unknown",
    compatibilityReason: null,
    loadedSourceCount: 0,
    ...input,
  };
}

function parseManifestJson(rawManifest: string) {
  const normalized = rawManifest.replace(/^\uFEFF/, "");
  return JSON.parse(normalized);
}

function toInvalidPluginRecord(
  pluginId: string,
  failureReason: string,
  pluginDirectory: string | null,
  manifestPath: string | null,
): DiscoveryRecord {
  return {
    plugin: createPluginRecord({
      pluginId,
      name: pluginId,
      version: "0.0.0",
      entryType: "external",
      status: "invalid",
      failureReason,
      pluginDirectory,
      manifestPath,
      compatibilityStatus: "unknown",
    }),
    sources: [],
    runtimes: [],
  };
}

function toSourceRecord(manifest: ExternalPluginManifest, source: ExternalPluginManifest["sources"][number]): SourceRegistryRecord {
  return {
    pluginId: manifest.plugin_id,
    sourceId: source.source_id,
    displayName: source.display_name,
    language: source.language,
    baseUrl: source.base_url,
    capabilities: source.capabilities,
  };
}

function parseVersion(version: string) {
  const match = version.trim().match(/^(\d+)\.(\d+)\.(\d+)$/);

  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function checkAppCompatibility(requestedVersion: string, currentVersion: string) {
  if (requestedVersion === "*" || requestedVersion === currentVersion) {
    return { compatible: true, reason: null };
  }

  if (requestedVersion.startsWith("^")) {
    const base = parseVersion(requestedVersion.slice(1));
    const current = parseVersion(currentVersion);

    if (base && current && base.major === current.major && current.minor >= base.minor) {
      return { compatible: true, reason: null };
    }
  }

  if (requestedVersion.startsWith("~")) {
    const base = parseVersion(requestedVersion.slice(1));
    const current = parseVersion(currentVersion);

    if (
      base &&
      current &&
      base.major === current.major &&
      base.minor === current.minor &&
      current.patch >= base.patch
    ) {
      return { compatible: true, reason: null };
    }
  }

  return {
    compatible: false,
    reason: `Requires app version ${requestedVersion}, current app is ${currentVersion}.`,
  };
}

function isPathInsideRoot(rootPath: string, candidatePath: string) {
  const root = resolve(rootPath);
  const candidate = resolve(candidatePath);
  const relativePath = relative(root, candidate);

  return relativePath !== "" && !relativePath.startsWith(`..${sep}`) && relativePath !== "..";
}

function validatePluginApiVersion(pluginApiVersion: string) {
  if (pluginApiVersion !== SUPPORTED_PLUGIN_API_VERSION) {
    return {
      compatible: false,
      reason: `Requires plugin API ${pluginApiVersion}, current plugin API is ${SUPPORTED_PLUGIN_API_VERSION}.`,
    };
  }

  return { compatible: true, reason: null };
}

function resolveEntryPath(pluginRoot: string, entryFile: string) {
  const absolutePath = resolve(pluginRoot, entryFile);

  if (!existsSync(absolutePath)) {
    throw new Error(`Entry file does not exist: ${entryFile}`);
  }

  if (!isPathInsideRoot(pluginRoot, absolutePath)) {
    throw new Error(`Entry file escapes plugin root: ${entryFile}`);
  }

  return absolutePath;
}

async function importRuntimeModule(entryPath: string) {
  const entryUrl = `${pathToFileURL(entryPath).href}?mtime=${statSync(entryPath).mtimeMs}`;
  const imported = (await import(entryUrl)) as ExternalPluginRuntimeModule & {
    default?: ExternalPluginRuntimeModule;
  };

  return imported.sourceHandlers
    ? imported
    : imported.default?.sourceHandlers
      ? imported.default
      : null;
}

function buildRuntimeRecord(
  manifest: ExternalPluginManifest,
  source: ExternalPluginManifest["sources"][number],
  handlers: ExternalSourceRuntimeHandlers,
) {
  for (const [capability, enabled] of Object.entries(source.capabilities) as Array<[SourceCapability, boolean]>) {
    if (!enabled) {
      continue;
    }

    const requiredHandlerName = capabilityHandlerMap[capability];

    if (!handlers[requiredHandlerName]) {
      throw new Error(`Source ${source.source_id} is missing handler ${requiredHandlerName} for capability ${capability}.`);
    }
  }

  const registry = toSourceRecord(manifest, source);
  const runtime: SourceRuntimeContract = {
    metadata: {
      pluginId: manifest.plugin_id,
      sourceId: source.source_id,
      displayName: source.display_name,
      language: source.language,
      baseUrl: source.base_url,
    },
    capabilities: source.capabilities,
    browse: handlers.browse,
    search: handlers.search,
    getTitleDetails: handlers.getTitleDetails,
    listChapters: handlers.listChapters,
    getChapterPages: handlers.getChapterPages,
  };

  return {
    registry,
    runtime,
    actions: deriveTitleActions(source.capabilities),
  };
}

export function getExternalPluginsDirectory(userDataPath: string) {
  const directoryPath = join(userDataPath, "plugins");
  mkdirSync(directoryPath, { recursive: true });

  return directoryPath;
}

async function loadManifestRuntime(
  manifest: ExternalPluginManifest,
  pluginRoot: string,
  entryPath: string,
) {
  const moduleExports = await importRuntimeModule(entryPath);

  if (!moduleExports?.sourceHandlers) {
    throw new Error("Entry module must export `sourceHandlers`.");
  }

  const runtimes = manifest.sources.map((source) => {
    const handlers = moduleExports.sourceHandlers?.[source.source_id];

    if (!handlers) {
      throw new Error(`Entry module does not export handlers for source ${source.source_id}.`);
    }

    return buildRuntimeRecord(manifest, source, handlers);
  });

  return {
    plugin: createPluginRecord({
      pluginId: manifest.plugin_id,
      name: manifest.name,
      version: manifest.version,
      entryType: "external",
      status: "ready",
      pluginDirectory: pluginRoot,
      manifestPath: join(pluginRoot, MANIFEST_FILE_NAME),
      entryFile: entryPath,
      runtimeMode: "source-runtime",
      compatibilityStatus: "compatible",
      compatibilityReason: null,
      loadedSourceCount: runtimes.length,
    }),
    sources: manifest.sources.map((source) => toSourceRecord(manifest, source)),
    runtimes,
  } satisfies DiscoveryRecord;
}

function buildManifestOnlyRecord(manifest: ExternalPluginManifest, pluginRoot: string): DiscoveryRecord {
  return {
    plugin: createPluginRecord({
      pluginId: manifest.plugin_id,
      name: manifest.name,
      version: manifest.version,
      entryType: "external",
      status: "disabled",
      pluginDirectory: pluginRoot,
      manifestPath: join(pluginRoot, MANIFEST_FILE_NAME),
      entryFile: null,
      runtimeMode: "manifest-only",
      compatibilityStatus: "compatible",
      compatibilityReason: "Manifest is valid, but no runtime entry file was declared.",
      loadedSourceCount: 0,
    }),
    sources: manifest.sources.map((source) => toSourceRecord(manifest, source)),
    runtimes: [],
  };
}

export async function discoverExternalPlugins(userDataPath: string, currentAppVersion = SUPPORTED_APP_VERSION) {
  const directoryPath = getExternalPluginsDirectory(userDataPath);
  const directoryEntries = readdirSync(directoryPath, { withFileTypes: true });
  const discovered: DiscoveryRecord[] = [];

  for (const entry of directoryEntries.filter((directoryEntry) => directoryEntry.isDirectory())) {
    const pluginRoot = join(directoryPath, entry.name);
    const manifestPath = join(pluginRoot, MANIFEST_FILE_NAME);

    try {
        const rawManifest = readFileSync(manifestPath, "utf8");
        const manifest = externalPluginManifestSchema.parse(parseManifestJson(rawManifest));
      const appCompatibility = checkAppCompatibility(manifest.app_version, currentAppVersion);
      const apiCompatibility = validatePluginApiVersion(manifest.plugin_api_version);

      if (!appCompatibility.compatible || !apiCompatibility.compatible) {
        discovered.push({
          plugin: createPluginRecord({
            pluginId: manifest.plugin_id,
            name: manifest.name,
            version: manifest.version,
            entryType: "external",
            status: "incompatible",
            pluginDirectory: pluginRoot,
            manifestPath,
            entryFile: manifest.entry_file ? resolve(pluginRoot, manifest.entry_file) : null,
            runtimeMode: manifest.entry_file ? "source-runtime" : "manifest-only",
            compatibilityStatus: "incompatible",
            compatibilityReason: appCompatibility.reason ?? apiCompatibility.reason,
            loadedSourceCount: 0,
          }),
          sources: manifest.sources.map((source) => toSourceRecord(manifest, source)),
          runtimes: [],
        });
        continue;
      }

      if (!manifest.entry_file) {
        discovered.push(buildManifestOnlyRecord(manifest, pluginRoot));
        continue;
      }

      const entryPath = resolveEntryPath(pluginRoot, manifest.entry_file);
      discovered.push(await loadManifestRuntime(manifest, pluginRoot, entryPath));
    } catch (error) {
      const failureReason =
        error instanceof z.ZodError
          ? `Manifest validation failed: ${error.issues[0]?.message ?? "unknown issue"}`
          : error instanceof Error
            ? `Plugin load failed: ${error.message}`
            : "Plugin load failed.";

      discovered.push(toInvalidPluginRecord(`external.${entry.name}`, failureReason, pluginRoot, manifestPath));
    }
  }

  return discovered;
}
