import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const NEWS_URL = "https://functions.poehali.dev/b33c4df8-295a-4694-a485-e771aec3d9ce";
const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";

interface NewsItem {
  id: number;
  title: string;
  text: string;
  photos: string[];
  video_url: string;
  published_at: string;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  // VK видео
  const vkMatch = url.match(/vk\.com\/video(-?\d+_\d+)/) || url.match(/vkvideo\.ru\/video(-?\d+_\d+)/);
  if (vkMatch) return `https://vk.com/video_ext.php?oid=${vkMatch[1].split('_')[0]}&id=${vkMatch[1].split('_')[1]}&hd=2`;
  // Rutube
  const rutubeMatch = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
  if (rutubeMatch) return `https://rutube.ru/play/embed/${rutubeMatch[1]}`;
  // YouTube
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return null;
}

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ photos: string[]; idx: number } | null>(null);

  useEffect(() => {
    fetch(NEWS_URL)
      .then((r) => r.json())
      .then((d) => setNews(d.news || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-beige font-golos">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-beige/95 backdrop-blur-sm border-b border-beige-dark">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="Спасение надежды" className="w-14 h-14 object-contain" />
            <div>
              <div className="font-cormorant text-ink text-lg font-semibold leading-none">Спасение надежды</div>
              <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Кризисный центр</div>
            </div>
          </a>
          <a href="/" className="flex items-center gap-2 text-ink/60 hover:text-ink text-sm transition-colors font-golos">
            <Icon name="ArrowLeft" size={14} />
            На главную
          </a>
        </div>
      </nav>

      <div className="pt-24 pb-20 max-w-5xl mx-auto px-6">
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-sage" />
            <span className="text-sage text-xs tracking-[0.2em] uppercase font-golos">Новости центра</span>
          </div>
          <h1 className="font-cormorant text-ink text-5xl md:text-6xl font-light leading-tight">
            Наши <span className="text-sage font-semibold">новости</span>
          </h1>
        </div>

        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-sm p-8 animate-pulse">
                <div className="h-4 bg-beige-dark rounded w-32 mb-4" />
                <div className="h-6 bg-beige-dark rounded w-2/3 mb-3" />
                <div className="h-4 bg-beige-dark rounded w-full mb-2" />
                <div className="h-4 bg-beige-dark rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-24 text-foreground/40">
            <Icon name="Newspaper" size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">Новостей пока нет</p>
          </div>
        ) : (
          <div className="space-y-10">
            {news.map((item) => {
              const embedUrl = getEmbedUrl(item.video_url);
              return (
                <article key={item.id} className="bg-white rounded-sm overflow-hidden shadow-sm">
                  <div className="p-8 md:p-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px w-5 bg-sage" />
                      <time className="text-muted-foreground text-xs uppercase tracking-wider">{formatDate(item.published_at)}</time>
                    </div>
                    <h2 className="font-cormorant text-ink text-3xl font-semibold leading-snug mb-5">{item.title}</h2>
                    <p className="text-foreground/70 leading-relaxed whitespace-pre-wrap">{item.text}</p>
                  </div>

                  {embedUrl && (
                    <div className="px-8 md:px-10 pb-6">
                      <div className="aspect-video w-full rounded-sm overflow-hidden bg-black">
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          allowFullScreen
                          allow="autoplay; encrypted-media; fullscreen"
                          frameBorder="0"
                        />
                      </div>
                    </div>
                  )}

                  {item.photos.length > 0 && (
                    <div className={`px-8 md:px-10 pb-8 grid gap-3 ${
                      item.photos.length === 1 ? "grid-cols-1" :
                      item.photos.length === 2 ? "grid-cols-2" :
                      "grid-cols-2 md:grid-cols-3"
                    }`}>
                      {item.photos.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setLightbox({ photos: item.photos, idx })}
                          className="overflow-hidden rounded-sm aspect-video bg-beige-mid hover:opacity-90 transition-opacity"
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setLightbox(null)}>
            <Icon name="X" size={28} />
          </button>
          {lightbox.photos.length > 1 && (
            <>
              <button className="absolute left-4 text-white/70 hover:text-white"
                onClick={(e) => { e.stopPropagation(); setLightbox(l => l && l.idx > 0 ? { ...l, idx: l.idx - 1 } : l); }}>
                <Icon name="ChevronLeft" size={36} />
              </button>
              <button className="absolute right-4 text-white/70 hover:text-white"
                onClick={(e) => { e.stopPropagation(); setLightbox(l => l && l.idx < l.photos.length - 1 ? { ...l, idx: l.idx + 1 } : l); }}>
                <Icon name="ChevronRight" size={36} />
              </button>
            </>
          )}
          <img src={lightbox.photos[lightbox.idx]} alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-sm"
            onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
