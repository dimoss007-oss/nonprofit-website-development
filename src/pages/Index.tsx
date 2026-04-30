import { useState } from "react";
import Icon from "@/components/ui/icon";
import HomeHero from "@/components/home/HomeHero";
import HomeAbout from "@/components/home/HomeAbout";
import HomeSupport from "@/components/home/HomeSupport";

const NEWS_ITEMS = [
  {
    href: "https://vk.com/wall-229898882_352",
    img: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/9bed1cfa-a4c2-43a2-91e1-7ded0e5f6576.jpg",
    date: "28 апреля 2025",
    title: "Нас пригласили поделиться опытом",
    text: "Учредитель Василий Сайфуллин и директор Дмитрий Чуйкин выступили на круглом столе о восстановлении родительских прав. Уникальный опыт кризисного центра — реабилитация без разлучения родителей и детей.",
  },
  {
    href: "https://vk.com/wall-229898882_344",
    img: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/5f84e431-89c1-4bba-bbc8-159bbd2b508c.jpg",
    date: "Апрель 2025 · Москва",
    title: "Конференция «Устойчивость» для лидеров НКО",
    text: "Директор Дмитрий Чуйкин и фандрайзер Надежда на конференции в РЭУ им. Плеханова. Устойчивость — это про маму, которая не сорвалась, и ребёнка, который остался с семьёй.",
  },
  {
    href: "https://vk.com/wall-229898882_316",
    img: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/ee86abc4-67bd-43f9-a03d-df535097bec9.png",
    date: "9 апреля 2025 · Пенза",
    title: "Презентация проекта на межрегиональном форуме",
    text: "Учредитель Василий Сайфуллин выступил на форуме «Мир. Женщина. Семья» — о структуре центра, формате «равный-равному» и взаимодействии с соцслужбами. Встречен овациями.",
  },
  {
    href: "https://vk.com/wall-229898882_304",
    img: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/bee92c70-daa2-4e47-b246-e7d063269312.jpg",
    date: "Апрель 2025",
    title: "Спасибо MEBELDOF!",
    text: "За заботу, за внимание, за подарки для наших детей — кухню, автопарк и детскую мебель. Вы делаете мир лучше! Дети в восторге 😍",
  },
];

const VIDEO_ITEMS = [
  {
    href: "https://vk.com/wall-229898882_327",
    img: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/82a9f428-4386-466d-88e0-0ad976b369c3.jpg",
    date: "Апрель 2025",
    title: "Ровно год. И мы — одна семья",
    sub: "40 мам · 50 детей · 11 выпускниц",
  },
  {
    href: "https://vkvideo.ru/video-229898882_456239393",
    img: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/653c15d3-9214-4272-bc83-1737592f3039.png",
    date: "2025",
    title: "Динамическая группа (подростки 11+)",
    sub: "Смотреть на VK Видео",
  },
  {
    href: "https://vkvideo.ru/video-229898882_456239407?t=2m37s",
    img: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/945c2459-a992-4736-8200-f1fc85bdf450.png",
    date: "9 апреля 2025 · Пенза",
    title: "«Спасение Надежды» на форуме «Мир. Женщина. Семья»",
    sub: "Смотреть на VK Видео",
  },
];

