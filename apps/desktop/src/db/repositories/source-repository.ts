import type { DatabaseSync } from "node:sqlite";
import type { SourceRegistryRecord } from "@contracts/plugin";

export class SourceRepository {
  constructor(private readonly database: DatabaseSync) {}

  upsert(record: SourceRegistryRecord) {
    const timestamp = new Date().toISOString();

    this.database
      .prepare(
        `
          INSERT INTO source_registry (
            source_id,
            plugin_id,
            display_name,
            capabilities_json,
            created_at,
            updated_at
          )
          VALUES (@sourceId, @pluginId, @displayName, @capabilitiesJson, @createdAt, @updatedAt)
          ON CONFLICT(source_id) DO UPDATE SET
            plugin_id = excluded.plugin_id,
            display_name = excluded.display_name,
            capabilities_json = excluded.capabilities_json,
            updated_at = excluded.updated_at
        `,
      )
      .run({
        sourceId: record.sourceId,
        pluginId: record.pluginId,
        displayName: record.displayName,
        capabilitiesJson: JSON.stringify(record.capabilities),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
  }
}
