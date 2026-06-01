import { useEffect, useState, useCallback } from "react";
import SiteNav from "@/components/shared/SiteNav";
import SiteFooter from "@/components/shared/SiteFooter";
import Icon from "@/components/ui/icon";

const GALLERY_URL = "https://functions.poehali.dev/abf6fa73-1b43-4ff7-af96-8b6e8ca2b46a";

interface GalleryPhoto {
  id: number;
  title: string;
  photo_url: string;
  created_at: string;
  ratio?: number; // width / height
}

function getSpan(ratio: number, cols: number): { colSpan: number; rowSpan: number } {
  if (cols === 2) {
    // На мобильных только широкие растягиваем, высокие — без двойной строки (ячейка и так высокая)
    if (ratio >= 1.6) return { colSpan: 2, rowSpan: 1 };
    return { colSpan: 1, rowSpan: 1 };
  }
  if (ratio >= 1.6) return { colSpan: 2, rowSpan: 1 }; // широкое
  if (ratio <= 0.7) return { colSpan: 1, rowSpan: 2 }; // высокое
  return { colSpan: 1, rowSpan: 1 };                   // квадратное
}

export default function Gallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [cols, setCols] = useState(() => window.innerWidth < 640 ? 2 : 4);
  const [rowH, setRowH] = useState(() => window.innerWidth < 640 ? 140 : 200);

  const updateGrid = useCallback(() => {
    const w = window.innerWidth;
    if (w < 640) { setCols(2); setRowH(140); }
    else if (w < 1024) { setCols(3); setRowH(180); }
    else { setCols(4); setRowH(200); }
  }, []);

  useEffect(() => {
    updateGrid();
    window.addEventListener("resize", updateGrid);
    return () => window.removeEventListener("resize", updateGrid);
  }, [updateGrid]);

  useEffect(() => {
    fetch(GALLERY_URL)
      .then((r) => r.json())
      .then((d) => {
        const raw: GalleryPhoto[] = d.photos || [];
        // Загружаем все изображения параллельно, чтобы узнать их размеры
        Promise.all(
          raw.map(
            (p) =>
              new Promise<GalleryPhoto>((resolve) => {
                const img = new Image();
                img.onload = () =>
                  resolve({ ...p, ratio: img.naturalWidth / img.naturalHeight });
                img.onerror = () => resolve({ ...p, ratio: 1 });
                img.src = p.photo_url;
              })
          )
        ).then((withRatios) => {
          setPhotos(withRatios);
          setLoading(false);
        });
      })
      .catch(() => setLoading(false));
  }, []);

  const current = lightbox !== null ? photos[lightbox] : null;
  const prev = () => setLightbox((i) => (i !== null && i > 0 ? i - 1 : photos.length - 1));
  const next = () => setLightbox((i) => (i !== null && i < photos.length - 1 ? i + 1 : 0));

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, photos.length]);

  return (
    <div className="min-h-screen bg-beige-mid font-golos">
      <SiteNav />

      <main id="main-content" tabIndex={-1} className="pt-28 pb-20 max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-sage" />
            <span className="text-sage text-xs tracking-[0.2em] uppercase font-golos">О нас</span>
          </div>
          <h1 className="font-cormorant text-ink text-5xl font-light leading-tight">
            Фото<span className="text-sage font-semibold">галерея</span>
          </h1>
          <p className="text-foreground/60 mt-4 max-w-lg">
            Моменты нашей работы — люди, события, истории, которые изменили жизни.
          </p>
        </div>

        {loading ? (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: `${rowH}px` }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-beige-dark rounded-sm animate-pulse"
                style={{
                  gridColumn: i % 5 === 0 ? "span 2" : "span 1",
                  gridRow: cols > 2 && i % 7 === 0 ? "span 2" : "span 1",
                }}
              />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-32">
            <Icon name="Image" size={48} className="text-ink/20 mx-auto mb-4" />
            <p className="text-foreground/40">Фотографии скоро появятся</p>
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: `${rowH}px` }}
          >
            {photos.map((photo, idx) => {
              const { colSpan, rowSpan } = getSpan(photo.ratio ?? 1, cols);
              return (
                <button
                  key={photo.id}
                  onClick={() => setLightbox(idx)}
                  className="relative rounded-sm overflow-hidden group focus:outline-none"
                  style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.title || ""}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
                    <Icon name="ZoomIn" size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  {photo.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white text-xs truncate">{photo.title}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* LIGHTBOX */}
      {current && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <Icon name="ChevronLeft" size={24} />
          </button>

          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={current.photo_url}
              alt={current.title || ""}
              className="max-h-[80vh] max-w-full object-contain rounded-sm"
            />
            {current.title && (
              <p className="text-white/70 text-sm mt-3">{current.title}</p>
            )}
            <p className="text-white/30 text-xs mt-1">{(lightbox ?? 0) + 1} / {photos.length}</p>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <Icon name="ChevronRight" size={24} />
          </button>

          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}