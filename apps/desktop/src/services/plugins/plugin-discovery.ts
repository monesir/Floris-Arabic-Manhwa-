import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { ExternalPluginManifest, PluginRegistryRecord, SourceRegistryRecord } from "@contracts/plugin";
import {
  externalPluginManifestSchema,
} from "@contracts/plugin";

type DiscoveryRecord = {
  plugin: PluginRegistryRecord;
  sources: SourceRegistryRecord[];
};

const MANIFEST_FILE_NAME = "plugin.json";

function toInvalidPluginRecord(pluginId: string, failureReason: string): DiscoveryRecord {
  return {
    plugin: {
      pluginId,
      name: pluginId,
      version: "0.0.0",
      entryType: "external",
      status: "invalid",
      failureReason,
    },
    sources: [],
  };
}

function toValidatedPluginRecord(manifest: ExternalPluginManifest): DiscoveryRecord {
  return {
    plugin: {
      pluginId: manifest.plugin_id,
      name: manifest.name,
      version: manifest.version,
      entryType: "external",
      status: "disabled",
      failureReason: null,
    },
    sources: manifest.sources.map((source) => ({
      pluginId: manifest.plugin_id,
      sourceId: source.source_id,
      displayName: source.display_name,
      capabilities: source.capabilities,
    })),
  };
}

export function getExternalPluginsDirectory(userDataPath: string) {
  const directoryPath = join(userDataPath, "plugins");
  mkdirSync(directoryPath, { recursive: true });

  return directoryPath;
}

export function discoverExternalPlugins(userDataPath: string): DiscoveryRecord[] {
  const directoryPath = getExternalPluginsDirectory(userDataPath);
  const directoryEntries = readdirSync(directoryPath, { withFileTypes: true });

  return directoryEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const pluginRoot = join(directoryPath, entry.name);
      const manifestPath = join(pluginRoot, MANIFEST_FILE_NAME);

      try {
        const rawManifest = readFileSync(manifestPath, "utf8");
        const manifest = externalPluginManifestSchema.parse(JSON.parse(rawManifest));

        return toValidatedPluginRecord(manifest);
      } catch (error) {
        const failureReason =
          error instanceof z.ZodError
            ? `Manifest validation failed: ${error.issues[0]?.message ?? "unknown issue"}`
            : error instanceof Error
              ? `Manifest load failed: ${error.message}`
              : "Manifest load failed.";

        return toInvalidPluginRecord(`external.${entry.name}`, failureReason);
      }
    });
}

