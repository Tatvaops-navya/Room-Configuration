/** API keys supported by GET /api/product-variations?context=internal */
const INTERNAL_API_COMPONENTS = new Set([
  'wall',
  'floor',
  'ceiling',
  'glass-partition',
  'decor',
  'sofa',
  'mattress',
  'bed',
  'door',
  'window',
  'chair',
  'desk',
  'table',
  'cabinet',
])

const SLUG_TO_API: Record<string, string> = {
  'coffee-table': 'table',
  'side-table': 'table',
  'dining-table': 'table',
  'reception-desk': 'desk',
  'nightstand': 'cabinet',
  'night-stand': 'cabinet',
  'tv-unit': 'decor',
  lamp: 'decor',
  'floor-lamp': 'decor',
  bed: 'bed',
  mattress: 'mattress',
  counter: 'cabinet',
  shelves: 'cabinet',
  shelf: 'cabinet',
}

/** Shown first; matches main app customization base. */
export const BASE_EDIT_COMPONENT_IDS = [
  'wall',
  'floor',
  'ceiling',
  'glass-partition',
  'sofa',
  'decor',
] as const

export interface EditComponentListItem {
  id: string
  label: string
  apiComponent: string
}

function formatSlugLabel(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function mapDetectedSlugToApiComponent(slug: string): string {
  const s = slug.toLowerCase().trim()
  const mapped = SLUG_TO_API[s] ?? s
  if (INTERNAL_API_COMPONENTS.has(mapped)) return mapped
  return 'decor'
}

/**
 * Base rows + detected furniture (deduped by apiComponent; base wins).
 */
export function mergeEditComponentList(detectedSlugs: string[]): EditComponentListItem[] {
  const seenApi = new Set<string>()
  const out: EditComponentListItem[] = []

  for (const id of BASE_EDIT_COMPONENT_IDS) {
    const api = id
    seenApi.add(api)
    out.push({ id, label: formatSlugLabel(id), apiComponent: api })
  }

  for (const slug of detectedSlugs) {
    if (slug === 'bed') {
      if (!seenApi.has('bed')) {
        seenApi.add('bed')
        out.push({ id: 'bed', label: 'Bed', apiComponent: 'bed' })
      }
      if (!seenApi.has('mattress')) {
        seenApi.add('mattress')
        out.push({ id: 'mattress', label: 'Mattress', apiComponent: 'mattress' })
      }
      continue
    }
    const api = mapDetectedSlugToApiComponent(slug)
    if (seenApi.has(api)) continue
    seenApi.add(api)
    out.push({
      id: slug,
      label: formatSlugLabel(slug),
      apiComponent: api,
    })
  }

  return out
}
