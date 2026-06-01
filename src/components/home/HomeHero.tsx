import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import SiteNav from "@/components/shared/SiteNav";

const VK_URL = "https://vk.com/spasenienadezhdi";
const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";

const HERO_IMGS = [
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/82a9f428-4386-466d-88e0-0ad976b369c3.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/8c3c42ea-1fc4-4248-985b-aa5c922bfada.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/76cb0a36-5f5c-4522-99f6-0ae2f3ca64ff.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/ceda8cb1-b883-4b0c-a598-1e9d86a1e4c3.jpg",
];

interface Props {
  onScrollTo: (id: string) => void;
  activeSection: string;
  setActiveSection: (s: string) => void;
}

export default function HomeHero({ onScrollTo, activeSection, setActiveSection }: Props) {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(i => (i + 1) % HERO_IMGS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <SiteNav />

      {/* HERO */}
      <section id="glavnaya" className="relative min-h-screen overflow-hidden pt-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-beige via-beige to-sage-pale/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up pt-4">
            <div className="inline-flex items-center gap-2 bg-sage-pale text-sage px-4 py-2 rounded-full text-xs font-golos uppercase tracking-widest mb-8">
              <Icon name="Heart" size={12} aria-hidden="true" />
              АНО «Спасение надежды»
            </div>
            <h1 className="font-golos text-6xl md:text-7xl leading-[1.05] mb-6 font-bold" style={{ color: '#0ABAB5' }}>
              Место, где<br/>
              <span>спасают</span><br/>
              надежду!
            </h1>
            <p className="text-foreground/65 text-lg leading-relaxed max-w-lg mb-10">
              Мы помогаем семьям справиться с зависимостью и ее негативными последствиями.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onScrollTo("podderzhka")}
                className="px-8 py-3.5 bg-sage text-beige font-golos font-semibold text-sm uppercase tracking-wide rounded-full hover:bg-sage-dark transition-all duration-300 hover:scale-105"
              >
                Помочь организации
              </button>
              <a
                href={VK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 border border-sage/40 text-sage font-golos text-sm uppercase tracking-wide rounded-full hover:border-sage hover:bg-sage-pale transition-all duration-300 flex items-center gap-2"
              >
                <Icon name="ExternalLink" size={14} /> Наша группа ВК
              </a>
            </div>
          </div>

          <div className="animate-fade-up delay-300 relative">
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl"
              style={{ aspectRatio: "4/3" }}
              role="img"
              aria-label="Фотографии кризисного центра Спасение надежды"
            >
              {HERO_IMGS.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={i === slideIndex ? "Кризисный центр Спасение надежды — фото" : ""}
                  aria-hidden={i !== slideIndex}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                  style={{ opacity: i === slideIndex ? 1 : 0, objectPosition: i === 1 ? "center 30%" : "top" }}
                />
              ))}
              <img
                src={LOGO_IMG}
                alt=""
                aria-hidden="true"
                className="absolute top-4 right-4 w-16 h-16 object-contain z-10 drop-shadow-lg opacity-80"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10" role="group" aria-label="Переключение слайдов">
                {HERO_IMGS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlideIndex(i)}
                    aria-label={`Фото ${i + 1} из ${HERO_IMGS.length}`}
                    aria-pressed={i === slideIndex}
                    className={`h-2 rounded-full transition-all duration-300 ${i === slideIndex ? "bg-white w-5" : "bg-white/50 w-2"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "Heart", title: "С 2024 года", text: "Помогаем семьям в трудных жизненных ситуациях" },
            { icon: "Users", title: "30+ семей", text: "Получили реальную помощь и поддержку организации" },
            { icon: "Baby", title: "10+ детей", text: "Возвращены в родные семьи благодаря нашей работе" },
            { icon: "Shield", title: "100% открытость", text: "Полная прозрачность в расходовании всех средств" },
          ].map(({ icon, title, text }) => (
            <div key={title} className="backdrop-blur rounded-2xl p-5 flex flex-col gap-2" style={{ backgroundColor: '#0ABAB5' }}>
              <Icon name={icon as "Heart"} size={18} className="text-white/80" />
              <div className="font-cormorant text-white text-xl font-semibold leading-tight">{title}</div>
              <div className="text-white/75 text-sm leading-snug">{text}</div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-ink/30 animate-float" aria-hidden="true">
          <span className="text-xs tracking-widest uppercase">листайте</span>
          <Icon name="ChevronDown" size={14} aria-hidden="true" />
        </div>
      </section>
    </>
  );
}