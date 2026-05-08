import { useEffect, useState } from "react";
import SiteNav from "@/components/shared/SiteNav";
import Icon from "@/components/ui/icon";

const GALLERY_URL = "https://functions.poehali.dev/abf6fa73-1b43-4ff7-af96-8b6e8ca2b46a";

interface GalleryPhoto {
  id: number;
  title: string;
  photo_url: string;
  created_at: string;
}

export default function Gallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    fetch(GALLERY_URL)
      .then((r) => r.json())
      .then((d) => setPhotos(d.photos || []))
      .finally(() => setLoading(false));
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

      <div className="pt-28 pb-20 max-w-7xl mx-auto px-6">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-beige-dark rounded-sm animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-32">
            <Icon name="Image" size={48} className="text-ink/20 mx-auto mb-4" />
            <p className="text-foreground/40">Фотографии скоро появятся</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setLightbox(idx)}
                className="relative aspect-square rounded-sm overflow-hidden group focus:outline-none"
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
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}
