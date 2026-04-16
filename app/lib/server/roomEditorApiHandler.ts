import { NextRequest, NextResponse } from 'next/server'
import { runGeminiMaskedInpaint, type RoomEditorOperation } from '@/app/lib/server/geminiInpaintMask'

export async function handleRoomEditorPost(
  operation: RoomEditorOperation,
  request: NextRequest
): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { image, mask, prompt, referenceImage } = body as {
      image?: string
      mask?: string
      prompt?: string
      referenceImage?: string
    }
    if (typeof image !== 'string' || typeof mask !== 'string') {
      return NextResponse.json(
        {
          error:
            'Payload requires { image: dataUrl, mask: dataUrl, prompt?: string, referenceImage?: dataUrl }',
        },
        { status: 400 }
      )
    }
    const ref =
      typeof referenceImage === 'string' && referenceImage.includes(',')
        ? referenceImage.trim()
        : undefined
    const r = await runGeminiMaskedInpaint({
      operation,
      imageDataUrl: image,
      maskDataUrl: mask,
      userPrompt: typeof prompt === 'string' ? prompt : undefined,
      referenceImageDataUrl: ref,
    })
    if (!r.ok) {
      return NextResponse.json({ error: r.error }, { status: r.status })
    }
    return NextResponse.json({ success: true, imageUrl: r.imageUrl, mode: operation })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Invalid request body' },
      { status: 400 }
    )
  }
}
