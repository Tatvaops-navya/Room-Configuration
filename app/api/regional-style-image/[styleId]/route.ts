import { promises as fs } from 'fs'
import { NextResponse } from 'next/server'

const STYLE_IMAGE_PATHS: Record<string, string> = {
  odisha:
    'C:\\Users\\DELL\\.cursor\\projects\\c-Users-DELL-OneDrive-Desktop-room-configuration\\assets\\c__Users_DELL_AppData_Roaming_Cursor_User_workspaceStorage_3424cd29d52b78e457919dc97d9fcd34_images_image-f8a8b421-d4cb-4917-a4ca-e26e7be83d8a.png',
  maharashtrian:
    'C:\\Users\\DELL\\.cursor\\projects\\c-Users-DELL-OneDrive-Desktop-room-configuration\\assets\\c__Users_DELL_AppData_Roaming_Cursor_User_workspaceStorage_3424cd29d52b78e457919dc97d9fcd34_images_image-eb3c81d6-5ed0-49cd-9018-229bcc50cc87.png',
  punjabi:
    'C:\\Users\\DELL\\.cursor\\projects\\c-Users-DELL-OneDrive-Desktop-room-configuration\\assets\\c__Users_DELL_AppData_Roaming_Cursor_User_workspaceStorage_3424cd29d52b78e457919dc97d9fcd34_images_image-70c2f0dc-c984-412c-b828-6e8537f6ca3e.png',
  industrial:
    'C:\\Users\\DELL\\.cursor\\projects\\c-Users-DELL-OneDrive-Desktop-room-configuration\\assets\\c__Users_DELL_AppData_Roaming_Cursor_User_workspaceStorage_3424cd29d52b78e457919dc97d9fcd34_images_image-0fdee433-ac41-49ff-ad9d-bcb956e12906.png',
  persian:
    'C:\\Users\\DELL\\.cursor\\projects\\c-Users-DELL-OneDrive-Desktop-room-configuration\\assets\\c__Users_DELL_AppData_Roaming_Cursor_User_workspaceStorage_3424cd29d52b78e457919dc97d9fcd34_images_image-988c835c-8ccb-4c3b-b8a7-60725306ceec.png',
  omani:
    'C:\\Users\\DELL\\.cursor\\projects\\c-Users-DELL-OneDrive-Desktop-room-configuration\\assets\\c__Users_DELL_AppData_Roaming_Cursor_User_workspaceStorage_3424cd29d52b78e457919dc97d9fcd34_images_image-e98aa615-f76e-43af-aa51-5ccb009fcf7c.png',
  lebanese:
    'C:\\Users\\DELL\\.cursor\\projects\\c-Users-DELL-OneDrive-Desktop-room-configuration\\assets\\c__Users_DELL_AppData_Roaming_Cursor_User_workspaceStorage_3424cd29d52b78e457919dc97d9fcd34_images_image-3f50ddd4-675b-4739-9cee-af50a40feb09.png',
  egyptian:
    'C:\\Users\\DELL\\.cursor\\projects\\c-Users-DELL-OneDrive-Desktop-room-configuration\\assets\\c__Users_DELL_AppData_Roaming_Cursor_User_workspaceStorage_3424cd29d52b78e457919dc97d9fcd34_images_image-76a054dd-196f-419f-8e9c-bc87637eb746.png',
  korean:
    'C:\\Users\\DELL\\.cursor\\projects\\c-Users-DELL-OneDrive-Desktop-room-configuration\\assets\\c__Users_DELL_AppData_Roaming_Cursor_User_workspaceStorage_3424cd29d52b78e457919dc97d9fcd34_images_image-6f920227-e3c7-4cbf-8e2b-3f70a7f1da2a.png',
  french:
    'C:\\Users\\DELL\\.cursor\\projects\\c-Users-DELL-OneDrive-Desktop-room-configuration\\assets\\c__Users_DELL_AppData_Roaming_Cursor_User_workspaceStorage_3424cd29d52b78e457919dc97d9fcd34_images_image-2ddbe5a7-ae97-41f1-9cc6-40969b7c1033.png',
  'latin-american':
    'C:\\Users\\DELL\\.cursor\\projects\\c-Users-DELL-OneDrive-Desktop-room-configuration\\assets\\c__Users_DELL_AppData_Roaming_Cursor_User_workspaceStorage_3424cd29d52b78e457919dc97d9fcd34_images_image-94129e92-8694-4f9b-9d75-6ca7fff1cf15.png',
  moroccan:
    'C:\\Users\\DELL\\.cursor\\projects\\c-Users-DELL-OneDrive-Desktop-room-configuration\\assets\\c__Users_DELL_AppData_Roaming_Cursor_User_workspaceStorage_3424cd29d52b78e457919dc97d9fcd34_images_image-7cb3b6e7-d1f3-41d4-a204-68ae17f932e4.png',
  turkish:
    'C:\\Users\\DELL\\.cursor\\projects\\c-Users-DELL-OneDrive-Desktop-room-configuration\\assets\\c__Users_DELL_AppData_Roaming_Cursor_User_workspaceStorage_3424cd29d52b78e457919dc97d9fcd34_images_image-57cf8dc2-4268-4a49-9aa5-12e329e064ef.png',
  chinese:
    'C:\\Users\\DELL\\.cursor\\projects\\c-Users-DELL-OneDrive-Desktop-room-configuration\\assets\\c__Users_DELL_AppData_Roaming_Cursor_User_workspaceStorage_3424cd29d52b78e457919dc97d9fcd34_images_image-9b107433-5a4f-4997-8b0e-2f6bbe4face2.png',
}

function contentTypeFor(path: string): string {
  const lower = path.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

type CachedImage = {
  buffer: Buffer
  contentType: string
  etag: string
}

// Cache images in-memory to avoid repeated fs reads (fixes slow thumbnail grids).
const IMAGE_CACHE = new Map<string, CachedImage>()

function bufferToArrayBuffer(buf: Buffer): ArrayBuffer {
  // Create a real ArrayBuffer copy (avoids SharedArrayBuffer typing issues).
  const ab = new ArrayBuffer(buf.byteLength)
  new Uint8Array(ab).set(buf)
  return ab
}

export async function GET(
  request: Request,
  context: { params: Promise<{ styleId: string }> }
) {
  const { styleId } = await context.params
  // Normalize id to avoid duplicate cache entries (e.g. casing).
  const key = String(styleId).toLowerCase()
  const imagePath = STYLE_IMAGE_PATHS[key]
  if (!imagePath) {
    return NextResponse.json({ error: 'Style image not found.' }, { status: 404 })
  }

  try {
    const cached = IMAGE_CACHE.get(key)
    if (cached) {
      const ifNoneMatch = request.headers.get('if-none-match')
      if (ifNoneMatch && ifNoneMatch === cached.etag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            ETag: cached.etag,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      }
      return new NextResponse(bufferToArrayBuffer(cached.buffer), {
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          ETag: cached.etag,
        },
      })
    }

    const [buffer, stat] = await Promise.all([fs.readFile(imagePath), fs.stat(imagePath)])
    const contentType = contentTypeFor(imagePath)
    const etag = `"${stat.size}-${Math.floor(stat.mtimeMs)}"`
    IMAGE_CACHE.set(key, { buffer, contentType, etag })

    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }

    return new NextResponse(bufferToArrayBuffer(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: etag,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unable to read style image.' }, { status: 500 })
  }
}
