export function normalizeImageUrls(values: unknown, baseUrl?: string): string[] {
  // If it's a JSON string, parse it first
  let array: unknown[] = [];
  if (typeof values === 'string') {
    try {
      const parsed = JSON.parse(values);
      array = Array.isArray(parsed) ? parsed : [values];
    } catch {
      array = values.trim() ? [values] : [];
    }
  } else if (Array.isArray(values)) {
    array = values;
  }

  return Array.from(
    new Set(
      array
        .filter((v): v is string => typeof v === 'string')
        .map(v => v.trim())
        .filter(v => v.length > 0 && v !== 'null' && v !== 'undefined' && !v.includes('[object Object]'))
        .map(v => {
          if (/^https?:\/\//i.test(v)) return v;
          if (v.startsWith('/') && baseUrl) return `${baseUrl}${v}`;
          return v;
        })
    )
  );
}

export function buildGalleryImages(coverImageUrl: string | null | undefined, galleryImages: unknown, itemImages?: Array<{url: string}> | null): string[] {
  const cover = coverImageUrl?.trim() || '';
  const gallery = normalizeImageUrls(galleryImages);
  const items = (itemImages || []).map(img => img.url).filter(Boolean);
  
  const all = [
    ...(cover ? [cover] : []),
    ...gallery,
    ...items,
  ];
  
  // Deduplicate while preserving order
  return Array.from(new Set(all));
}
