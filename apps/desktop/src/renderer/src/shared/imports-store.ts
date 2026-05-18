import type { ImportResult } from "@contracts/imports";

export function importFolder() {
  return window.importsStore.importFolder() as Promise<ImportResult | null>;
}

export function importCbz() {
  return window.importsStore.importCbz() as Promise<ImportResult | null>;
}

export function importPdf() {
  return window.importsStore.importPdf() as Promise<ImportResult | null>;
}
