import { useEffect, useRef, useState } from "react";
import { CABINET_URL } from "@/components/cabinet/cabinet.shared";

export const VIDEO_CATEGORIES = [
  { id: "aid_distribution", label: "Гуманитарка" },
  { id: "mobile_brigade", label: "Бригада" },
  { id: "center_life", label: "Жизнь центра" },
  { id: "gratitude", label: "Благодарности" },
] as const;

type Video = { id: number; title: string; category: string; embed_url: string; thumbnail_url: string | null; description: string };

function LazyPlayer({ video }: { video: Video }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setVisible(true); io.disconnect(); }
    }, { rootMargin: "150px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative aspect-video bg-ink/10 rounded-xl overflow-hidden">
      {video.thumbnail_url && !visible && <img src={video.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
      {visible && (
        <iframe
          src={video.embed_url}
          title={video.title}
          loading="lazy"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      )}
    </div>
  );
}

export default function VideoActionWidget({ category = "", title = "Ваше добро в действии" }: { category?: string; title?: string }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [active, setActive] = useState<string>("all");
  const [started, setStarted] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setStarted(true); return; }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setStarted(true); io.disconnect(); }
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    fetch(`${CABINET_URL}?view=videos`).then(r => r.json()).then(d => setVideos((d.videos || []).filter((v: Video) => !category || v.category === category))).catch(() => {});
  }, [started]);

  const present = VIDEO_CATEGORIES.filter(c => videos.some(v => v.category === c.id));
  const shown = active === "all" ? videos : videos.filter(v => v.category === active);

  return (
    <section ref={rootRef} className={videos.length ? "py-16 px-4 bg-beige-mid" : ""} aria-labelledby="video-action-title">
      {videos.length > 0 && (
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 id="video-action-title" className="font-cormorant text-4xl font-semibold text-ink">{title}</h2>
            <p className="text-ink/60 mt-2">Видеоотчёты о том, как ваша помощь доходит до семей</p>
          </div>
          {present.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8" role="tablist">
              {[{ id: "all", label: "Все" }, ...present].map(c => (
                <button key={c.id} role="tab" aria-selected={active === c.id} onClick={() => setActive(c.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${active === c.id ? "bg-ink text-beige" : "bg-white text-ink border border-beige-dark hover:bg-beige"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-6">
            {shown.map(v => (
              <article key={v.id} className="bg-white rounded-2xl p-4 border border-beige-dark/60">
                <LazyPlayer video={v} />
                <h3 className="font-cormorant text-xl font-semibold text-ink mt-3">{v.title}</h3>
                {v.description && <p className="text-sm text-ink/70 mt-1 leading-relaxed">{v.description}</p>}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
