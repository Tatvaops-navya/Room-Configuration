import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/app/lib/supabase'
import { createClient } from '@supabase/supabase-js'

type QueryResult<T> = { data: T | null; error: { message?: string; details?: string; code?: string } | null }

const RETRYABLE_ERROR_PATTERNS = [
  /connect timeout/i,
  /fetch failed/i,
  /network/i,
  /timed out/i,
]

function isRetryableSupabaseError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { message?: unknown; details?: unknown }
  const message = typeof err.message === 'string' ? err.message : ''
  const details = typeof err.details === 'string' ? err.details : ''
  const combined = `${message}\n${details}`
  return RETRYABLE_ERROR_PATTERNS.some((pattern) => pattern.test(combined))
}

async function withSupabaseRetry<T>(
  runner: () => Promise<QueryResult<T>>,
  label: string,
  maxAttempts = 3
): Promise<QueryResult<T>> {
  let lastResult: QueryResult<T> | null = null
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await runner()
    lastResult = result
    if (!result.error) return result
    if (!isRetryableSupabaseError(result.error) || attempt === maxAttempts) return result
    const waitMs = attempt * 400
    console.warn(`${label} retry ${attempt}/${maxAttempts} after retryable Supabase error`)
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }
  return (
    lastResult ?? {
      data: null,
      error: { message: 'Unknown Supabase error after retries.' },
    }
  )
}

/** Swadesh (and similar) CDNs often 403/block when the browser sends Referer from localhost; serve via same-origin proxy. */
const CATALOG_IMAGE_PROXY_HOSTS = new Set(['cdn.swadeshonline.com'])

