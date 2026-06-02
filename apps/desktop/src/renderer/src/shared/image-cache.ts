/**
 * Persistent cover image cache.
 *
 * Downloads covers in the renderer (same context as <img>, same CORS/cookies),
 * then sends the bytes to main process for disk storage.
 *
 * In-memory map avoids repeated IPC calls within the same session.
 */

const memoryCache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

/**
 * Given a remote image URL, cache it to disk and return a data URL.
 * Uses renderer-side fetch (same context as <img>) to avoid header/CORS issues.
 */
export function getCachedImageUrl(remoteUrl: string): Promise<string> {
  // Skip non-http URLs
  if (!remoteUrl || !remoteUrl.startsWith("http")) {
    return Promise.resolve(remoteUrl);
  }

  const cached = memoryCache.get(remoteUrl);
  if (cached) {
    return Promise.resolve(cached);
  }

  const inflight = pending.get(remoteUrl);
  if (inflight) {
    return inflight;
  }

  // Ask main process to check disk cache first, then download if needed
  const promise = window.coverCache
    .resolve(remoteUrl)
    .then((result) => {
      if (result && result !== remoteUrl) {
        memoryCache.set(remoteUrl, result);
      }
      pending.delete(remoteUrl);
      return result;
    })
    .catch(() => {
      pending.delete(remoteUrl);
      return remoteUrl;
    });

  pending.set(remoteUrl, promise);
  return promise;
}

/**
 * Check if an image is already in memory cache (synchronous).
 */
export function getImageFromCache(remoteUrl: string): string | null {
  return memoryCache.get(remoteUrl) ?? null;
}
