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
            language,
            base_url,
            capabilities_json,
            created_at,
            updated_at
          )
          VALUES (
            @sourceId,
            @pluginId,
            @displayName,
            @language,
            @baseUrl,
            @capabilitiesJson,
            @createdAt,
            @updatedAt
          )
          ON CONFLICT(source_id) DO UPDATE SET
            plugin_id = excluded.plugin_id,
            display_name = excluded.display_name,
            language = excluded.language,
            base_url = excluded.base_url,
            capabilities_json = excluded.capabilities_json,
            updated_at = excluded.updated_at
        `,
      )
      .run({
        sourceId: record.sourceId,
        pluginId: record.pluginId,
        displayName: record.displayName,
        language: record.language,
        baseUrl: record.baseUrl,
        capabilitiesJson: JSON.stringify(record.capabilities),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
  }

  deleteUnreferencedByPluginId(pluginId: string) {
    this.database
      .prepare(
        `
          DELETE FROM source_registry
          WHERE plugin_id = ?
            AND NOT EXISTS (
              SELECT 1
              FROM library_entries
              WHERE library_entries.source_id = source_registry.source_id
            )
        `,
      )
      .run(pluginId);
  }

  listAll(): SourceRegistryRecord[] {
    const rows = this.database
      .prepare(
        `
          SELECT
            source_id AS sourceId,
            plugin_id AS pluginId,
            display_name AS displayName,
            language,
            base_url AS baseUrl,
            capabilities_json AS capabilitiesJson
          FROM source_registry
          ORDER BY plugin_id ASC, source_id ASC
        `,
      )
      .all() as Array<{
        sourceId: string;
        pluginId: string;
        displayName: string;
        language: string;
        baseUrl: string;
        capabilitiesJson: string;
      }>;

    return rows.map((row) => ({
      sourceId: row.sourceId,
      pluginId: row.pluginId,
      displayName: row.displayName,
      language: row.language,
      baseUrl: row.baseUrl,
      capabilities: JSON.parse(row.capabilitiesJson) as SourceRegistryRecord["capabilities"],
    }));
  }
}
