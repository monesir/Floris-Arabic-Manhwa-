import type { DatabaseSync } from "node:sqlite";
import type { AppLanguage } from "@contracts/settings";

type SettingRow = {
  key: string;
  value: string;
};

const LANGUAGE_KEY = "app.language";

export class SettingsRepository {
  constructor(private readonly database: DatabaseSync) {}

  getValue(key: string) {
    const row = this.database
      .prepare("SELECT key, value FROM app_settings WHERE key = ?")
      .get(key);

    return (row as SettingRow | undefined)?.value ?? null;
  }

  setValue(key: string, value: string) {
    const timestamp = new Date().toISOString();

    this.database
      .prepare(
        `
          INSERT INTO app_settings (key, value, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = excluded.updated_at
        `,
      )
      .run(key, value, timestamp);
  }

  getLanguage() {
    return this.getValue(LANGUAGE_KEY);
  }

  setLanguage(language: AppLanguage) {
    this.setValue(LANGUAGE_KEY, language);
  }
}
