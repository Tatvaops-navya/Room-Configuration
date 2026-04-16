import { buildApiUrl } from './apiUrl';

export type CarpetCatalogItem = { id: string; label: string; imageUrl: string };

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1600166898405-3aad6191b57b?w=400&q=80';

type ApiRow = {
  id?: string;
  label?: string;
  name?: string;
  imageUrl?: string;
};

export async function fetchCarpetProductsForEdit(): Promise<{
  items: CarpetCatalogItem[];
  error?: string;
}> {
  try {
    const res = await fetch(buildApiUrl('/api/product-variations?component=carpet&context=internal'));
    const data = (await res.json()) as unknown;
    if (data && typeof data === 'object' && !Array.isArray(data) && 'error' in data) {
      const err = (data as { error?: string }).error;
      return {
        items: [],
        error: typeof err === 'string' ? err : 'Failed to load carpets / rugs',
      };
    }
    const list = Array.isArray(data) ? (data as ApiRow[]) : [];
    const items: CarpetCatalogItem[] = list
      .filter((row) => row && typeof row.id === 'string' && row.id.length > 0)
      .map((row) => {
        const label =
          typeof row.label === 'string' && row.label.trim()
            ? row.label.trim()
            : typeof row.name === 'string' && row.name.trim()
              ? row.name.trim()
              : row.id!;
        const imageUrl =
          typeof row.imageUrl === 'string' && row.imageUrl.trim()
            ? row.imageUrl.trim()
            : FALLBACK_IMG;
        return { id: row.id!, label, imageUrl };
      });
    return { items };
  } catch (e) {
    return {
      items: [],
      error: e instanceof Error ? e.message : 'Failed to load carpets / rugs',
    };
  }
}
