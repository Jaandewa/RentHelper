/**
 * Private/sensitive URL path segments that must be excluded from public gallery images.
 */
const PRIVATE_PATH_SEGMENTS = [
  '/kyc/',
  '/documents/',
  '/nic/',
  '/passport/',
  '/driving-license/',
  '/selfie/',
];

/**
 * Returns true if the URL points to a private/KYC document that should not be public.
 */
function isPrivateUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return PRIVATE_PATH_SEGMENTS.some(seg => lower.includes(seg));
}

/**
 * Returns true if the value looks like a plausible image URL.
 * Filters out empty, null-ish, malformed, and private URLs.
 */
function isValidPublicImageUrl(v: string): boolean {
  if (v.length === 0) return false;
  if (v === 'null' || v === 'undefined') return false;
  if (v.includes('[object Object]')) return false;
  if (isPrivateUrl(v)) return false;
  // Must be an absolute https/http URL or a relative path starting with /
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith('/')) return true;
  return false;
}

/**
 * Safely parse an unknown value into a clean, deduplicated array of valid image URLs.
 *
 * Handles:
 * - JSON-encoded string arrays (e.g. '["https://...","https://..."]')
 * - Plain URL strings
 * - Arrays of strings
 * - null / undefined / non-string values (silently skipped)
 *
 * Filters out:
 * - null, undefined, empty strings
 * - Duplicate URLs
 * - Malformed values like "[object Object]"
 * - Private KYC/document URLs
 */
export function normalizeImageUrls(values: unknown, baseUrl?: string): string[] {
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

  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of array) {
    if (typeof raw !== 'string') continue;
    let v = raw.trim();
    if (!v) continue;

    // Resolve relative paths if baseUrl is provided
    if (v.startsWith('/') && baseUrl) {
      v = `${baseUrl}${v}`;
    }

    if (!isValidPublicImageUrl(v)) continue;
    if (seen.has(v)) continue;

    seen.add(v);
    result.push(v);
  }

  return result;
}

/**
 * Build a single canonical gallery image list from all available image sources.
 *
 * Order:
 *   1. Cover image (if valid)
 *   2. RentalAd galleryImages (parsed from JSON string)
 *   3. ItemImage URLs
 *
 * All values are deduplicated and filtered for validity.
 */
export function buildGalleryImages(
  coverImageUrl: string | null | undefined,
  galleryImages: unknown,
  itemImages?: Array<{ url: string }> | null,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  function addIfValid(url: string | null | undefined) {
    if (!url) return;
    const v = url.trim();
    if (!v || seen.has(v) || !isValidPublicImageUrl(v)) return;
    seen.add(v);
    result.push(v);
  }

  // 1. Cover image first
  addIfValid(coverImageUrl);

  // 2. Gallery images from RentalAd (JSON string or array)
  const parsedGallery = normalizeImageUrls(galleryImages);
  for (const url of parsedGallery) {
    addIfValid(url);
  }

  // 3. Item images
  if (itemImages) {
    for (const img of itemImages) {
      addIfValid(img.url);
    }
  }

  return result;
}
