import { buildApiUrl } from './apiUrl';

export type DiningCatalogItem = { id: string; label: string; imageUrl: string };

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=400&q=80';

type ApiRow = {
  id?: string | number;
  label?: string;
  name?: string;
  imageUrl?: string;
  images_url?: string;
  image_url?: string;
};

export async function fetchDiningProductsForEdit(): Promise<{
  items: DiningCatalogItem[];
  error?: string;
}> {
  try {
    // Use the same component key as your Supabase table naming (`dinning_products`).
    const res = await fetch(buildApiUrl('/api/product-variations?component=dinning&context=internal'));
    const data = (await res.json()) as unknown;
    if (data && typeof data === 'object' && !Array.isArray(data) && 'error' in data) {
      const err = (data as { error?: string }).error;
      return {
        items: [],
        error: typeof err === 'string' ? err : 'Failed to load dining catalog',
      };
    }
    const list = Array.isArray(data) ? (data as ApiRow[]) : [];
    const items: DiningCatalogItem[] = list
      .filter((row) => row && row.id != null && String(row.id).trim().length > 0)
      .map((row) => {
        const id = String(row.id).trim();
        const label =
          typeof row.label === 'string' && row.label.trim()
            ? row.label.trim()
            : typeof row.name === 'string' && row.name.trim()
              ? row.name.trim()
              : id;
        const imageCandidates = [
          typeof row.imageUrl === 'string' ? row.imageUrl : '',
          typeof row.images_url === 'string' ? row.images_url.split(/\s*\|\s*/)[0] : '',
          typeof row.image_url === 'string' ? row.image_url : '',
        ]
          .map((s) => s.trim())
          .filter(Boolean);
        const imageUrl = imageCandidates[0] || FALLBACK_IMG;
        return { id, label, imageUrl };
      });
    if (items.length === 0) {
      return {
        items: [],
        error: 'No records found in dining_products for Dining catalog.',
      };
    }
    return { items };
  } catch (e) {
    return {
      items: [],
      error: e instanceof Error ? e.message : 'Failed to load dining catalog',
    };
  }
}

