import {
  AZORA_SOURCE_RECORD,
  BUILT_IN_PLUGIN_RECORD,
  LOCAL_IMPORTS_SOURCE_RECORD,
  MANGASWAT_SOURCE_RECORD,
  OLYMPUS_SOURCE_RECORD,
} from "@contracts/plugin";
import { deriveTitleActions, type SourceRuntimeContract } from "@contracts/source";
import { azoraSourceRuntime } from "@services/sources/azora-source";
import { localImportsSourceRuntime } from "@services/sources/local-imports-source";
import { mangaswatSourceRuntime } from "@services/sources/mangaswat-source";
import { olympusSourceRuntime } from "@services/sources/olympus-source";

export const builtInSourceRuntimes: SourceRuntimeContract[] = [
  azoraSourceRuntime,
  olympusSourceRuntime,
  mangaswatSourceRuntime,
  localImportsSourceRuntime,
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
    {
      registry: MANGASWAT_SOURCE_RECORD,
      runtime: mangaswatSourceRuntime,
      actions: deriveTitleActions(MANGASWAT_SOURCE_RECORD.capabilities),
    },
    {
      registry: LOCAL_IMPORTS_SOURCE_RECORD,
      runtime: localImportsSourceRuntime,
      actions: deriveTitleActions(LOCAL_IMPORTS_SOURCE_RECORD.capabilities),
    },
  ],
};
