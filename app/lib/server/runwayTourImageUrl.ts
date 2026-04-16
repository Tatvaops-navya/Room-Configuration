import { getSupabaseServer } from '@/app/lib/supabase'

/**
 * Upload a JPEG frame for Runway image-to-video (requires HTTPS URL Runway can fetch).
 * Uses a signed URL (1h) so private buckets work.
 */
export async function uploadTourFrameAndGetSignedUrl(jpeg: Buffer): Promise<string> {
  const bucket = process.env.ROOM_TOUR_STORAGE_BUCKET?.trim()
  if (!bucket) {
    throw new Error('ROOM_TOUR_STORAGE_BUCKET is not set. Create a Supabase Storage bucket and set this env var.')
  }

  const supabase = getSupabaseServer()
  const path = `tour/${Date.now()}-${Math.random().toString(36).slice(2, 12)}.jpg`

  const { error: upErr } = await supabase.storage.from(bucket).upload(path, jpeg, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (upErr) {
    throw new Error(`Tour image upload failed: ${upErr.message}`)
  }

  const { data: signed, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(path, 3600)
  if (signErr || !signed?.signedUrl) {
    throw new Error(signErr?.message || 'Could not create signed URL for tour image')
  }

  return signed.signedUrl
}
