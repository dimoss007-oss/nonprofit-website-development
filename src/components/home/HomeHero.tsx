import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const HERO_IMGS = [
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/82a9f428-4386-466d-88e0-0ad976b369c3.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/8c3c42ea-1fc4-4248-985b-aa5c922bfada.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/76cb0a36-5f5c-4522-99f6-0ae2f3ca64ff.jpg",
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/ceda8cb1-b883-4b0c-a598-1e9d86a1e4c3.jpg",
];
const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";
const VK_URL = "https://vk.com/spasenienadezhdi";

const navItemsBefore = [
  { label: "главная", id: "glavnaya" },
];

const navItemsAfter = [
  { label: "программа", id: "/program" },
  { label: "новости", id: "/news" },
  { label: "поддержать нас", id: "podderzhka" },
  { label: "контакты", id: "kontakty" },
];

const aboutItems = [
  { label: "О нас", id: "o-nas" },
  { label: "Миссия", id: "missiya" },
  { label: "Команда", id: "komanda" },
];

const helpItems = [
  { label: "Зависимости", id: "zavisimosti" },
  { label: "Психолог", id: "psiholog" },
  { label: "Сопровождение", id: "soprovozhdenie" },
  { label: "Кризис", id: "krizis" },
];

interface Props {
  onScrollTo: (id: string) => void;
  activeSection: string;
  setActiveSection: (s: string) => void;
}

export default function HomeHero({ onScrollTo, activeSection, setActiveSection }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const helpRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) setHelpOpen(false);
      if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) setAboutOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(i => (i + 1) % HERO_IMGS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleNav = (label: string, id: string) => {
    setActiveSection(label);
    onScrollTo(id);
    setMenuOpen(false);
    setHelpOpen(false);
    setAboutOpen(false);
  };

  return (
    <>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-beige/95 backdrop-blur-sm border-b border-beige-dark">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-3">
              <img src={LOGO_IMG} alt="Спасение надежды" className="w-14 h-14 object-contain" />
              <div>
                <div className="font-cormorant text-ink text-lg font-semibold leading-none">Спасение надежды</div>
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Кризисный центр</div>
              </div>
            </a>
            <a href="https://президентскиегранты.рф" target="_blank" rel="noopener noreferrer" className="hidden sm:block border-l border-beige-dark pl-4">
              <img
                src="https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/fe35576e-c533-469d-97ee-1a6ffde86c77.png"
                alt="Фонд президентских грантов"
                className="h-8 w-auto object-contain"
              />
            </a>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            {navItemsBefore.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => handleNav(label, id)}
                className={`nav-link ${activeSection === label ? "active" : ""}`}
              >
                {label}
              </button>
            ))}
            <div ref={aboutRef} className="relative">
              <button
                onClick={() => setAboutOpen(!aboutOpen)}
                className="nav-link flex items-center gap-1"
              >
                о нас
                <Icon name="ChevronDown" size={12} className={`transition-transform duration-200 ${aboutOpen ? "rotate-180" : ""}`} />
              </button>
              {aboutOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-beige-dark rounded-sm shadow-lg py-1 min-w-[160px] z-50">
                  {aboutItems.map(({ label, id }) => (
                    <button
                      key={id}
                      onClick={() => handleNav(label, id)}
                      className="w-full text-left px-4 py-2.5 text-xs uppercase tracking-widest text-ink/70 hover:text-primary hover:bg-sage-pale transition-colors duration-150 font-golos"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {navItemsAfter.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => handleNav(label, id)}
                className={`nav-link ${activeSection === label ? "active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          <a href="tel:88003008685" className="hidden md:flex items-center gap-2 text-sage font-golos font-semibold text-sm hover:text-sage-dark transition-colors">
            <Icon name="Phone" size={14} />
            8 800 300-86-85
          </a>

          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-ink">
            <Icon name={menuOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden bg-beige border-t border-beige-dark">
            <div className="px-6 py-4 grid grid-cols-2 gap-3">
              {[...navItemsBefore, ...navItemsAfter].map(({ label, id }) => (
                <button key={id} onClick={() => handleNav(label, id)} className="nav-link text-left py-2">
                  {label}
                </button>
              ))}
              <div className="col-span-2 border-t border-beige-dark pt-3 mt-1">
                <div className="text-xs uppercase tracking-widest text-ink/40 font-golos font-semibold mb-2">О нас</div>
                <div className="grid grid-cols-2 gap-3">
                  {aboutItems.map(({ label, id }) => (
                    <button key={id} onClick={() => handleNav(label, id)} className="nav-link text-left py-2">
                      {label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section id="glavnaya" className="relative min-h-screen overflow-hidden pt-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-beige via-beige to-sage-pale/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up pt-4">
            <div className="inline-flex items-center gap-2 bg-sage-pale text-sage px-4 py-2 rounded-full text-xs font-golos uppercase tracking-widest mb-8">
              <Icon name="Heart" size={12} />
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
            <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: "4/3" }}>
              {HERO_IMGS.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt="Спасение надежды"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                  style={{ opacity: i === slideIndex ? 1 : 0, objectPosition: i === 1 ? "center 30%" : "top" }}
                />
              ))}
              <img
                src={LOGO_IMG}
                alt="Логотип"
                className="absolute top-4 right-4 w-16 h-16 object-contain z-10 drop-shadow-lg opacity-80"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {HERO_IMGS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlideIndex(i)}
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

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-ink/30 animate-float">
          <span className="text-xs tracking-widest uppercase">листайте</span>
          <Icon name="ChevronDown" size={14} />
        </div>
      </section>
    </>
  );
}