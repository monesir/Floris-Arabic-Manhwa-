import {
  AZORA_SOURCE_RECORD,
  BUILT_IN_PLUGIN_RECORD,
  OLYMPUS_SOURCE_RECORD,
} from "@contracts/plugin";
import { deriveTitleActions, type SourceRuntimeContract } from "@contracts/source";
import { azoraSourceRuntime } from "@services/sources/azora-source";
import { olympusSourceRuntime } from "@services/sources/olympus-source";

export const builtInSourceRuntimes: SourceRuntimeContract[] = [
  azoraSourceRuntime,
  olympusSourceRuntime,
];

export const builtInPluginRuntime = {
  plugin: BUILT_IN_PLUGIN_RECORD,
  sources: [
    {
      registry: AZORA_SOURCE_RECORD,
      runtime: azoraSourceRuntime,
      actions: deriveTitleActions(AZORA_SOURCE_RECORD.capabilities),
    },
    {
      registry: OLYMPUS_SOURCE_RECORD,
      runtime: olympusSourceRuntime,
      actions: deriveTitleActions(OLYMPUS_SOURCE_RECORD.capabilities),
    },
  ],
};
