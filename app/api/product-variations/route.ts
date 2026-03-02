import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/app/lib/supabase'

/**
 * GET /api/product-variations?component=door&context=internal|external
 *
 * - context=internal → room_variations (sofa, wall, door, window) for internal room customization
 * - context=external → product_variations (facade, door, window, balcony, canopy, lighting, etc.) for external customization
 */

const INTERNAL_COMPONENTS: Record<string, string> = {
  wall: 'wall',
  floor: 'floor', // uses flooring_options table
  sofa: 'sofa',
  door: 'door',
  window: 'window',
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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json([])
    }
    const supabase = getSupabaseServer()

    if (isInternal) {
      // Floor: use flooring_options table (id, color_hex, style_name, material, texture, finish, category)
      if (component === 'floor') {
        const { data: rows, error } = await supabase
          .from('flooring_options')
          .select('*')
          .order('id', { ascending: true })

        if (error) {
          console.error('Supabase flooring_options error:', error)
          return NextResponse.json(
            { error: 'Failed to fetch flooring options.', details: error.message },
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
