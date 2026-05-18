import { useEffect } from "react";
import { LightboxState } from "./families.types";

interface Props {
  lightbox: LightboxState;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function FamiliesLightbox({ lightbox, onClose, onPrev, onNext }: Props) {
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

  if (!lightbox) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <img
        src={lightbox.photos[lightbox.idx]}
        alt=""
        className="max-w-full max-h-full rounded-sm shadow-2xl object-contain"
        onClick={e => e.stopPropagation()}
      />
      {lightbox.photos.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white text-2xl transition-colors"
          >
            ‹
          </button>
          <button
            onClick={e => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white text-2xl transition-colors"
          >
            ›
          </button>
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/50 text-sm">
            {lightbox.idx + 1} / {lightbox.photos.length}
          </p>
        </>
      )}
      <button
        onClick={onClose}
        className="absolute top-4 right-5 text-white/80 hover:text-white text-3xl leading-none"
      >
        ×
      </button>
    </div>
  );
}
