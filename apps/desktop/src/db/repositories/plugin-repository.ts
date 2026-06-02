import type { DatabaseSync } from "node:sqlite";
import type { PluginEntryType, PluginRegistryRecord } from "@contracts/plugin";

export class PluginRepository {
  constructor(private readonly database: DatabaseSync) {}

  upsert(record: PluginRegistryRecord) {
    const timestamp = new Date().toISOString();

    this.database
      .prepare(
        `
          INSERT INTO plugin_registry (
            plugin_id,
            name,
            version,
            entry_type,
            status,
            failure_reason,
            plugin_directory,
            manifest_path,
            entry_file,
            runtime_mode,
            compatibility_status,
            compatibility_reason,
            loaded_source_count,
            created_at,
            updated_at
          )
          VALUES (
            @pluginId,
            @name,
            @version,
            @entryType,
            @status,
            @failureReason,
            @pluginDirectory,
            @manifestPath,
            @entryFile,
            @runtimeMode,
            @compatibilityStatus,
            @compatibilityReason,
            @loadedSourceCount,
            @createdAt,
            @updatedAt
          )
          ON CONFLICT(plugin_id) DO UPDATE SET
            name = excluded.name,
            version = excluded.version,
            entry_type = excluded.entry_type,
            status = excluded.status,
            failure_reason = excluded.failure_reason,
            plugin_directory = excluded.plugin_directory,
            manifest_path = excluded.manifest_path,
            entry_file = excluded.entry_file,
            runtime_mode = excluded.runtime_mode,
            compatibility_status = excluded.compatibility_status,
            compatibility_reason = excluded.compatibility_reason,
            loaded_source_count = excluded.loaded_source_count,
            updated_at = excluded.updated_at
        `,
      )
      .run({
        ...record,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
  }

  deleteUnreferencedByEntryType(entryType: PluginEntryType) {
    this.database
      .prepare(
        `
          DELETE FROM plugin_registry
          WHERE entry_type = ?
            AND NOT EXISTS (
              SELECT 1
              FROM source_registry
              WHERE source_registry.plugin_id = plugin_registry.plugin_id
            )
        `,
      )
      .run(entryType);
  }

  deleteExternalPluginsExcept(pluginIds: string[]) {
    if (pluginIds.length === 0) {
      this.database
        .prepare(
          `
            DELETE FROM plugin_registry
            WHERE entry_type = 'external'
          `,
        )
        .run();
      return;
    }

    const placeholders = pluginIds.map(() => "?").join(", ");
    this.database
      .prepare(
        `
          DELETE FROM plugin_registry
          WHERE entry_type = 'external'
            AND plugin_id NOT IN (${placeholders})
        `,
      )
      .run(...pluginIds);
  }

  listAll(): PluginRegistryRecord[] {
    const rows = this.database
      .prepare(
        `
          SELECT
            plugin_id AS pluginId,
            name,
            version,
            entry_type AS entryType,
            status,
            failure_reason AS failureReason,
            plugin_directory AS pluginDirectory,
            manifest_path AS manifestPath,
            entry_file AS entryFile,
            runtime_mode AS runtimeMode,
            compatibility_status AS compatibilityStatus,
            compatibility_reason AS compatibilityReason,
            loaded_source_count AS loadedSourceCount
          FROM plugin_registry
          ORDER BY entry_type ASC, plugin_id ASC
        `,
      )
      .all();

    return rows as PluginRegistryRecord[];
  }
}
