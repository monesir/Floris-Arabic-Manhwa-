import { DatabaseSync } from "node:sqlite";

let database: DatabaseSync | null = null;

export function initializeDatabase(databasePath: string) {
  if (database) {
    return database;
  }

  database = new DatabaseSync(databasePath);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");

  return database;
}

export function getDatabase() {
  if (!database) {
    throw new Error("Database accessed before initialization.");
  }

  return database;
}
