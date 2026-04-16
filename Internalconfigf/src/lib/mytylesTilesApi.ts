import { buildApiUrl } from './apiUrl';

export type MytylesTileItem = { id: number; label: string; imageUrl: string };

type ApiResponse = {
  items?: MytylesTileItem[];
  error?: string;
  warning?: string;
};

export async function fetchMytylesVitrifiedTiles(): Promise<{
  items: MytylesTileItem[];
  error?: string;
  warning?: string;
}> {
  try {
    const res = await fetch(buildApiUrl('/api/mytyles-vitrified-tiles'));
    const data = (await res.json()) as ApiResponse;
    return {
      items: Array.isArray(data.items) ? data.items : [],
      error: typeof data.error === 'string' ? data.error : undefined,
      warning: typeof data.warning === 'string' ? data.warning : undefined,
    };
  } catch (e) {
    return {
      items: [],
      error: e instanceof Error ? e.message : 'Failed to load tiles',
    };
  }
}
