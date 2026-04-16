/**
 * Client-side API calls for room editor operations.
 * All endpoints expect { image: dataUrl, mask: dataUrl, prompt?: string }
 * and return { success: true, imageUrl: dataUrl } or { error: string }.
 */

type RoomEditorOp = 'edit' | 'replace' | 'erase' | 'add'

async function callRoomEditor(
  op: RoomEditorOp,
  imageDataUrl: string,
  maskDataUrl: string,
  prompt?: string
): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string }> {
  const endpoint = `/api/${op}`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageDataUrl,
      mask: maskDataUrl,
      prompt: prompt || undefined,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, error: (data as { error?: string }).error || res.statusText }
  }
  if (data.success && typeof data.imageUrl === 'string') {
    return { ok: true, imageUrl: data.imageUrl }
  }
  return { ok: false, error: 'Invalid response from server' }
}

export async function editRegion(
  image: string,
  mask: string,
  prompt?: string
): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string }> {
  return callRoomEditor('edit', image, mask, prompt)
}

export async function replaceRegion(
  image: string,
  mask: string,
  prompt?: string
): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string }> {
  return callRoomEditor('replace', image, mask, prompt)
}

export async function eraseRegion(
  image: string,
  mask: string,
  prompt?: string
): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string }> {
  return callRoomEditor('erase', image, mask, prompt)
}

export async function addObject(
  image: string,
  mask: string,
  prompt: string
): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string }> {
  return callRoomEditor('add', image, mask, prompt)
}

/**
 * Edit a cutout image (Lift Subject flow).
 * Returns the edited cutout; caller composites onto base image.
 */
export async function editCutout(
  cutoutDataUrl: string,
  prompt: string
): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string }> {
  const res = await fetch('/api/edit-cutout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cutout: cutoutDataUrl, prompt }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, error: (data as { error?: string }).error || res.statusText }
  }
  if (data.success && typeof data.imageUrl === 'string') {
    return { ok: true, imageUrl: data.imageUrl }
  }
  return { ok: false, error: 'Invalid response from server' }
}
