import { getDatabase } from "@db/database";
import { PluginRepository } from "@db/repositories/plugin-repository";
import { SourceRepository } from "@db/repositories/source-repository";
import {
  BUILT_IN_PLUGIN_RECORD,
  PLACEHOLDER_SOURCE_RECORD,
} from "@contracts/plugin";

export function bootstrapPluginRegistry() {
  const database = getDatabase();
  const pluginRepository = new PluginRepository(database);
  const sourceRepository = new SourceRepository(database);

  pluginRepository.upsert(BUILT_IN_PLUGIN_RECORD);
  sourceRepository.upsert(PLACEHOLDER_SOURCE_RECORD);
}
