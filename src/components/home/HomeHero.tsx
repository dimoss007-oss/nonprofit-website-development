import { useState } from "react";
import Icon from "@/components/ui/icon";

const HERO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/82a9f428-4386-466d-88e0-0ad976b369c3.jpg";
const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";
const VK_URL = "https://vk.com/spasenienadezhdi";

const navItems = [
  { label: "главная", id: "glavnaya" },
  { label: "о нас", id: "o-nas" },
  { label: "миссия", id: "missiya" },
  { label: "команда", id: "komanda" },
  { label: "новости", id: "/news" },
  { label: "видео", id: "/video" },
  { label: "поддержка", id: "podderzhka" },
  { label: "контакты", id: "kontakty" },
];

interface Props {
  onScrollTo: (id: string) => void;
  activeSection: string;
  setActiveSection: (s: string) => void;
}

export default function HomeHero({ onScrollTo, activeSection, setActiveSection }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (label: string, id: string) => {
    setActiveSection(label);
    onScrollTo(id);
    setMenuOpen(false);
  };

  return (
    <>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-beige/95 backdrop-blur-sm border-b border-beige-dark">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="Спасение надежды" className="w-14 h-14 object-contain" />
            <div>
              <div className="font-cormorant text-ink text-lg font-semibold leading-none">Спасение надежды</div>
              <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Кризисный центр</div>
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-6">
            {navItems.map(({ label, id }) => (
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
              {navItems.map(({ label, id }) => (
                <button key={id} onClick={() => handleNav(label, id)} className="nav-link text-left py-2">
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section id="glavnaya" className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Спасение надежды" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-beige/95 via-beige/80 to-beige/30" />
          <img src={LOGO_IMG} alt="Логотип" className="absolute bottom-8 right-8 w-28 h-28 object-contain opacity-30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-sage-pale text-sage px-4 py-2 rounded-full text-xs font-golos uppercase tracking-widest mb-8">
              <Icon name="Heart" size={12} />
              АНО «Спасение надежды»
            </div>
            <h1 className="font-cormorant text-ink text-6xl md:text-7xl font-light leading-[1.0] mb-6">
              Там, где<br/>
              <span className="text-sage font-semibold">нужна</span><br/>
              надежда
            </h1>
            <p className="text-foreground/65 text-lg leading-relaxed max-w-lg mb-10">
              Мы помогаем людям в трудных жизненных ситуациях — оказываем социальную поддержку, восстанавливаем надежду и возвращаем уверенность в завтрашнем дне.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onScrollTo("podderzhka")}
                className="px-8 py-3.5 bg-sage text-beige font-golos font-semibold text-sm uppercase tracking-wide rounded-sm hover:bg-sage-dark transition-all duration-300 hover:scale-105"
              >
                Помочь организации
              </button>
              <a
                href={VK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 border border-sage/40 text-sage font-golos text-sm uppercase tracking-wide rounded-sm hover:border-sage hover:bg-sage-pale transition-all duration-300 flex items-center gap-2"
              >
                <Icon name="ExternalLink" size={14} /> Наша группа ВК
              </a>
            </div>
          </div>

          <div className="animate-fade-up delay-300 grid grid-cols-2 gap-4">
            {[
              { num: "с 2024", label: "года помогаем семьям" },
              { num: "30+", label: "семей получили помощь" },
              { num: "10+", label: "детей вернули в семьи" },
              { num: "100%", label: "прозрачность расходов" },
            ].map(({ num, label }) => (
              <div key={num} className="bg-white/70 backdrop-blur border border-beige-dark rounded-sm p-5 hover:shadow-md transition-shadow duration-300">
                <div className="font-cormorant text-sage text-4xl font-semibold mb-1">{num}</div>
                <div className="text-muted-foreground text-sm leading-snug">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-ink/30 animate-float">
          <span className="text-xs tracking-widest uppercase">листайте</span>
          <Icon name="ChevronDown" size={14} />
        </div>
      </section>
    </>
  );
}
