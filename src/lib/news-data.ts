const NEWS_URL = "https://functions.poehali.dev/b33c4df8-295a-4694-a485-e771aec3d9ce";

export interface RawNewsItem {
  id: number;
  title: string;
  text: string;
  photos: string[];
  video_url: string;
  published_at: string;
  created_at: string;
  likes: number;
  views: number;
}

/** Public news list for route loaders (SSR). Returns null on failure so the page falls back to client loading. */
export async function fetchNewsList(): Promise<RawNewsItem[] | null> {
  try {
    const r = await fetch(NEWS_URL);
    if (!r.ok) return null;
    const d = await r.json();
    return Array.isArray(d.news) ? (d.news as RawNewsItem[]) : [];
  } catch {
    return null;
  }
}
