import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, unlinkSync, statSync } from "node:fs";
import { join } from "node:path";
import { net } from "electron";
import sharp from "sharp";

let cacheDir = "";

/**
 * Initialize the cover cache directory inside userData.
 */
export function initCoverCache(userDataPath: string) {
  cacheDir = join(userDataPath, "cover-cache");
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
}

function urlToFilename(url: string): string {
  const hash = createHash("sha256").update(url).digest("hex").slice(0, 24);
  return `${hash}.webp`;
}

function getCachePath(url: string): string {
  return join(cacheDir, urlToFilename(url));
}

function toDataUrl(buffer: Buffer): string {
  return `data:image/webp;base64,${buffer.toString("base64")}`;
}

/**
 * Resolve a remote cover URL to a data URL.
 * If cached on disk, reads and returns as data URL.
 * If not cached, downloads, saves to disk, returns as data URL.
 * Returns the original URL as fallback on any error.
 */
export async function resolveCoverUrl(remoteUrl: string): Promise<string> {
  if (!remoteUrl || !cacheDir) {
    return remoteUrl;
  }

  // Already a data URL or local path — return as-is
  if (remoteUrl.startsWith("data:") || remoteUrl.startsWith("file:")) {
    return remoteUrl;
  }

  const localPath = getCachePath(remoteUrl);

    if (existsSync(localPath)) {
    try {
      return toDataUrl(readFileSync(localPath));
    } catch {
      // If reading fails, re-download
    }
  }

  try {
    const response = await net.fetch(remoteUrl);
    if (!response.ok) {
      return remoteUrl;
    }

    const rawBuffer = Buffer.from(await response.arrayBuffer());
    if (rawBuffer.length < 100) {
      return remoteUrl;
    }

    // Convert to WebP using sharp (80 quality is a great balance of size and fidelity)
    const webpBuffer = await sharp(rawBuffer).webp({ quality: 80 }).toBuffer();

    writeFileSync(localPath, webpBuffer);
    return toDataUrl(webpBuffer);
  } catch (error) {
    console.error("Failed to process cover image:", error);
    return remoteUrl;
  }
}

export function clearCoverCache(): boolean {
  if (cacheDir && existsSync(cacheDir)) {
    try {
      const files = readdirSync(cacheDir);
      for (const file of files) {
        unlinkSync(join(cacheDir, file));
      }
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function getCoverCacheSize(): number {
  if (!cacheDir || !existsSync(cacheDir)) {
    return 0;
  }
  try {
    const files = readdirSync(cacheDir);
    let total = 0;
    for (const file of files) {
      total += statSync(join(cacheDir, file)).size;
    }
    return total;
  } catch {
    return 0;
  }
}
