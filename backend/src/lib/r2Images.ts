// Uploaded images are served back from /api/images/<key> (see index.ts); this recovers the
// raw R2 key from that URL so a stale object can be deleted when it's replaced or its owning
// row is removed. Without this, every avatar/car-photo edit or car deletion leaks a permanent,
// unreferenced R2 object -- unbounded storage growth with no corresponding cleanup.
export function extractR2ImageKey(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/^\/api\/images\/(.+)$/);
  return match?.[1] ?? null;
}

export async function deleteR2Image(bucket: R2Bucket, url: string | null | undefined): Promise<void> {
  const key = extractR2ImageKey(url);
  if (!key) return;
  await bucket.delete(key).catch(() => {});
}
