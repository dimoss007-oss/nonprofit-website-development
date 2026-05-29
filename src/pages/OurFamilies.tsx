import { useState } from "react";
import SiteNav from "@/components/shared/SiteNav";
import SiteFooter from "@/components/shared/SiteFooter";
import { CASES, LightboxState } from "./families/families.types";
import FamiliesLightbox from "./families/FamiliesLightbox";
import FamiliesCaseCard from "./families/FamiliesCaseCard";

export default function OurFamilies() {
  const [activeId, setActiveId] = useState(1);
  const c = CASES.find(x => x.id === activeId)!;
  const [lightbox, setLightbox] = useState<LightboxState>(null);

  function openLightbox(photos: string[], url: string) {
    const idx = photos.indexOf(url);
    setLightbox({ photos, idx: idx >= 0 ? idx : 0 });
  }
  const lbPrev = () => setLightbox(lb => lb && { ...lb, idx: (lb.idx - 1 + lb.photos.length) % lb.photos.length });
  const lbNext = () => setLightbox(lb => lb && { ...lb, idx: (lb.idx + 1) % lb.photos.length });

  return (
    <div className="min-h-screen bg-beige-mid font-golos">
      <SiteNav />

      <FamiliesLightbox
        lightbox={lightbox}
        onClose={() => setLightbox(null)}
        onPrev={lbPrev}
        onNext={lbNext}
      />

      <div className="pt-28 pb-24 max-w-4xl mx-auto px-6">
        {/* PAGE HEADER */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-sage" />
            <span className="text-sage text-xs tracking-[0.2em] uppercase font-golos">Наши семьи</span>
          </div>
          <h1 className="font-cormorant text-ink text-5xl md:text-6xl font-semibold leading-tight">
            Истории, которые<br className="hidden md:block" /> меняют жизнь
          </h1>
        </div>

        {/* CASE TABS */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {CASES.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveId(item.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-golos transition-colors ${
                activeId === item.id
                  ? "bg-sage text-white"
                  : "bg-white text-ink/70 hover:bg-beige-dark border border-beige-dark"
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

        {/* CASE CARD */}
        <FamiliesCaseCard c={c} openLightbox={openLightbox} />
      </div>
      <SiteFooter />
    </div>
  );
}