import { buildApiUrl } from './apiUrl'

/**
 * Maps POST /api/detect-components (roomType + slugs) → Figma sidebar labels (Wall, Bed, …).
 */

export type DetectSceneResponse = {
  roomType?: string | null
  components?: string[]
  error?: string
}

/** Canonical sidebar order; structural first, then common furniture, then rest. */
export const ALL_OBJECT_CATEGORY_LABELS = [
  'Wall',
  'Floor',
  'Carpet',
  'Ceiling',
  'Sofa',
  'Bed',
  'Mattress',
  'Chair',
  'Desk',
  'Table',
  'Dining',
  'Cabinet',
  'Door',
  'Window',
  'Glass',
  'Partition',
  'Decor',
  'Lighting',
] as const

export type ObjectCategoryLabel = (typeof ALL_OBJECT_CATEGORY_LABELS)[number]

const SLUG_TO_CATEGORY: Record<string, ObjectCategoryLabel> = {
  sofa: 'Sofa',
  couch: 'Sofa',
  'sectional-sofa': 'Sofa',
  'sectional': 'Sofa',
  loveseat: 'Sofa',
  chair: 'Chair',
  armchair: 'Chair',
  'office-chair': 'Chair',
  desk: 'Desk',
  'study-desk': 'Desk',
  'computer-desk': 'Desk',
  'reception-desk': 'Desk',
  table: 'Table',
  'coffee-table': 'Table',
  'side-table': 'Table',
  'dining-table': 'Dining',
  dining: 'Dining',
  'dining-chair': 'Dining',
  nightstand: 'Table',
  'night-stand': 'Table',
  bedside: 'Table',
  cabinet: 'Cabinet',
  wardrobe: 'Cabinet',
  'storage-cabinet': 'Cabinet',
  shelves: 'Cabinet',
  shelf: 'Cabinet',
  'tv-unit': 'Decor',
  'tv-stand': 'Decor',
  bed: 'Bed',
  'platform-bed': 'Bed',
  'bunk-bed': 'Bed',
  mattress: 'Mattress',
  door: 'Door',
  window: 'Window',
  'glass-partition': 'Partition',
  partition: 'Partition',
  lamp: 'Lighting',
  'floor-lamp': 'Lighting',
  'table-lamp': 'Lighting',
  chandelier: 'Lighting',
  sconce: 'Lighting',
  lighting: 'Lighting',
  mirror: 'Decor',
  rug: 'Carpet',
  carpet: 'Carpet',
  'area-rug': 'Carpet',
  runner: 'Carpet',
  'runner-rug': 'Carpet',
  dhurrie: 'Carpet',
  'bath-mat': 'Carpet',
  bathmat: 'Carpet',
  mat: 'Carpet',
  plant: 'Decor',
}

function normalizeSlug(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, '-')
}

/**
 * Structural categories always first; then categories implied by slugs + room type;
 * then remaining labels so users can still open any catalog.
 */
export function buildObjectCategoriesFromDetection(
  roomType: string | null | undefined,
  componentSlugs: string[] | undefined,
): ObjectCategoryLabel[] {
  const slugs = (componentSlugs ?? []).map(normalizeSlug).filter(Boolean)
  const detected = new Set<ObjectCategoryLabel>()
  for (const slug of slugs) {
    const cat = SLUG_TO_CATEGORY[slug]
    if (cat) detected.add(cat)
  }

  const rt = (roomType ?? '').toLowerCase()
  const isBedroom =
    rt.includes('bedroom') ||
    (rt.includes('guest') && rt.includes('room')) ||
    rt.includes('nursery') ||
    (rt.includes('kids') && rt.includes('room')) ||
    rt.includes('master-suite')

  if (isBedroom || slugs.includes('bed') || slugs.includes('platform-bed') || slugs.includes('bunk-bed')) {
    detected.add('Bed')
    detected.add('Mattress')
  }

  const structural: ObjectCategoryLabel[] = ['Wall', 'Floor', 'Ceiling']
  const ordered: ObjectCategoryLabel[] = [...structural]

  for (const label of ALL_OBJECT_CATEGORY_LABELS) {
    if (structural.includes(label)) continue
    if (detected.has(label)) ordered.push(label)
  }
  for (const label of ALL_OBJECT_CATEGORY_LABELS) {
    if (!ordered.includes(label)) ordered.push(label)
  }
  return ordered
}

/** Thumbnails for left sidebar rows (Edit / Add / Replace). */
export const OBJECT_CATEGORY_THUMB_URLS: Record<string, string> = {
  Wall: 'https://images.unsplash.com/photo-1767467961045-60e4294e0c7f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Floor: 'https://images.unsplash.com/photo-1676789403751-cb4381fff88e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Carpet: 'https://images.unsplash.com/photo-1600166898405-3aad6191b57b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Ceiling: 'https://images.unsplash.com/photo-1550932372-3080d57e4e74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Sofa: 'https://images.unsplash.com/photo-1768946052273-0a2dd7f3e365?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Bed: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Mattress: 'https://images.unsplash.com/photo-1586105251267-7a3e36e50d43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Chair: 'https://images.unsplash.com/photo-1760716478125-aa948e99ef85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Desk: 'https://images.unsplash.com/photo-1772761482020-3cea792b5de7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Table: 'https://images.unsplash.com/photo-1539624831128-04618668ce81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Dining: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Cabinet: 'https://images.unsplash.com/photo-1771287490574-f5de29048a39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Door: 'https://images.unsplash.com/photo-1759306326997-1d1ed4c63f7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Window: 'https://images.unsplash.com/photo-1642774272935-28f614bf4ef5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Glass: 'https://images.unsplash.com/photo-1596902362438-e8516a972fb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Partition: 'https://images.unsplash.com/photo-1765766600457-abfd14dd502c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Decor: 'https://images.unsplash.com/photo-1761472012793-ecf26c1c7396?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
  Lighting: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80',
}

export async function postDetectScene(imageDataUrl: string): Promise<DetectSceneResponse> {
  const trimmed = imageDataUrl?.trim()
  if (!trimmed) {
    return { roomType: null, components: [], error: 'No image.' }
  }
  try {
    const res = await fetch(buildApiUrl('/api/detect-components'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: trimmed }),
    })
    const data = (await res.json()) as DetectSceneResponse & { components?: string[] }
    if (!res.ok) {
      return {
        roomType: null,
        components: [],
        error: typeof data.error === 'string' ? data.error : 'Detection failed',
      }
    }
    return {
      roomType: data.roomType ?? null,
      components: Array.isArray(data.components) ? data.components : [],
    }
  } catch (e) {
    return {
      roomType: null,
      components: [],
      error: e instanceof Error ? e.message : 'Detection request failed',
    }
  }
}
