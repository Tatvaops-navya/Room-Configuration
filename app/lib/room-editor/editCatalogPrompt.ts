export interface CatalogEditPayload {
  componentLabel: string
  variationLabel: string
  variationDescription?: string
}

export function buildEditCatalogPrompt(payload: CatalogEditPayload): string {
  const { componentLabel, variationLabel, variationDescription } = payload
  const detail = variationDescription?.trim()
  const parts = [
    `Change only the ${componentLabel} in this interior photo to match this specification: ${variationLabel}.`,
    detail && detail !== variationLabel ? `Details: ${detail}.` : '',
    'Keep every other surface, object, layout, and lighting unchanged. Photorealistic, seamless blend.',
  ]
  return parts.filter(Boolean).join(' ')
}
