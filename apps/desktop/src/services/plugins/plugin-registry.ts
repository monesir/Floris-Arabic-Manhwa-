import { getDatabase } from "@db/database";
import { PluginRepository } from "@db/repositories/plugin-repository";
import { SourceRepository } from "@db/repositories/source-repository";
import {
  type PluginListItem,
  type SourceRegistryRecord,
} from "@contracts/plugin";
import { deriveTitleActions } from "@contracts/source";
import { builtInPluginRuntime } from "@plugins/builtins/placeholder-plugin";
import {
  discoverExternalPlugins,
  getExternalPluginsDirectory,
} from "@services/plugins/plugin-discovery";
import type { SourceRuntimeContract } from "@contracts/source";

let activeExternalSourceRuntimes: Array<{
  registry: SourceRegistryRecord;
  runtime: SourceRuntimeContract;
}> = [];

export async function bootstrapPluginRegistry(userDataPath: string, appVersion: string) {
  const database = getDatabase();
  const pluginRepository = new PluginRepository(database);
  const sourceRepository = new SourceRepository(database);
  const externalPlugins = await discoverExternalPlugins(userDataPath, appVersion);
  activeExternalSourceRuntimes = externalPlugins.flatMap((plugin) =>
    plugin.runtimes.map((runtime) => ({
      registry: runtime.registry,
      runtime: runtime.runtime,
    })),
  );

  sourceRepository.deleteUnreferencedByPluginId(builtInPluginRuntime.plugin.pluginId);
  pluginRepository.upsert(builtInPluginRuntime.plugin);
  for (const source of builtInPluginRuntime.sources) {
    sourceRepository.upsert(source.registry);
  }

  for (const plugin of externalPlugins) {
    sourceRepository.deleteUnreferencedByPluginId(plugin.plugin.pluginId);
  }

  for (const externalPlugin of externalPlugins) {
    pluginRepository.upsert(externalPlugin.plugin);
    for (const source of externalPlugin.sources) {
      sourceRepository.upsert(source);
    }
  }

  pluginRepository.deleteExternalPluginsExcept(
    externalPlugins.map((plugin) => plugin.plugin.pluginId),
  );
}

export function getActiveSourceRuntimes() {
  return [
    ...builtInPluginRuntime.sources.map((source) => source.runtime),
    ...activeExternalSourceRuntimes.map((source) => source.runtime),
  ];
}

export function getPluginRegistryState(userDataPath: string) {
  const database = getDatabase();
  const pluginRepository = new PluginRepository(database);
  const sourceRepository = new SourceRepository(database);
  const plugins = pluginRepository.listAll();
  const sources = sourceRepository.listAll();
  const pluginDirectory = getExternalPluginsDirectory(userDataPath);

  const pluginItems: PluginListItem[] = plugins.map((plugin) => ({
    ...plugin,
    sources: sources
      .filter((source) => source.pluginId === plugin.pluginId)
      .map((source) => ({
        ...source,
        actions: deriveTitleActions(source.capabilities),
      })),
  }));

  return {
    pluginDirectory,
    plugins: pluginItems,
  };
}

export async function refreshPluginRegistry(userDataPath: string, appVersion: string) {
  await bootstrapPluginRegistry(userDataPath, appVersion);
  return getPluginRegistryState(userDataPath);
}
