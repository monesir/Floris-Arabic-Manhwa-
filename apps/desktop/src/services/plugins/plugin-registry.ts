import { getDatabase } from "@db/database";
import { PluginRepository } from "@db/repositories/plugin-repository";
import { SourceRepository } from "@db/repositories/source-repository";
import {
  type PluginListItem,
} from "@contracts/plugin";
import { deriveTitleActions } from "@contracts/source";
import { builtInPluginRuntime } from "@plugins/builtins/placeholder-plugin";
import {
  discoverExternalPlugins,
  getExternalPluginsDirectory,
} from "@services/plugins/plugin-discovery";

export function bootstrapPluginRegistry(userDataPath: string) {
  const database = getDatabase();
  const pluginRepository = new PluginRepository(database);
  const sourceRepository = new SourceRepository(database);
  const externalPlugins = discoverExternalPlugins(userDataPath);

  pluginRepository.upsert(builtInPluginRuntime.plugin);
  for (const source of builtInPluginRuntime.sources) {
    sourceRepository.upsert(source.registry);
  }

  pluginRepository.deleteByEntryType("external");

  for (const externalPlugin of externalPlugins) {
    pluginRepository.upsert(externalPlugin.plugin);
    for (const source of externalPlugin.sources) {
      sourceRepository.upsert(source);
    }
  }
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
