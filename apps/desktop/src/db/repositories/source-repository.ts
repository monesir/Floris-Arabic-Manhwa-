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

  listAll(): SourceRegistryRecord[] {
    const rows = this.database
      .prepare(
        `
          SELECT
            source_id AS sourceId,
            plugin_id AS pluginId,
            display_name AS displayName,
            capabilities_json AS capabilitiesJson
          FROM source_registry
          ORDER BY plugin_id ASC, source_id ASC
        `,
      )
      .all() as Array<{
        sourceId: string;
        pluginId: string;
        displayName: string;
        capabilitiesJson: string;
      }>;

    return rows.map((row) => ({
      sourceId: row.sourceId,
      pluginId: row.pluginId,
      displayName: row.displayName,
      capabilities: JSON.parse(row.capabilitiesJson) as SourceRegistryRecord["capabilities"],
    }));
  }
}
