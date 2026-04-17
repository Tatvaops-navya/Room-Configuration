export interface CatalogEditPayload {
  componentLabel: string
  variationLabel: string
  variationDescription?: string
}

/** Same closing instruction as catalog edit — replace mode uses this so inpaint prompts match edit. */
export const EDIT_INPAINT_CLOSURE =
  'Keep every other surface, object, layout, and lighting unchanged. Photorealistic, seamless blend.'

export function buildEditCatalogPrompt(payload: CatalogEditPayload): string {
  const { componentLabel, variationLabel, variationDescription } = payload
  const detail = variationDescription?.trim()
  const parts = [
    `Change only the ${componentLabel} in this interior photo to match this specification: ${variationLabel}.`,
    detail && detail !== variationLabel ? `Details: ${detail}.` : '',
    EDIT_INPAINT_CLOSURE,
  ]
  return parts.filter(Boolean).join(' ')
}