function VideoSlider() {
  const [current, setCurrent] = useState(0);
  const visible = 3;
  const max = Math.max(0, VIDEO_ITEMS.length - visible);

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(max, c + 1));

  return (
    <div>
      <div className="overflow-hidden">
        <div
          className="flex gap-6 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(calc(-${current} * (100% / ${visible} + 8px)))` }}
        >
          {VIDEO_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-beige rounded-sm overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 group flex-shrink-0"
              style={{ width: `calc((100% - ${(visible - 1) * 24}px) / ${visible})` }}
            >
              <div className="aspect-video bg-sage-pale relative overflow-hidden flex items-center justify-center">
                {item.img && (
                  <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                )}
                <div className="relative w-14 h-14 rounded-full bg-beige/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Icon name="Play" size={22} className="text-sage ml-1" />
                </div>
              </div>
              <div className="p-5">
                <div className="text-muted-foreground text-xs mb-2">{item.date}</div>
                <h3 className="font-cormorant text-ink text-lg font-semibold leading-snug group-hover:text-sage transition-colors">{item.title}</h3>
                {item.sub && <p className="text-muted-foreground text-xs mt-1">{item.sub}</p>}
              </div>
            </a>
          ))}

          {Array.from({ length: Math.max(0, visible - VIDEO_ITEMS.length) }).map((_, i) => (
            <div key={i} className="bg-beige rounded-sm overflow-hidden flex-shrink-0" style={{ width: `calc((100% - ${(visible - 1) * 24}px) / ${visible})` }}>
              <div className="aspect-video bg-sage-pale flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-sage/20 flex items-center justify-center">
                  <Icon name="Play" size={24} className="text-sage ml-1" />
                </div>
              </div>
              <div className="p-5 space-y-2">
                <div className="skeleton h-4 rounded w-4/5" />
                <div className="skeleton h-3 rounded w-3/5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-8">
        <p className="text-muted-foreground text-sm">
          Больше видео →{" "}
          <a href="/video" className="text-sage hover:underline">открыть раздел</a>
        </p>
        {max > 0 && (
          <div className="flex items-center gap-3">
            <button onClick={prev} disabled={current === 0}
              className="w-10 h-10 rounded-full border border-sage/30 flex items-center justify-center text-sage hover:bg-sage-pale transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <Icon name="ChevronLeft" size={18} />
            </button>
            <div className="flex gap-1.5">
              {Array.from({ length: max + 1 }).map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? "bg-sage w-5" : "bg-sage/25"}`} />
              ))}
            </div>
            <button onClick={next} disabled={current === max}
              className="w-10 h-10 rounded-full border border-sage/30 flex items-center justify-center text-sage hover:bg-sage-pale transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <Icon name="ChevronRight" size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NewsSlider() {
  const [current, setCurrent] = useState(0);
  const visible = 3;
  const max = NEWS_ITEMS.length - visible;

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(max, c + 1));

  return (
    <div>
      <div className="overflow-hidden">
        <div
          className="flex gap-6 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(calc(-${current} * (100% / ${visible} + 8px)))` }}
        >
          {NEWS_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-beige rounded-sm overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 group flex-shrink-0"
              style={{ width: `calc((100% - ${(visible - 1) * 24}px) / ${visible})` }}
            >
              <div className="aspect-video overflow-hidden">
                {item.img ? (
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-sage-pale flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🏛️</div>
                      <div className="text-sage text-xs font-golos uppercase tracking-wider">Форум</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="h-1 bg-gradient-to-r from-sage to-sage-light" />
              <div className="p-6">
                <div className="text-muted-foreground text-xs mb-3">{item.date}</div>
                <h3 className="font-cormorant text-ink text-xl font-semibold leading-snug mb-3 group-hover:text-sage transition-colors">{item.title}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed line-clamp-3">{item.text}</p>
                <div className="mt-4 flex items-center gap-1 text-sage text-xs font-golos uppercase tracking-wider">
                  Читать в ВКонтакте <Icon name="ArrowRight" size={12} />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-8">
        <p className="text-muted-foreground text-sm">
          Больше новостей →{" "}
          <a href="/news" className="text-sage hover:underline">открыть ленту</a>
        </p>
        <div className="flex items-center gap-3">
          <button onClick={prev} disabled={current === 0}
            className="w-10 h-10 rounded-full border border-sage/30 flex items-center justify-center text-sage hover:bg-sage-pale transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <Icon name="ChevronLeft" size={18} />
          </button>
          <div className="flex gap-1.5">
            {Array.from({ length: max + 1 }).map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? "bg-sage w-5" : "bg-sage/25"}`} />
            ))}
          </div>
          <button onClick={next} disabled={current === max}
            className="w-10 h-10 rounded-full border border-sage/30 flex items-center justify-center text-sage hover:bg-sage-pale transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <Icon name="ChevronRight" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [activeSection, setActiveSection] = useState("главная");

  const scrollTo = (id: string) => {
    if (id.startsWith("/")) { window.location.href = id; return; }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-beige font-golos overflow-x-hidden">

      <HomeHero onScrollTo={scrollTo} activeSection={activeSection} setActiveSection={setActiveSection} />

      <HomeAbout />

      {/* НОВОСТИ — слайдер */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-8 bg-sage" />
                <span className="text-sage text-xs tracking-[0.2em] uppercase font-golos">Новости из ВКонтакте</span>
              </div>
              <h2 className="font-cormorant text-ink text-5xl font-light">
                Следим за<br/><span className="text-sage font-semibold">нашей работой</span>
              </h2>
            </div>
            <a href="/news" className="inline-flex items-center gap-2 text-sage font-golos text-sm uppercase tracking-wider hover:underline self-start md:self-auto">
              Все новости <Icon name="ArrowRight" size={14} />
            </a>
          </div>
          <NewsSlider />
        </div>
      </section>

      {/* ВИДЕО — слайдер */}
      <section className="py-28 bg-beige-mid">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-8 bg-sage" />
                <span className="text-sage text-xs tracking-[0.2em] uppercase font-golos">Видео</span>
              </div>
              <h2 className="font-cormorant text-ink text-5xl font-light">
                Смотрите наши<br/><span className="text-sage font-semibold">видеоматериалы</span>
              </h2>
            </div>
            <a href="/video" className="inline-flex items-center gap-2 text-sage font-golos text-sm uppercase tracking-wider hover:underline self-start md:self-auto">
              Все видео <Icon name="ArrowRight" size={14} />
            </a>
          </div>
          <VideoSlider />
        </div>
      </section>

      <HomeSupport onScrollTo={scrollTo} />

    </div>
  );
}