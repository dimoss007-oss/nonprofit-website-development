import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const NEWS_URL = "https://functions.poehali.dev/b33c4df8-295a-4694-a485-e771aec3d9ce";

interface NewsItem {
  id: number;
  title: string;
  text: string;
  photos: string[];
  published_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function cleanText(text: string, title: string) {
  let t = text
    .replace(/\n\n?—?\s*https:\/\/vk\.com\/wall[^\n]*/g, "")
    .replace(/\[club\d+\|([^\]]*)\]/g, "$1")
    .replace(/\[id\d+\|([^\]]*)\]/g, "$1")
    .trim();
  const firstLine = t.split("\n")[0].trim();
  if (firstLine === title.trim() || t.startsWith(title.trim())) {
    t = t.slice(firstLine.length).replace(/^\n+/, "").trim();
  }
  return t;
}

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
}

export default function HomeNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(NEWS_URL)
      .then((r) => r.json())
      .then((d) => {
        const items = (d.news || []).slice(0, 3).map((n: NewsItem) => ({
          ...n,
          text: cleanText(n.text, n.title),
        }));
        setNews(items);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="novosti" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="flex items-end justify-between mb-14">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-8 bg-sage" />
                <span className="text-sage text-xs tracking-[0.2em] uppercase font-golos">Новости центра</span>
              </div>
              <h2 className="font-cormorant text-ink text-5xl font-light leading-tight">
                Последние <span className="text-sage font-semibold">новости</span>
              </h2>
            </div>
            <a
              href="/news"
              className="hidden md:inline-flex items-center gap-2 text-sage text-sm font-semibold hover:underline"
            >
              Все новости <Icon name="ArrowRight" size={14} />
            </a>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-beige rounded-sm p-6 animate-pulse">
                  <div className="h-40 bg-beige-dark rounded-sm mb-4" />
                  <div className="h-4 bg-beige-dark rounded w-24 mb-3" />
                  <div className="h-5 bg-beige-dark rounded w-3/4 mb-2" />
                  <div className="h-4 bg-beige-dark rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {news.map((item) => (
                <a key={item.id} href="/news" className="group bg-beige rounded-sm overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col">
                  {item.photos?.[0] && (
                    <div className="aspect-video overflow-hidden bg-beige-dark">
                      <img
                        src={item.photos[0]}
                        alt=""
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px w-4 bg-sage" />
                      <time className="text-muted-foreground text-xs uppercase tracking-wider">{formatDate(item.published_at)}</time>
                    </div>
                    <h3 className="font-cormorant text-ink text-xl font-semibold leading-snug mb-3 group-hover:text-sage transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-foreground/60 text-sm leading-relaxed line-clamp-3 flex-1">
                      {item.text}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-sage text-xs font-semibold">
                      Читать далее <Icon name="ArrowRight" size={12} />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <a href="/news" className="inline-flex items-center gap-2 text-sage text-sm font-semibold hover:underline">
              Все новости <Icon name="ArrowRight" size={14} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}