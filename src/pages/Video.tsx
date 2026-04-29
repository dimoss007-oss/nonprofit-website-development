import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const VK_VIDEO_URL = "https://functions.poehali.dev/069cd870-0198-4be7-be81-67fb46d178b9";
const VK_GROUP_URL = "https://vk.com/spasenienadezhdi";
const VIDEOS_PER_PAGE = 9;

interface Video {
  id: number;
  title: string;
  description: string;
  duration: number;
  date: string;
  timestamp: number;
  thumb: string | null;
  player: string;
  url: string;
  views: number;
  likes: number;
}

function formatDuration(sec: number): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VideoCard({ video, onPlay }: { video: Video; onPlay: (v: Video) => void }) {
  return (
    <article
      className="group bg-beige rounded-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={() => onPlay(video)}
    >
      <div className="relative aspect-video overflow-hidden bg-sage-pale">
        {video.thumb ? (
          <img src={video.thumb} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="Video" size={32} className="text-sage/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-ink/20 group-hover:bg-ink/30 transition-colors duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-beige/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Icon name="Play" size={22} className="text-sage ml-1" />
          </div>
        </div>
        {video.duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-ink/70 text-beige text-xs px-2 py-0.5 rounded">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-cormorant text-ink text-lg font-semibold leading-snug mb-2 group-hover:text-sage transition-colors line-clamp-2">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-muted-foreground text-xs leading-relaxed mb-3 line-clamp-2">{video.description}</p>
        )}
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Icon name="Heart" size={11} /> {video.likes}</span>
            {video.views > 0 && <span className="flex items-center gap-1"><Icon name="Eye" size={11} /> {video.views.toLocaleString()}</span>}
          </div>
          <span>{video.date}</span>
        </div>
      </div>
    </article>
  );
}

function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-beige rounded-sm w-full max-w-4xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-beige-dark">
          <h3 className="font-cormorant text-ink text-xl font-semibold line-clamp-1 pr-4">{video.title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-ink transition-colors flex-shrink-0">
            <Icon name="X" size={20} />
          </button>
        </div>

        {video.player ? (
          <div className="aspect-video">
            <iframe
              src={video.player}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen"
            />
          </div>
        ) : (
          <div className="aspect-video bg-sage-pale flex flex-col items-center justify-center gap-4">
            <Icon name="Video" size={40} className="text-sage/40" />
            <p className="text-muted-foreground text-sm">Видео недоступно для встроенного просмотра</p>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-sage text-beige text-sm font-golos uppercase tracking-wide rounded-sm hover:bg-sage-dark transition-colors"
            >
              Открыть в ВКонтакте
            </a>
          </div>
        )}

        {video.description && (
          <div className="p-4 border-t border-beige-dark">
            <p className="text-foreground/65 text-sm leading-relaxed">{video.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VideoPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  const fetchVideos = async (currentOffset: number, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const res = await fetch(`${VK_VIDEO_URL}/?count=${VIDEOS_PER_PAGE}&offset=${currentOffset}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setVideos((prev) => append ? [...prev, ...data.videos] : data.videos);
      setTotal(data.total);
      setOffset(currentOffset + data.videos.length);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchVideos(0); }, []);

  const hasMore = offset < total;

  return (
    <div className="min-h-screen bg-beige font-golos">
      {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}

      {/* Header */}
      <div className="bg-sage relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-10 right-20 w-80 h-80 rounded-full border-2 border-beige" />
          <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full border border-beige" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 pt-28">
          <a href="/" className="inline-flex items-center gap-2 text-beige/50 hover:text-beige text-sm mb-8 transition-colors">
            <Icon name="ArrowLeft" size={14} /> На главную
          </a>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-beige/40" />
            <span className="text-beige/70 text-xs tracking-[0.2em] uppercase font-golos">Видео</span>
          </div>
          <h1 className="font-cormorant text-beige text-5xl md:text-7xl font-light leading-tight mb-5">
            Видео<br/><span className="font-semibold">материалы</span>
          </h1>
          <p className="text-beige/60 max-w-md leading-relaxed">
            Видеозаписи из нашей группы{" "}
            <a href={VK_GROUP_URL} target="_blank" rel="noopener noreferrer" className="text-beige/90 hover:underline">
              ВКонтакте
            </a>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-beige rounded-sm overflow-hidden">
                <div className="aspect-video skeleton" />
                <div className="p-5 space-y-2">
                  <div className="skeleton h-4 rounded w-4/5" />
                  <div className="skeleton h-3 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🎬</div>
            <p className="font-cormorant text-ink text-2xl mb-2">Не удалось загрузить видео</p>
            <p className="text-muted-foreground text-sm mb-2">{error}</p>
            {error.includes("token") && (
              <p className="text-muted-foreground text-sm mb-6">Добавьте токен ВКонтакте в настройках проекта</p>
            )}
            <button onClick={() => fetchVideos(0)} className="px-6 py-3 bg-sage text-beige text-sm font-golos uppercase tracking-wide rounded-sm hover:bg-sage-dark transition-colors">
              Попробовать снова
            </button>
          </div>
        )}

        {!loading && !error && videos.length === 0 && (
          <div className="text-center py-20">
            <p className="font-cormorant text-ink text-2xl">Видео пока нет</p>
          </div>
        )}

        {!loading && videos.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-muted-foreground text-sm">{total} видеозаписей</p>
              <a href={VK_GROUP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-sage hover:underline">
                Группа ВКонтакте <Icon name="ExternalLink" size={13} />
              </a>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((v) => (
                <VideoCard key={v.id} video={v} onPlay={setActiveVideo} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => fetchVideos(offset, true)}
                  disabled={loadingMore}
                  className="px-10 py-3.5 bg-sage text-beige font-golos font-semibold text-sm tracking-wide uppercase rounded-sm hover:bg-sage-dark transition-colors disabled:opacity-50"
                >
                  {loadingMore ? "Загружаю..." : "Загрузить ещё"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
