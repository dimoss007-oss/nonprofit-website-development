import { CaseItem } from "./families.types";
import FamiliesSliderBanner from "./FamiliesSliderBanner";

const SLIDER_PHOTOS_2 = [
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/5fe51a25-3158-4ff9-bb8c-5de9c3d33fe8.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/cb814417-435c-49c1-95be-d91adb527ee1.jpg",
];

const SLIDER_PHOTOS_4 = [
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/3bde4433-7178-4a0d-aa09-4674298e25b0.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/881542eb-e283-4d4d-a3d8-20f8281fde74.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/86eaa749-de18-4019-ae8f-48adca87beb7.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/bfe7fb2d-5e3e-49e2-bbc5-597582cacb7d.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/c2a46bf6-ccfa-4b89-9f2f-8be591001ea7.jpg",
];

const SLIDER_PHOTOS_3 = [
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/46a8524d-b5b9-47ab-9459-005ae41387cb.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/29316979-5afd-4ce2-b41e-5148f372b4f0.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/bac92197-b13e-4546-84fb-288c6653d0e5.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/2e6cc4a7-f631-4870-bcc2-3e2cfafe01b5.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/2aef83b1-0b1e-4006-a1bb-3094325ccf4e.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/b80fb6d7-7d71-4d49-b07b-f3596ba23153.jpg",
];

const PHOTO_1 = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/31f9813f-2685-4968-be68-856b3e8f9c09.jpg";

interface Props {
  c: CaseItem;
  openLightbox: (photos: string[], url: string) => void;
}

