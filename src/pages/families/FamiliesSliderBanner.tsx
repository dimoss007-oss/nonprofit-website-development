import { useState } from "react";

interface Props {
  photos: string[];
  positions?: string[];
  onZoom: (photos: string[], url: string) => void;
}

export default function FamiliesSliderBanner({ photos, positions, onZoom }: Props) {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);

  return (
    <div className="relative w-full h-64 md:h-80 overflow-hidden border-b border-beige-dark group">
      {photos.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          onClick={() => i === idx && onZoom(photos, src)}
          style={{ objectPosition: positions?.[i] ?? "center 20%" }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === idx ? "opacity-100 cursor-zoom-in" : "opacity-0 pointer-events-none"}`}
        />
      ))}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
      >
        ‹
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
      >
        ›
      </button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
