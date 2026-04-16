import { NextRequest } from 'next/server'
import { handleRoomEditorPost } from '@/app/lib/server/roomEditorApiHandler'

export const maxDuration = 300

/**
 * Region erase via explicit mask (white = remove).
 * Differs from /api/generate eraseRegion which uses a normalized rect.
 */
export async function POST(request: NextRequest) {
  return handleRoomEditorPost('erase', request)
}
