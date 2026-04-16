import { NextRequest } from 'next/server'
import { handleRoomEditorPost } from '@/app/lib/server/roomEditorApiHandler'

/** Image inpaint often needs several minutes; must be ≥ client GEMINI_IMAGE_TIMEOUT_MS. */
export const maxDuration = 300

export async function POST(request: NextRequest) {
  return handleRoomEditorPost('add', request)
}
