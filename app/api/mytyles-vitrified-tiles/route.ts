import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function firstImageUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const first = raw.split(',')[0]?.trim();
  return first || null;
}

/**
 * GET /api/mytyles-vitrified-tiles
 * Public read (RLS) — uses anon key so Internalconfigf can load tiles without service role.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({
      items: [] as { id: number; label: string; imageUrl: string }[],
      warning: 'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for Mytyles tiles.',
    });
  }

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase
    .from('mytyles_vitrified_tiles')
    .select('id, product_name, image_url')
    .order('id', { ascending: true })
    .limit(500);

  if (error) {
    return NextResponse.json({ items: [], error: error.message });
  }

  const items = (data ?? [])
    .map((row: { id: number; product_name: string | null; image_url: string | null }) => {
      const imageUrl = firstImageUrl(row.image_url);
      if (!imageUrl) return null;
      return {
        id: row.id,
        label: (row.product_name?.trim() || `Tile #${row.id}`).slice(0, 200),
        imageUrl,
      };
    })
    .filter((x): x is { id: number; label: string; imageUrl: string } => x != null);

  return NextResponse.json({ items });
}
