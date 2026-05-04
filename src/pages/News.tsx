import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import Icon from "@/components/ui/icon";
import SiteNav from "@/components/shared/SiteNav";

const NEWS_URL = "https://functions.poehali.dev/b33c4df8-295a-4694-a485-e771aec3d9ce";
const VK_SYNC_URL = "https://functions.poehali.dev/ce64965a-09e0-411a-bbed-d25e01b5c170";
const SYNC_KEY = "vk_last_sync";
const PAGE_SIZE = 10;

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
  const vkMatch = url.match(/vk\.com\/video(-?\d+_\d+)/) || url.match(/vkvideo\.ru\/video(-?\d+_\d+)/);
  if (vkMatch) return `https://vk.com/video_ext.php?oid=${vkMatch[1].split('_')[0]}&id=${vkMatch[1].split('_')[1]}&hd=2`;
  const rutubeMatch = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
  if (rutubeMatch) return `https://rutube.ru/play/embed/${rutubeMatch[1]}`;
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return null;
}

function cleanText(text: string, title: string) {
  let t = text.replace(/\n\n?—?\s*https:\/\/vk\.com\/wall[^\n]*/g, "").trim();
  // Убираем первую строку если она совпадает с заголовком
  const firstLine = t.split("\n")[0].trim();
  if (firstLine === title.trim() || t.startsWith(title.trim())) {
    t = t.slice(firstLine.length).replace(/^\n+/, "").trim();
  }
  return t;
}

interface ImgSize { url: string; w: number; h: number; }

function PhotoGrid({ photos, onOpen }: { photos: string[]; onOpen: (idx: number) => void }) {
  const [sizes, setSizes] = useState<ImgSize[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.all(
      photos.map(
        (url) =>
          new Promise<ImgSize>((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ url, w: img.naturalWidth, h: img.naturalHeight });
            img.onerror = () => resolve({ url, w: 4, h: 3 });
            img.src = url;
          })
      )
    ).then((s) => { if (alive) setSizes(s); });
    return () => { alive = false; };
  }, [photos]);

  if (sizes.length === 0) return null;

  const count = sizes.length;

  // 1 фото — полная ширина с реальными пропорциями
  if (count === 1) {
    const { url, w, h } = sizes[0];
    const ratio = (h / w) * 100;
    return (
      <div className="px-8 md:px-10 pb-8">
        <button onClick={() => onOpen(0)} className="w-full overflow-hidden rounded-sm hover:opacity-95 transition-opacity" style={{ paddingBottom: `${Math.min(ratio, 75)}%`, position: "relative" }}>
          <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        </button>
      </div>
    );
  }

  // 2 фото — две колонки с пропорциями
  if (count === 2) {
    return (
      <div className="px-8 md:px-10 pb-8 flex gap-3">
        {sizes.map(({ url, w, h }, idx) => {
          const ratio = (h / w) * 100;
          return (
            <button key={idx} onClick={() => onOpen(idx)} className="flex-1 overflow-hidden rounded-sm hover:opacity-95 transition-opacity relative" style={{ paddingBottom: `${Math.min(ratio, 80)}%` }}>
              <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </button>
          );
        })}
      </div>
    );
  }

  // 3+ фото — masonry через CSS columns
  return (
    <div className="px-8 md:px-10 pb-8">
      <div style={{ columns: count >= 4 ? 3 : 2, columnGap: "12px" }}>
        {sizes.map(({ url, w, h }, idx) => {
          const ratio = (h / w) * 100;
          return (
            <button
              key={idx}
              onClick={() => onOpen(idx)}
              className="w-full overflow-hidden rounded-sm hover:opacity-95 transition-opacity relative mb-3 block"
              style={{ paddingBottom: `${Math.min(ratio, 120)}%` }}
            >
              <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function News() {
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ photos: string[]; idx: number } | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lastSync = localStorage.getItem(SYNC_KEY);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (!lastSync || Number(lastSync) < oneDayAgo) {
      fetch(VK_SYNC_URL, { method: "POST" }).then(() => {
        localStorage.setItem(SYNC_KEY, String(Date.now()));
      });
    }
    fetch(NEWS_URL)
      .then((r) => r.json())
      .then((d) => {
        const cleaned = (d.news || []).map((n: NewsItem) => ({
          ...n,
          text: cleanText(n.text, n.title),
        }));
        setAllNews(cleaned);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((v) => Math.min(v + PAGE_SIZE, allNews.length));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [allNews.length]);

  const news = allNews.slice(0, visible);
  const hasMore = visible < allNews.length;

  return (
    <div className="min-h-screen bg-beige font-golos">
      <Helmet>
        <title>Новости — АНО «Спасение надежды»</title>
        <meta name="description" content="Актуальные новости кризисного центра «Спасение надежды» в Пензе. Помощь семьям в трудной жизненной ситуации." />
        <meta property="og:title" content="Новости — АНО «Спасение надежды»" />
        <meta property="og:description" content="Актуальные новости кризисного центра «Спасение надежды» в Пензе." />
        <link rel="canonical" href="https://spasenie58.ru/news" />
      </Helmet>
      <SiteNav />

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
                    <PhotoGrid
                      photos={item.photos}
                      onOpen={(idx) => setLightbox({ photos: item.photos, idx })}
                    />
                  )}
                </article>
              );
            })}

            <div ref={sentinelRef} className="py-4 flex justify-center">
              {hasMore && (
                <div className="flex gap-2 items-center text-sage/50 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-sage/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-sage/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-sage/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>
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