function wrapCatalogImageForClient(sourceUrl: string | undefined): string | undefined {
  if (!sourceUrl?.trim()) return undefined
  const t = sourceUrl.trim()
  if (!/^https:\/\//i.test(t)) return t
  try {
    const { hostname } = new URL(t)
    if (!CATALOG_IMAGE_PROXY_HOSTS.has(hostname.toLowerCase())) return t
    return `/api/catalog-image?url=${encodeURIComponent(t)}`
  } catch {
    return t
  }
}

function mapTableDeskCatalogRow(row: Record<string, unknown>, kind: 'table' | 'desk' | 'decor' | 'cabinet' | 'dining') {
  const id = `${kind}_${row.id ?? ''}`
  const name = String(row.name ?? '')
  const desc = String(row.description ?? '').trim()
  const description = desc.length > 200 ? desc.slice(0, 197) + '...' : desc || name
  const imagesUrlRaw = String(row.images_url ?? row.image_urls ?? row.image_url ?? '')
  const imageCandidates = imagesUrlRaw.split(/\s*\|\s*/).map((u) => u.trim()).filter(Boolean)
  const firstReal =
    imageCandidates.find((u) => !/dummy|placeholder/i.test(u)) ?? imageCandidates[0]
  const firstImage = firstReal || undefined
  const price = row.price != null ? Number(row.price) : null
  const priceLabel = price != null && !Number.isNaN(price) ? ` ₹${price.toLocaleString('en-IN')}` : ''
  const label = name + priceLabel
  const genericName = row.generic_name != null ? String(row.generic_name) : ''
  const materialType = row.primary_material_type != null ? String(row.primary_material_type) : ''
  const textureVal =
    row.primary_material_subtype != null
      ? String(row.primary_material_subtype)
      : row.seating_capacity != null
        ? String(row.seating_capacity)
        : undefined
  const cat = row.category != null ? String(row.category) : ''
  return {
    id,
    label,
    description,
    imageUrl: wrapCatalogImageForClient(firstImage ?? undefined),
    material: genericName || materialType || undefined,
    texture: textureVal,
    category: cat || undefined,
    color: row.colour != null ? String(row.colour) : undefined,
    name: name || undefined,
    brand: row.brand != null ? String(row.brand) : undefined,
    colour: row.colour != null ? String(row.colour) : undefined,
    warranty_in_months: row.warranty_in_months != null ? Number(row.warranty_in_months) : undefined,
    country_of_origin: row.country_of_origin != null ? String(row.country_of_origin) : undefined,
    length: row.length != null ? String(row.length) : undefined,
    width: row.width != null ? String(row.width) : undefined,
    height: row.height != null ? String(row.height) : undefined,
    net_weight: row.net_weight != null ? String(row.net_weight) : undefined,
    generic_name: row.generic_name != null ? String(row.generic_name) : undefined,
    primary_material_type: row.primary_material_type != null ? String(row.primary_material_type) : undefined,
    primary_material_subtype: row.primary_material_subtype != null ? String(row.primary_material_subtype) : undefined,
    primary_room: row.primary_room != null ? String(row.primary_room) : undefined,
    seating_capacity: row.seating_capacity != null ? String(row.seating_capacity) : undefined,
    product_model_name: row.product_model_name != null ? String(row.product_model_name) : undefined,
    price: price ?? undefined,
    images_url: row.images_url != null ? String(row.images_url) : undefined,
    product_url: row.product_url != null ? String(row.product_url) : undefined,
  }
}

/**
 * GET /api/product-variations?component=door&context=internal|external
 *
 * - context=internal → tiles, sofa_products, mattress_products (component=mattress), bed_products (component=bed), carpet_products (component=carpet), etc.
 * - context=external → product_variations (facade, door, window, balcony, canopy, lighting, etc.) for external customization
 */

const INTERNAL_COMPONENTS: Record<string, string> = {
  wall: 'wall',
  floor: 'floor', // uses flooring_options table
  ceiling: 'ceiling', // uses ceiling_options table
  'glass-partition': 'glass-partition', // uses glass_partition_options table
  decor: 'decor', // uses decor_products table
  sofa: 'sofa',
  mattress: 'mattress',
  bed: 'bed',
  carpet: 'carpet',
  rug: 'carpet',
  door: 'door',
  window: 'window',
  lighting: 'lighting',
  /** room_variations by component_type */
  chair: 'chair',
  desk: 'desk',
  table: 'table',
  dining: 'dining',
  dinning: 'dining',
  cabinet: 'cabinet',
}

const EXTERNAL_COMPONENTS: Record<string, string> = {
  wall: 'wall',
  floor: 'floor',
  ceiling: 'ceiling',
  sofa: 'sofa',
  chair: 'chair',
  desk: 'desk',
  table: 'table',
  cabinet: 'cabinet',
  door: 'door',
  window: 'window',
  'glass-partition': 'glass-partition',
  decor: 'decor',
  facade: 'facade',
  balcony: 'balcony',
  canopy: 'canopy',
  lighting: 'lighting',
  landscaping: 'landscaping',
  pathway: 'pathway',
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const component = searchParams.get('component')?.toLowerCase().trim()
  const context = (searchParams.get('context') ?? 'internal').toLowerCase() as 'internal' | 'external'

  if (!component) {
    return NextResponse.json(
      { error: 'Missing component.' },
      { status: 400 }
    )
  }

  const isInternal = context === 'internal'
  const componentMap = isInternal ? INTERNAL_COMPONENTS : EXTERNAL_COMPONENTS
  const componentTypeValue = componentMap[component]

  // Internal: unsupported types (floor, ceiling, etc.) return [] so UI can use CUSTOMIZATION_LIBRARY fallback
  if (isInternal && !componentTypeValue) {
    return NextResponse.json([])
  }
  if (!isInternal && !componentTypeValue) {
    return NextResponse.json(
      { error: 'Invalid or missing component for external. Use one of: wall, floor, ceiling, sofa, chair, desk, table, cabinet, door, window, glass-partition, decor, facade, balcony, canopy, lighting, landscaping, pathway.' },
      { status: 400 }
    )
  }

  try {
    let supabase
    try {
      supabase = getSupabaseServer()
    } catch {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !anon) {
        return NextResponse.json(
          { error: 'Supabase environment is missing. Configure NEXT_PUBLIC_SUPABASE_URL and keys.' },
          { status: 500 }
        )
      }
      // Fallback to anon client so catalog reads still work when service role key is absent.
      supabase = createClient(url, anon)
    }

    if (isInternal) {
      // Floor & Wall: use mytyles_vitrified_tiles (product catalog with images, price, colors, styles)
      if (component === 'floor' || component === 'wall') {
        const { data: rows, error } = await supabase
          .from('mytyles_vitrified_tiles')
          .select('id, product_name, price, description, colors, styles, image_url, filter_size, url')
          .order('id', { ascending: true })
          .limit(200)

        if (error) {
          console.error('Supabase mytyles_vitrified_tiles error:', error)
          return NextResponse.json(
            { error: 'Failed to fetch tile options.', details: error.message },
            { status: 502 }
          )
        }

        const list = (rows ?? []).map((row: Record<string, unknown>) => {
          const id = `tile_${row.id ?? ''}`
          const productName = String(row.product_name ?? '')
          const desc = String(row.description ?? '').trim()
          const description = desc.length > 120 ? desc.slice(0, 117) + '...' : desc || productName
          const colorsStr = String(row.colors ?? '')
          const firstColor = colorsStr.split(',')[0]?.trim() || ''
          const stylesStr = String(row.styles ?? '')
          const styleParts = stylesStr.split(',').map((s: string) => s.trim()).filter(Boolean)
          const material = styleParts[0] || 'Vitrified'
          const texture = styleParts[1] || ''
          const finish = styleParts[2] || ''
          const imageUrlRaw = String(row.image_url ?? '')
          const imageUrl = imageUrlRaw.split(',')[0]?.trim() || undefined
          const filterSize = String(row.filter_size ?? '')
          const price = row.price != null ? Number(row.price) : null
          const priceLabel = price != null && !Number.isNaN(price) ? ` ₹${price}` : ''
          const label = productName + (filterSize ? ` (${filterSize})` : '') + priceLabel
          return {
            id,
            label,
            description,
            color: firstColor || undefined,
            material: material || undefined,
            texture: texture || undefined,
            finish: finish || undefined,
            imageUrl: wrapCatalogImageForClient(imageUrl || undefined),
          }
        })
        return NextResponse.json(list)
      }

      // Ceiling: use ceiling_options table (same schema as flooring_options)
      if (component === 'ceiling') {
        const { data: rows, error } = await supabase
          .from('ceiling_options')
          .select('*')
          .order('id', { ascending: true })

        if (error) {
          console.error('Supabase ceiling_options error:', error)
          return NextResponse.json(
            { error: 'Failed to fetch ceiling options.', details: error.message },
            { status: 502 }
          )
        }

        const list = (rows ?? []).map((row: Record<string, unknown>) => {
          const id = String(row.id ?? '')
          const styleName = String(row.style_name ?? '')
          const material = String(row.material ?? '')
          const texture = String(row.texture ?? '')
          const finish = String(row.finish ?? '')
          const colorHex = String(row.color_hex ?? '')
          const category = String(row.category ?? '')
          const label = styleName || id
          const description = [material, texture, finish, category].filter(Boolean).join(', ') || label
          return { id, label, description, color: colorHex || undefined, material: material || undefined, texture: texture || undefined, finish: finish || undefined }
        })
        return NextResponse.json(list)
      }

      // Glass partition: use glass_partition_options table (id, color_hex, style_name, description, material, texture, finish, category)
      if (component === 'glass-partition') {
        const { data: rows, error } = await supabase
          .from('glass_partition_options')
          .select('*')
          .order('id', { ascending: true })

        if (error) {
          console.error('Supabase glass_partition_options error:', error)
          return NextResponse.json(
            { error: 'Failed to fetch glass partition options.', details: error.message },
            { status: 502 }
          )
        }

        const list = (rows ?? []).map((row: Record<string, unknown>) => {
          const id = String(row.id ?? '')
          const styleName = String(row.style_name ?? '')
          const desc = String(row.description ?? '')
          let material = String(row.material ?? '')
          // Don't show "Glass" in Material column: use empty for "Glass", or "Metal"/"Wood" for "Glass+Metal"/"Glass+Wood"
          if (material === 'Glass') material = ''
          else if (material === 'Glass+Metal') material = 'Metal'
          else if (material === 'Glass+Wood') material = 'Wood'
          const texture = String(row.texture ?? '')
          const finish = String(row.finish ?? '')
          const colorHex = String(row.color_hex ?? '')
          const category = String(row.category ?? '')
          const label = styleName || id
          const description = desc || [material, texture, finish, category].filter(Boolean).join(', ') || label
          return { id, label, description, color: colorHex || undefined, material: material || undefined, texture: texture || undefined, finish: finish || undefined }
        })
        return NextResponse.json(list)
      }

      // Decor: decor_products (Urban Ladder / IKEA catalog — same row shape as table_products / lighting)
      if (component === 'decor') {
        const { data: rows, error } = await supabase
          .from('decor_products')
          .select('*')
          .order('category', { ascending: true, nullsFirst: false })
          .order('id', { ascending: true })

        if (error) {
          console.error('Supabase decor_products error:', error)
          return NextResponse.json(
            { error: 'Failed to fetch decor catalog.', details: error.message },
            { status: 502 }
          )
        }

        return NextResponse.json((rows ?? []).map((row) => mapTableDeskCatalogRow(row, 'decor')))
      }

      // Bed: bed_products (Urban Ladder / catalog — same shape as chair_products)
      if (component === 'bed') {
        const { data: rows, error } = await supabase
          .from('bed_products')
          .select('*')
          .order('id', { ascending: true })

        if (error) {
          console.error('Supabase bed_products error:', error)
          return NextResponse.json(
            { error: 'Failed to fetch bed options.', details: error.message },
            { status: 502 }
          )
        }

        const list = (rows ?? []).map((row: Record<string, unknown>) => {
          const id = `bed_${row.id ?? ''}`
          const name = String(row.name ?? '')
          const desc = String(row.description ?? '').trim()
          const description = desc.length > 200 ? desc.slice(0, 197) + '...' : desc || name
          const imagesUrlRaw = String(row.images_url ?? '')
          const imageCandidates = imagesUrlRaw.split(/\s*\|\s*/).map((u) => u.trim()).filter(Boolean)
          const firstReal =
            imageCandidates.find((u) => !/dummy|placeholder/i.test(u)) ?? imageCandidates[0]
          const firstImage = firstReal || undefined
          const price = row.price != null ? Number(row.price) : null
          const priceLabel = price != null && !Number.isNaN(price) ? ` ₹${price.toLocaleString('en-IN')}` : ''
          const label = name + priceLabel
          const genericName = row.generic_name != null ? String(row.generic_name) : ''
          const materialType = row.primary_material_type != null ? String(row.primary_material_type) : ''
          const textureVal =
            row.primary_material_subtype != null
              ? String(row.primary_material_subtype)
              : row.seating_capacity != null
                ? String(row.seating_capacity)
                : undefined
          const bedCategory = row.category != null ? String(row.category) : ''
          return {
            id,
            label,
            description,
            imageUrl: wrapCatalogImageForClient(firstImage ?? undefined),
            material: genericName || materialType || undefined,
            texture: textureVal,
            category: bedCategory || undefined,
            color: row.colour != null ? String(row.colour) : undefined,
            name: name || undefined,
            brand: row.brand != null ? String(row.brand) : undefined,
            colour: row.colour != null ? String(row.colour) : undefined,
            warranty_in_months: row.warranty_in_months != null ? Number(row.warranty_in_months) : undefined,
            country_of_origin: row.country_of_origin != null ? String(row.country_of_origin) : undefined,
            length: row.length != null ? String(row.length) : undefined,
            width: row.width != null ? String(row.width) : undefined,
            height: row.height != null ? String(row.height) : undefined,
            net_weight: row.net_weight != null ? String(row.net_weight) : undefined,
            generic_name: row.generic_name != null ? String(row.generic_name) : undefined,
            primary_material_type: row.primary_material_type != null ? String(row.primary_material_type) : undefined,
            primary_material_subtype: row.primary_material_subtype != null ? String(row.primary_material_subtype) : undefined,
            primary_room: row.primary_room != null ? String(row.primary_room) : undefined,
            seating_capacity: row.seating_capacity != null ? String(row.seating_capacity) : undefined,
            product_model_name: row.product_model_name != null ? String(row.product_model_name) : undefined,
            price: price ?? undefined,
            images_url: row.images_url != null ? String(row.images_url) : undefined,
            product_url: row.product_url != null ? String(row.product_url) : undefined,
          }
        })
        return NextResponse.json(list)
      }

      // Carpet / rug / bath mat: carpet_products (same row shape as bed_products)
      if (component === 'carpet' || component === 'rug') {
        const { data: rows, error } = await supabase
          .from('carpet_products')
          .select('*')
          .order('id', { ascending: true })

        if (error) {
          console.error('Supabase carpet_products error:', error)
          return NextResponse.json(
            { error: 'Failed to fetch carpet options.', details: error.message },
            { status: 502 }
          )
        }

        const list = (rows ?? []).map((row: Record<string, unknown>) => {
          const id = `carpet_${row.id ?? ''}`
          const name = String(row.name ?? '')
          const desc = String(row.description ?? '').trim()
          const description = desc.length > 200 ? desc.slice(0, 197) + '...' : desc || name
          const imagesUrlRaw = String(row.images_url ?? '')
          const imageCandidates = imagesUrlRaw.split(/\s*\|\s*/).map((u) => u.trim()).filter(Boolean)
          const firstReal =
            imageCandidates.find((u) => !/dummy|placeholder/i.test(u)) ?? imageCandidates[0]
          const firstImage = firstReal || undefined
          const price = row.price != null ? Number(row.price) : null
          const priceLabel = price != null && !Number.isNaN(price) ? ` ₹${price.toLocaleString('en-IN')}` : ''
          const label = name + priceLabel
          const genericName = row.generic_name != null ? String(row.generic_name) : ''
          const materialType = row.primary_material_type != null ? String(row.primary_material_type) : ''
          const textureVal =
            row.primary_material_subtype != null
              ? String(row.primary_material_subtype)
              : row.seating_capacity != null
                ? String(row.seating_capacity)
                : undefined
          const carpetCategory = row.category != null ? String(row.category) : ''
          return {
            id,
            label,
            description,
            imageUrl: wrapCatalogImageForClient(firstImage ?? undefined),
            material: genericName || materialType || undefined,
            texture: textureVal,
            category: carpetCategory || undefined,
            color: row.colour != null ? String(row.colour) : undefined,
            name: name || undefined,
            brand: row.brand != null ? String(row.brand) : undefined,
            colour: row.colour != null ? String(row.colour) : undefined,
            warranty_in_months: row.warranty_in_months != null ? Number(row.warranty_in_months) : undefined,
            country_of_origin: row.country_of_origin != null ? String(row.country_of_origin) : undefined,
            length: row.length != null ? String(row.length) : undefined,
            width: row.width != null ? String(row.width) : undefined,
            height: row.height != null ? String(row.height) : undefined,
            net_weight: row.net_weight != null ? String(row.net_weight) : undefined,
            generic_name: row.generic_name != null ? String(row.generic_name) : undefined,
            primary_material_type: row.primary_material_type != null ? String(row.primary_material_type) : undefined,
            primary_material_subtype: row.primary_material_subtype != null ? String(row.primary_material_subtype) : undefined,
            primary_room: row.primary_room != null ? String(row.primary_room) : undefined,
            seating_capacity: row.seating_capacity != null ? String(row.seating_capacity) : undefined,
            product_model_name: row.product_model_name != null ? String(row.product_model_name) : undefined,
            price: price ?? undefined,
            images_url: row.images_url != null ? String(row.images_url) : undefined,
            product_url: row.product_url != null ? String(row.product_url) : undefined,
          }
        })
        return NextResponse.json(list)
      }

      // Mattress: mattress_products (Supabase catalog)
      if (component === 'mattress') {
        const { data: rows, error } = await supabase
          .from('mattress_products')
          .select('*')
          .order('id', { ascending: true })

        if (error) {
          console.error('Supabase mattress_products error:', error)
          return NextResponse.json(
            { error: 'Failed to fetch mattress options.', details: error.message },
            { status: 502 }
          )
        }

        const list = (rows ?? []).map((row: Record<string, unknown>) => {
          const id = `mattress_${row.id ?? ''}`
          const name = String(row.name ?? '')
          const desc = String(row.description ?? '').trim()
          const description = desc.length > 200 ? desc.slice(0, 197) + '...' : desc || name
          const imagesUrlRaw = String(row.images_url ?? '')
          const imageCandidates = imagesUrlRaw.split(/\s*\|\s*/).map((u) => u.trim()).filter(Boolean)
          const firstProductShot =
            imageCandidates.find((u) => !/(fitted-sheet|flat-sheet|\/sheet-|pillowcase|duvet)/i.test(u)) ??
            imageCandidates[0]
          const firstImage = firstProductShot || String(row.image_url ?? '').trim() || undefined
          const price = row.price != null ? Number(row.price) : null
          const priceLabel = price != null && !Number.isNaN(price) ? ` ₹${price.toLocaleString('en-IN')}` : ''
          const label = name + priceLabel
          const category = String(row.category ?? '')
          return {
            id,
            label,
            description,
            imageUrl: wrapCatalogImageForClient(firstImage ?? undefined),
            material: category || undefined,
            name: name || undefined,
            price: price ?? undefined,
            images_url: row.images_url != null ? String(row.images_url) : undefined,
            product_url: row.product_url != null ? String(row.product_url) : undefined,
            category: category || undefined,
          }
        })
        return NextResponse.json(list)
      }

      // Sofa: use sofa_products table (full catalog with name, brand, price, images, product_url, etc.)
      if (component === 'sofa') {
        const { data: rows, error } = await supabase
          .from('sofa_products')
          .select('*')
          .order('id', { ascending: true })

        if (error) {
          console.error('Supabase sofa_products error:', error)
          return NextResponse.json(
            { error: 'Failed to fetch sofa options.', details: error.message },
            { status: 502 }
          )
        }

        const list = (rows ?? []).map((row: Record<string, unknown>) => {
          const id = `sofa_${row.id ?? ''}`
          const name = String(row.name ?? '')
          const desc = String(row.description ?? '').trim()
          const description = desc.length > 200 ? desc.slice(0, 197) + '...' : desc || name
          const imagesUrlRaw = String(row.images_url ?? '')
          const imageCandidates = imagesUrlRaw.split(/\s*\|\s*/).map((u) => u.trim()).filter(Boolean)
          // Prefer a real product photo over placeholder "Dummy-Product" URLs (helps AI keep correct sofa scale).
          const firstReal =
            imageCandidates.find((u) => !/dummy|placeholder/i.test(u)) ?? imageCandidates[0]
          const firstImage = firstReal || undefined
          const price = row.price != null ? Number(row.price) : null
          const priceLabel = price != null && !Number.isNaN(price) ? ` ₹${price.toLocaleString('en-IN')}` : ''
          const label = name + priceLabel
          const genericName = row.generic_name != null ? String(row.generic_name) : ''
          const materialType = row.primary_material_type != null ? String(row.primary_material_type) : ''
          const textureVal = row.primary_material_subtype != null ? String(row.primary_material_subtype) : row.seating_capacity != null ? String(row.seating_capacity) : undefined
          const sofaCategory = row.category != null ? String(row.category) : ''
          return {
            id,
            label,
            description,
            imageUrl: wrapCatalogImageForClient(firstImage ?? undefined),
            material: genericName || materialType || undefined,
            texture: textureVal,
            category: sofaCategory || undefined,
            color: row.colour != null ? String(row.colour) : undefined,
            // Full catalog fields for detail view when user clicks on a sofa
            name: name || undefined,
            brand: row.brand != null ? String(row.brand) : undefined,
            colour: row.colour != null ? String(row.colour) : undefined,
            warranty_in_months: row.warranty_in_months != null ? Number(row.warranty_in_months) : undefined,
            country_of_origin: row.country_of_origin != null ? String(row.country_of_origin) : undefined,
            length: row.length != null ? String(row.length) : undefined,
            width: row.width != null ? String(row.width) : undefined,
            height: row.height != null ? String(row.height) : undefined,
            net_weight: row.net_weight != null ? String(row.net_weight) : undefined,
            generic_name: row.generic_name != null ? String(row.generic_name) : undefined,
            primary_material_type: row.primary_material_type != null ? String(row.primary_material_type) : undefined,
            primary_material_subtype: row.primary_material_subtype != null ? String(row.primary_material_subtype) : undefined,
            primary_room: row.primary_room != null ? String(row.primary_room) : undefined,
            seating_capacity: row.seating_capacity != null ? String(row.seating_capacity) : undefined,
            product_model_name: row.product_model_name != null ? String(row.product_model_name) : undefined,
            price: price ?? undefined,
            images_url: row.images_url != null ? String(row.images_url) : undefined,
            product_url: row.product_url != null ? String(row.product_url) : undefined,
          }
        })
        return NextResponse.json(list)
      }

      // Chair: chair_products (Urban Ladder / IKEA catalog, same shape as sofa_products)
      if (component === 'chair') {
        const { data: rows, error } = await supabase
          .from('chair_products')
          .select('*')
          .order('id', { ascending: true })

        if (error) {
          console.error('Supabase chair_products error:', error)
          return NextResponse.json(
            { error: 'Failed to fetch chair options.', details: error.message },
            { status: 502 }
          )
        }

        const list = (rows ?? []).map((row: Record<string, unknown>) => {
          const id = `chair_${row.id ?? ''}`
          const name = String(row.name ?? '')
          const desc = String(row.description ?? '').trim()
          const description = desc.length > 200 ? desc.slice(0, 197) + '...' : desc || name
          const imagesUrlRaw = String(row.images_url ?? '')
          const imageCandidates = imagesUrlRaw.split(/\s*\|\s*/).map((u) => u.trim()).filter(Boolean)
          const firstReal =
            imageCandidates.find((u) => !/dummy|placeholder/i.test(u)) ?? imageCandidates[0]
          const firstImage = firstReal || undefined
          const price = row.price != null ? Number(row.price) : null
          const priceLabel = price != null && !Number.isNaN(price) ? ` ₹${price.toLocaleString('en-IN')}` : ''
          const label = name + priceLabel
          const genericName = row.generic_name != null ? String(row.generic_name) : ''
          const materialType = row.primary_material_type != null ? String(row.primary_material_type) : ''
          const textureVal =
            row.primary_material_subtype != null
              ? String(row.primary_material_subtype)
              : row.seating_capacity != null
                ? String(row.seating_capacity)
                : undefined
          const chairCategory = row.category != null ? String(row.category) : ''
          return {
            id,
            label,
            description,
            imageUrl: wrapCatalogImageForClient(firstImage ?? undefined),
            material: genericName || materialType || undefined,
            texture: textureVal,
            category: chairCategory || undefined,
            color: row.colour != null ? String(row.colour) : undefined,
            name: name || undefined,
            brand: row.brand != null ? String(row.brand) : undefined,
            colour: row.colour != null ? String(row.colour) : undefined,
            warranty_in_months: row.warranty_in_months != null ? Number(row.warranty_in_months) : undefined,
            country_of_origin: row.country_of_origin != null ? String(row.country_of_origin) : undefined,
            length: row.length != null ? String(row.length) : undefined,
            width: row.width != null ? String(row.width) : undefined,
            height: row.height != null ? String(row.height) : undefined,
            net_weight: row.net_weight != null ? String(row.net_weight) : undefined,
            generic_name: row.generic_name != null ? String(row.generic_name) : undefined,
            primary_material_type: row.primary_material_type != null ? String(row.primary_material_type) : undefined,
            primary_material_subtype: row.primary_material_subtype != null ? String(row.primary_material_subtype) : undefined,
            primary_room: row.primary_room != null ? String(row.primary_room) : undefined,
            seating_capacity: row.seating_capacity != null ? String(row.seating_capacity) : undefined,
            product_model_name: row.product_model_name != null ? String(row.product_model_name) : undefined,
            price: price ?? undefined,
            images_url: row.images_url != null ? String(row.images_url) : undefined,
            product_url: row.product_url != null ? String(row.product_url) : undefined,
          }
        })
        return NextResponse.json(list)
      }

      // Table / desk: table_products filtered by ui_target (coffee tables, side tables, IKEA conference/foldable vs study desks)
      if (component === 'table') {
        const { data: rows, error } = await withSupabaseRetry(
          async () => {
            // Supabase query builders are Promise-like; wrap in async so the runner returns a real Promise<QueryResult<T>>.
            const r = await supabase
              .from('table_products')
              .select('*')
              .eq('ui_target', 'table')
              .order('id', { ascending: true })
            return { data: r.data, error: r.error }
          },
          'table_products (table)'
        )

        if (error) {
          console.error('Supabase table_products (table) error:', error)
          return NextResponse.json(
            { error: 'Failed to fetch table options.', details: error.message },
            { status: 502 }
          )
        }
        return NextResponse.json((rows ?? []).map((row) => mapTableDeskCatalogRow(row, 'table')))
      }

      if (component === 'dining' || component === 'dinning') {
        const isMissingTableError = (err: unknown): boolean => {
          if (!err || typeof err !== 'object') return false
          const code = (err as { code?: string }).code
          return code === 'PGRST205'
        }
        const readDiningRows = async (tableName: 'dining_products' | 'dinning_products') => {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('category', { ascending: true, nullsFirst: false })
            .order('id', { ascending: true })
          return { data, error }
        }
        const tableExists = async (tableName: string): Promise<boolean> => {
          const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_name', tableName)
            .limit(1)
          if (error) return false
          return (data?.length ?? 0) > 0
        }
        const readLegacySplitRows = async (
          tableName: 'dining_table_products' | 'dining_chair_products'
        ) => {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('category', { ascending: true, nullsFirst: false })
            .order('id', { ascending: true })
          return { data, error }
        }

        let rows: Record<string, unknown>[] | null = null
        let error: { message: string; code?: string } | null = null
        // Try merged dining tables first (silent on missing table, continue fallback chain).
        const mergedCandidates: Array<'dinning_products' | 'dining_products'> = [
          'dinning_products',
          'dining_products',
        ]
        for (const table of mergedCandidates) {
          const r = await readDiningRows(table)
          if (r.error) {
            if (isMissingTableError(r.error)) continue
            error = { message: r.error.message, code: (r.error as { code?: string }).code }
            break
          }
          const dataRows = (r.data as Record<string, unknown>[] | null) ?? null
          if (dataRows && dataRows.length > 0) {
            rows = dataRows
            break
          }
        }

        // Final fallback for DBs still on older split-table state.
        if (!error && (!rows || rows.length === 0)) {
          const [tablesRes, chairsRes] = await Promise.all([
            readLegacySplitRows('dining_table_products'),
            readLegacySplitRows('dining_chair_products'),
          ])
          const mergedLegacy = [...(tablesRes.data ?? []), ...(chairsRes.data ?? [])]
          if (mergedLegacy.length > 0) {
            rows = mergedLegacy
          } else if (tablesRes.error && chairsRes.error) {
            // Only surface legacy errors when both fail with non-missing-table errors.
            if (!isMissingTableError(tablesRes.error) && !isMissingTableError(chairsRes.error)) {
              error = {
                message: tablesRes.error.message,
                code: (tablesRes.error as { code?: string }).code,
              }
            }
          }
        }

        // Last-resort compatibility: older data may have been inserted into table_products/chair_products.
        // Pull rows that look like dining records and normalize them to dining catalog shape.
        if (!error && (!rows || rows.length === 0)) {
          const [tableRowsRes, chairRowsRes] = await Promise.all([
            supabase
              .from('table_products')
              .select('*')
              .or('category.ilike.%dining%,name.ilike.%dining%')
              .order('id', { ascending: true }),
            supabase
              .from('chair_products')
              .select('*')
              .or('category.ilike.%dining%,name.ilike.%dining%')
              .order('id', { ascending: true }),
          ])

          const fallbackRows = [
            ...(tableRowsRes.data ?? []),
            ...(chairRowsRes.data ?? []),
          ]
          if (fallbackRows.length > 0) {
            rows = fallbackRows
          } else if (tableRowsRes.error && chairRowsRes.error) {
            if (!isMissingTableError(tableRowsRes.error) && !isMissingTableError(chairRowsRes.error)) {
              error = {
                message: tableRowsRes.error.message,
                code: (tableRowsRes.error as { code?: string }).code,
              }
            }
          }
        }

        if (error) {
          console.error('Supabase dining catalog fetch error:', error)
          return NextResponse.json(
            { error: 'Failed to fetch dining options.', details: error.message },
            { status: 502 }
          )
        }
        return NextResponse.json((rows ?? []).map((row) => mapTableDeskCatalogRow(row, 'dining')))
      }

      if (component === 'desk') {
        const { data: rows, error } = await withSupabaseRetry(
          async () => {
            const r = await supabase
              .from('table_products')
              .select('*')
              .eq('ui_target', 'desk')
              .order('id', { ascending: true })
            return { data: r.data, error: r.error }
          },
          'table_products (desk)'
        )

        if (error) {
          console.error('Supabase table_products (desk) error:', error)
          return NextResponse.json(
            { error: 'Failed to fetch desk options.', details: error.message },
            { status: 502 }
          )
        }
        return NextResponse.json((rows ?? []).map((row) => mapTableDeskCatalogRow(row, 'desk')))
      }

      // Cabinet / storage: sideboards, shoe racks, bookshelves, chests (cabinet_products)
      if (component === 'cabinet') {
        const { data: rows, error } = await supabase
          .from('cabinet_products')
          .select('*')
          .order('category', { ascending: true, nullsFirst: false })
          .order('id', { ascending: true })

        if (error) {
          console.error('Supabase cabinet_products error:', error)
          return NextResponse.json(
            { error: 'Failed to fetch cabinet / storage options.', details: error.message },
            { status: 502 }
          )
        }
        return NextResponse.json((rows ?? []).map((row) => mapTableDeskCatalogRow(row, 'cabinet')))
      }

      // Lighting: lighting_products (Urban Ladder / IKEA catalog, same pattern as sofa_products)
      if (component === 'lighting') {
        const { data: rows, error } = await supabase
          .from('lighting_products')
          .select('*')
          .order('id', { ascending: true })

        if (error) {
          console.error('Supabase lighting_products error:', error)
          return NextResponse.json(
            { error: 'Failed to fetch lighting options.', details: error.message },
            { status: 502 }
          )
        }

        const list = (rows ?? []).map((row: Record<string, unknown>) => {
          const id = `lighting_${row.id ?? ''}`
          const name = String(row.name ?? '')
          const desc = String(row.description ?? '').trim()
          const description = desc.length > 200 ? desc.slice(0, 197) + '...' : desc || name
          const imagesUrlRaw = String(
            row.image_urls ?? row.images_url ?? row.image_url ?? ''
          )
          const imageCandidates = imagesUrlRaw.split(/\s*\|\s*/).map((u) => u.trim()).filter(Boolean)
          const firstReal =
            imageCandidates.find((u) => !/dummy|placeholder/i.test(u)) ?? imageCandidates[0]
          const firstImage = firstReal || undefined
          const price = row.price != null ? Number(row.price) : null
          const priceLabel = price != null && !Number.isNaN(price) ? ` ₹${price.toLocaleString('en-IN')}` : ''
          const label = name + priceLabel
          const category = row.category != null ? String(row.category) : ''
          const materialType = row.primary_material_type != null ? String(row.primary_material_type) : ''
          return {
            id,
            label,
            description,
            imageUrl: wrapCatalogImageForClient(firstImage ?? undefined),
            material: materialType || category || undefined,
            category: category || undefined,
            color: row.colour != null ? String(row.colour) : undefined,
            name: name || undefined,
            price: price ?? undefined,
            product_url: row.product_url != null ? String(row.product_url) : undefined,
          }
        })
        return NextResponse.json(list)
      }

      // room_variations: component_type, product_code, variation_code, color, material, texture, finish, size
      const { data: rows, error } = await supabase
        .from('room_variations')
        .select('*')
        .ilike('component_type', componentTypeValue)

      if (error) {
        console.error('Supabase room_variations error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch variations.', details: error.message },
          { status: 502 }
        )
      }

      const list = (rows ?? []).map((row: Record<string, unknown>) => {
        const productCode = String(row.product_code ?? '')
        const variationCode = String(row.variation_code ?? '')
        const color = String(row.color ?? '')
        const material = String(row.material ?? '')
        const texture = String(row.texture ?? '')
        const finish = String(row.finish ?? '')
        const size = String(row.size ?? '')
        const id = variationCode || (productCode && variationCode ? `${productCode}_${variationCode}` : '') || `var_${Math.random().toString(36).slice(2, 9)}`
        const label = [color, material, texture, finish].filter(Boolean).join(' ') || variationCode || id
        const description = [color, material, texture, finish, size].filter(Boolean).join(', ') || label
        return { id, label, description, color: color || undefined, material: material || undefined, texture: texture || undefined, finish: finish || undefined }
      })
      return NextResponse.json(list)
    }

    // External: product_variations
    const { data: rows, error } = await supabase
      .from('product_variations')
      .select('*')
      .ilike('component_type', componentTypeValue)

    if (error) {
      console.error('Supabase product_variations error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch variations.', details: error.message },
        { status: 502 }
      )
    }

    const list = (rows ?? []).map((row: Record<string, unknown>) => {
      const componentCode = String(row.component_code ?? row.product_code ?? '')
      const variationCode = String(row.variation_code ?? '')
      const variationName = String(row.variation_name ?? '')
      const color = String(row.color ?? '')
      const material = String(row.material ?? '')
      const texture = String(row.texture ?? '')
      const styleFamily = String(row.style_family ?? '')
      const id = variationCode || (componentCode && variationCode ? `${componentCode}_${variationCode}` : '') || `var_${Math.random().toString(36).slice(2, 9)}`
      const label = variationName || [color, material, texture].filter(Boolean).join(' ') || variationCode || id
      const description = [color, material, texture, styleFamily].filter(Boolean).join(', ') || label
      return { id, label, description, color: color || undefined, material: material || undefined, texture: texture || undefined }
    })
    return NextResponse.json(list)
  } catch (err) {
    console.error('product-variations API error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch product variations.' },
      { status: 500 }
    )
  }
}
