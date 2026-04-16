import { NextRequest } from 'next/server'
import { handleRoomEditorPost } from '@/app/lib/server/roomEditorApiHandler'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  return handleRoomEditorPost('replace', request)
}
