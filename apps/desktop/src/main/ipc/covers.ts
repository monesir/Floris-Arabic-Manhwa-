import { ipcMain } from "electron";
import { resolveCoverUrl, clearCoverCache, getCoverCacheSize } from "@services/covers/cover-cache";

const RESOLVE_COVER_CHANNEL = "covers:resolve";
const CLEAR_COVER_CHANNEL = "covers:clear";
const CACHE_SIZE_CHANNEL = "covers:size";

export function registerCoverCacheIpc() {
  ipcMain.handle(
    RESOLVE_COVER_CHANNEL,
    (_, remoteUrl: string): Promise<string> => resolveCoverUrl(remoteUrl),
  );
  ipcMain.handle(CLEAR_COVER_CHANNEL, () => clearCoverCache());
  ipcMain.handle(CACHE_SIZE_CHANNEL, (): number => getCoverCacheSize());
}
