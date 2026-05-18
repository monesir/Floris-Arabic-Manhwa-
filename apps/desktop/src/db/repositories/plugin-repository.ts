import type { DatabaseSync } from "node:sqlite";
import type { PluginRegistryRecord } from "@contracts/plugin";

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
            created_at,
            updated_at
          )
          VALUES (@pluginId, @name, @version, @entryType, @status, @failureReason, @createdAt, @updatedAt)
          ON CONFLICT(plugin_id) DO UPDATE SET
            name = excluded.name,
            version = excluded.version,
            entry_type = excluded.entry_type,
            status = excluded.status,
            failure_reason = excluded.failure_reason,
            updated_at = excluded.updated_at
        `,
      )
      .run({
        ...record,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
  }
}
