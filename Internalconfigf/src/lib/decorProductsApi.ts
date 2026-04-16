import { buildApiUrl } from './apiUrl'

export type DecorCatalogItem = {
  id: string
  label: string
  imageUrl: string
  /** Lowercase text used to loosely match UI style presets (Modern, Rustic, …). */
  searchBlob: string
}

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1572596116404-98f227c01ac1?w=400&q=80'

/** Keywords per preset name — matches name / description / category from Supabase. */
const STYLE_KEYWORDS: Record<string, readonly string[]> = {
  Modern: ['modern', 'contemporary', 'sleek', 'urban', 'minimal square'],
  Minimalist: ['minimal', 'minimalist', 'simple', 'clean', 'plain', 'stylised numerals'],
  Rustic: ['rustic', 'farmhouse', 'vintage', 'distress', 'wood', 'rattan', 'cane', 'teak', 'oak', 'walnut', 'solid wood'],
  Luxury: ['luxury', 'luxurious', 'gold', 'brass', 'marble', 'premium', 'designer', 'golden', 'gilded'],
  Scandinavian: ['scandi', 'scandinavian', 'nordic', 'ikea', 'sweden', 'hygge'],
  Industrial: ['industrial', 'metal', 'iron', 'steel', 'wire', 'antique finish', 'ms antique'],
}

type ApiRow = {
  id?: string
  label?: string
  name?: string
  imageUrl?: string
  description?: string
  category?: string
  brand?: string
  generic_name?: string
  primary_material_type?: string
}

function buildSearchBlob(row: ApiRow, label: string): string {
  const parts = [
    label,
    row.name,
    row.description,
    row.category,
    row.brand,
    row.generic_name,
    row.primary_material_type,
  ]
  return parts
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .join(' ')
    .toLowerCase()
}

/** After user picks a style preset, narrow the grid; if nothing matches, return full list. */
export function filterDecorCatalogByStylePreset(
  items: DecorCatalogItem[],
  preset: string
): DecorCatalogItem[] {
  const keys = STYLE_KEYWORDS[preset]
  if (!keys?.length) return items
  const matched = items.filter((item) => keys.some((kw) => item.searchBlob.includes(kw)))
  return matched.length > 0 ? matched : items
}

export async function fetchDecorProductsForEdit(): Promise<{
  items: DecorCatalogItem[]
  error?: string
}> {
  try {
    const res = await fetch(buildApiUrl('/api/product-variations?component=decor&context=internal'))
    const data = (await res.json()) as unknown
    if (data && typeof data === 'object' && !Array.isArray(data) && 'error' in data) {
      const err = (data as { error?: string }).error
      return {
        items: [],
        error: typeof err === 'string' ? err : 'Failed to load decor catalog',
      }
    }
    const list = Array.isArray(data) ? (data as ApiRow[]) : []
    const items: DecorCatalogItem[] = list
      .filter((row) => row && typeof row.id === 'string' && row.id.length > 0)
      .map((row) => {
        const label =
          typeof row.label === 'string' && row.label.trim()
            ? row.label.trim()
            : typeof row.name === 'string' && row.name.trim()
              ? row.name.trim()
              : row.id!
        const imageUrl =
          typeof row.imageUrl === 'string' && row.imageUrl.trim()
            ? row.imageUrl.trim()
            : FALLBACK_IMG
        return {
          id: row.id!,
          label,
          imageUrl,
          searchBlob: buildSearchBlob(row, label),
        }
      })
    return { items }
  } catch (e) {
    return {
      items: [],
      error: e instanceof Error ? e.message : 'Failed to load decor catalog',
    }
  }
}
