import { useEffect, useState } from "react";
import { getCachedImageUrl, getImageFromCache } from "@renderer/shared/image-cache";

type CachedImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
};

/**
 * Drop-in replacement for <img> that caches covers to disk for persistence.
 * Shows the original src immediately, then upgrades to cached data URL.
 */
export function CachedImage({ src, ...rest }: CachedImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string>(() => {
    if (!src) return "";
    return getImageFromCache(src) ?? src;
  });

  useEffect(() => {
    if (!src) return;

    const cached = getImageFromCache(src);
    if (cached) {
      setResolvedSrc(cached);
      return;
    }

    // Show original immediately
    setResolvedSrc(src);

    // Cache in background (don't change display - already showing original)
    let cancelled = false;
    void getCachedImageUrl(src).then((url) => {
      if (!cancelled && url && url !== src) {
        setResolvedSrc(url);
      }
    });

    return () => { cancelled = true; };
  }, [src]);

  if (!resolvedSrc) return null;

  return <img {...rest} src={resolvedSrc} />;
}
