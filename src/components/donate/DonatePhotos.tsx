import { useEffect, useState } from "react";

const GALLERY_URL = "https://functions.poehali.dev/abf6fa73-1b43-4ff7-af96-8b6e8ca2b46a";

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const loadUrls = async (tag?: string): Promise<string[]> => {
  const r = await fetch(tag ? `${GALLERY_URL}?tag=${encodeURIComponent(tag)}` : GALLERY_URL);
  const d = await r.json();
  return (d.photos || []).map((p: { photo_url: string }) => p.photo_url).filter(Boolean);
};

export function useGalleryPhotos(limit = 6, tag?: string): string[] {
  const [photos, setPhotos] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      let urls = tag ? await loadUrls(tag) : [];
      if (urls.length < 3) urls = await loadUrls();
      setPhotos(shuffle(urls).slice(0, limit));
    })().catch(() => {});
  }, [limit, tag]);
  return photos;
}

export function PhotoStrip({ photos }: { photos: string[] }) {
  if (photos.length < 3) return null;
  const [a, b, c] = photos;
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 -mt-2">
      <div className="rounded-2xl overflow-hidden shadow-md aspect-[3/4] sm:rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
        <img src={a} alt="Жизнь в центре Спасение надежды" loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div className="rounded-2xl overflow-hidden shadow-md aspect-[3/4] sm:mt-6 hover:scale-[1.02] transition-transform duration-500">
        <img src={b} alt="Дети и мамы в центре Спасение надежды" loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div className="rounded-2xl overflow-hidden shadow-md aspect-[3/4] sm:rotate-[2deg] hover:rotate-0 transition-transform duration-500">
        <img src={c} alt="Занятия и отдых в центре Спасение надежды" loading="lazy" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}

export function PhotoQuote({ photo }: { photo?: string }) {
  if (!photo) return null;
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm aspect-[4/3]">
      <img src={photo} alt="Дети в центре Спасение надежды" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
      <p className="absolute bottom-4 left-5 right-5 font-cormorant text-beige text-xl leading-snug">
        Каждое пожертвование — это тёплый ужин, игрушка и безопасный дом для ребёнка
      </p>
    </div>
  );
}
