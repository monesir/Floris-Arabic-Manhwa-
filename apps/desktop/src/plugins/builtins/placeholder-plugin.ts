import {
  BUILT_IN_PLUGIN_RECORD,
  PLACEHOLDER_SOURCE_METADATA,
  PLACEHOLDER_SOURCE_RECORD,
} from "@contracts/plugin";
import { deriveTitleActions, type SourceRuntimeContract } from "@contracts/source";

export const placeholderSourceRuntime: SourceRuntimeContract = {
  metadata: PLACEHOLDER_SOURCE_METADATA,
  capabilities: PLACEHOLDER_SOURCE_RECORD.capabilities,
};

export const builtInPluginRuntime = {
  plugin: BUILT_IN_PLUGIN_RECORD,
  sources: [
    {
      registry: PLACEHOLDER_SOURCE_RECORD,
      runtime: placeholderSourceRuntime,
      actions: deriveTitleActions(PLACEHOLDER_SOURCE_RECORD.capabilities),
    },
  ],
};