export default function FamiliesCaseCard({ c, openLightbox }: Props) {
  const childPhotos = c.children.map(x => x.photo).filter(Boolean) as string[];

  return (
    <article className="bg-white rounded-sm shadow-sm overflow-hidden">
      {/* FAMILY PHOTO */}
      {c.id === 1 && (
        <div
          className="w-full h-64 md:h-80 overflow-hidden border-b border-beige-dark cursor-zoom-in"
          onClick={() => openLightbox([PHOTO_1], PHOTO_1)}
        >
          <img
            src={PHOTO_1}
            alt="Семья"
            className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      {c.id === 2 && (
        <FamiliesSliderBanner
          photos={SLIDER_PHOTOS_2}
          positions={["center 30%", "center 25%"]}
          onZoom={openLightbox}
        />
      )}
      {c.id === 3 && (
        <FamiliesSliderBanner
          photos={SLIDER_PHOTOS_3}
          positions={["center 40%", "center 20%", "center 30%", "center 25%", "center 20%", "center 20%"]}
          onZoom={openLightbox}
        />
      )}
      {c.id === 4 && (
        <FamiliesSliderBanner
          photos={SLIDER_PHOTOS_4}
          positions={["center 20%", "center 25%", "center 20%", "center 30%", "center 25%"]}
          onZoom={openLightbox}
        />
      )}

      <div className="p-8 md:p-12">
        {/* CASE TAG + TITLE */}
        <div className="mb-8">
          <span className="inline-block text-sage text-xs tracking-[0.2em] uppercase font-golos mb-3">
            {c.tag}
          </span>
          <h2 className="font-cormorant text-ink text-4xl font-semibold leading-tight mb-2">
            {c.title}
          </h2>
          <p className="font-cormorant text-ink/70 text-2xl italic">{c.subtitle}</p>
        </div>

        {/* LEAD */}
        <div className="border-l-2 border-sage pl-6 mb-10">
          <p className="font-cormorant text-ink text-xl italic leading-relaxed">{c.lead}</p>
        </div>

        {/* MAIN SECTIONS */}
        {c.sections.map((s, i) => (
          <div key={i} className="mb-10">
            <h3 className="font-cormorant text-ink text-2xl font-semibold mb-4">{s.heading}</h3>
            {s.text.split("\n\n").map((p, j) => (
              <p key={j} className="text-ink/80 leading-relaxed mb-4 last:mb-0">{p}</p>
            ))}
          </div>
        ))}

        {/* RESULT LINE (кейс 1) */}
        {c.resultLine && (
          <div className="bg-sage/10 border border-sage/30 rounded-sm px-6 py-4 mb-12">
            <p className="font-cormorant text-ink text-xl font-semibold">{c.resultLine}</p>
          </div>
        )}

        {/* HIGHLIGHTS (кейс 2 и 3) */}
        {c.highlights && (
          <div className="mb-10">
            {c.id === 3 && (
              <h3 className="font-cormorant text-ink text-2xl font-semibold mb-5">Динамика семейной системы</h3>
            )}
            <ul className="space-y-4">
              {c.highlights.map((item, i) => (
                <li key={i} className="flex gap-3 items-start bg-sage/5 border border-sage/20 rounded-sm px-5 py-4">
                  <span className="mt-1 text-sage text-lg leading-none">🔹</span>
                  <span className="text-ink/80 leading-relaxed text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* NOW (кейс 2) */}
        {c.nowText && (
          <div className="mb-12">
            <h3 className="font-cormorant text-ink text-2xl font-semibold mb-4">Сейчас</h3>
            {c.nowText.split("\n\n").map((p, i) => (
              <p key={i} className="text-ink/80 leading-relaxed mb-4 last:mb-0">{p}</p>
            ))}
          </div>
        )}

        {/* CHILDREN */}
        <div className="mb-12">
          <h3 className="font-cormorant text-ink text-2xl font-semibold mb-6">
            {c.id === 1 || c.id === 3 ? "Как изменились дети" : "Ребёнок"}
          </h3>
          <div className="space-y-6">
            {c.children.map((ch, i) => (
              <div key={i} className="flex gap-5 items-start">
                <div
                  className={`flex-shrink-0 w-20 h-20 rounded-xl bg-beige-dark overflow-hidden shadow-sm transition-opacity ${ch.photo ? "cursor-pointer hover:opacity-90" : ""}`}
                  onClick={() => ch.photo && openLightbox(childPhotos, ch.photo)}
                >
                  {ch.photo ? (
                    <img src={ch.photo} alt={ch.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-cormorant text-ink font-semibold text-xl">
                      {ch.name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-ink mb-1">
                    {ch.name}
                    {ch.age && <span className="text-ink/50 font-normal ml-2 text-sm">({ch.age})</span>}
                  </div>
                  <p className="text-ink/70 leading-relaxed text-sm">{ch.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MOM PROGRESS (кейс 1) */}
        {c.momProgress && (
          <div className="mb-10">
            <h3 className="font-cormorant text-ink text-2xl font-semibold mb-5">Как изменилась сама Светлана</h3>
            <ul className="space-y-3">
              {c.momProgress.map((item, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" />
                  <span className="text-ink/80 leading-relaxed text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ACTIVITY (кейс 1) */}
        {c.activity && (
          <div className="mb-10">
            <h4 className="text-ink text-base font-semibold uppercase tracking-wide mb-4">
              Общественная деятельность сегодня
            </h4>
            <ul className="space-y-3">
              {c.activity.map((item, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" />
                  <span className="text-ink/80 leading-relaxed text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* PLP (кейс 1) */}
        {c.plpText && (
          <div className="mb-12">
            <h4 className="text-ink text-base font-semibold uppercase tracking-wide mb-3">
              Планы на постлечебную программу (ПЛП)
            </h4>
            <p className="text-ink/70 leading-relaxed text-sm">{c.plpText}</p>
          </div>
        )}

        {/* CONCLUSION */}
        <div className="border-t border-beige-dark pt-10 mb-8">
          <h3 className="font-cormorant text-ink text-2xl font-semibold mb-5">Вывод</h3>
          {c.conclusion.split("\n\n").map((p, i) => (
            <p key={i} className="text-ink/80 leading-relaxed mb-4 last:mb-0">{p}</p>
          ))}
        </div>

        {/* RESULTS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {c.results.map((r, i) => (
            <div key={i} className="bg-sage/10 rounded-sm px-4 py-4 text-center">
              <p className="font-cormorant text-ink text-base font-semibold leading-tight">{r}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}