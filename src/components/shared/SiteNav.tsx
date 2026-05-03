import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";
const VK_URL = "https://vk.com/spasenienadezhdi";

const navItemsBefore = [
  { label: "главная", href: "/" },
];

const navItemsAfter = [
  { label: "программа", href: "/program" },
  { label: "новости", href: "/news" },
];

const aboutItems = [
  { label: "О нас", anchor: "o-nas" },
  { label: "Миссия", anchor: "missiya" },
  { label: "Команда", anchor: "komanda" },
];

export default function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) setAboutOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navigateTo = (href: string) => {
    window.location.href = href;
    setMenuOpen(false);
  };

  const navigateToAnchor = (anchor: string) => {
    window.location.href = `/#${anchor}`;
    setMenuOpen(false);
    setAboutOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-beige/95 backdrop-blur-sm border-b border-beige-dark">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <img src={LOGO_IMG} alt="Спасение надежды" className="w-14 h-14 object-contain" />
          <div>
            <div className="font-cormorant text-ink text-lg font-semibold leading-none">Спасение надежды</div>
            <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Кризисный центр</div>
          </div>
        </a>
        <a href="https://президентскиегранты.рф" target="_blank" rel="noopener noreferrer" title="Фонд президентских грантов">
          <img
            src="http://xn--80afcdbalict6afooklqi5o.xn--p1ai/public/static/img/Fpg/fpg-logo.png"
            alt="Фонд президентских грантов"
            className="h-10 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
          />
        </a>

        <div className="hidden lg:flex items-center gap-6">
          {navItemsBefore.map(({ label, href }) => (
            <a key={href} href={href} className="nav-link">{label}</a>
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
                {aboutItems.map(({ label, anchor }) => (
                  <button
                    key={anchor}
                    onClick={() => navigateToAnchor(anchor)}
                    className="w-full text-left px-4 py-2.5 text-xs uppercase tracking-widest text-ink/70 hover:text-primary hover:bg-sage-pale transition-colors duration-150 font-golos"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {navItemsAfter.map(({ label, href }) => (
            <a key={href} href={href} className="nav-link">{label}</a>
          ))}

          <a href="/#podderzhka" className="nav-link">поддержать нас</a>
          <a href="/#kontakty" className="nav-link">контакты</a>
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
            {navItemsBefore.map(({ label, href }) => (
              <button key={href} onClick={() => navigateTo(href)} className="nav-link text-left py-2">{label}</button>
            ))}
            {navItemsAfter.map(({ label, href }) => (
              <button key={href} onClick={() => navigateTo(href)} className="nav-link text-left py-2">{label}</button>
            ))}
            <button onClick={() => navigateTo("/#podderzhka")} className="nav-link text-left py-2">поддержать нас</button>
            <button onClick={() => navigateTo("/#kontakty")} className="nav-link text-left py-2">контакты</button>

            <div className="col-span-2 border-t border-beige-dark pt-3 mt-1">
              <div className="text-xs uppercase tracking-widest text-ink/40 font-golos font-semibold mb-2">О нас</div>
              <div className="grid grid-cols-2 gap-3">
                {aboutItems.map(({ label, anchor }) => (
                  <button key={anchor} onClick={() => navigateToAnchor(anchor)} className="nav-link text-left py-2">
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2 border-t border-beige-dark pt-3 mt-1">
              <a href={VK_URL} target="_blank" rel="noopener noreferrer" className="nav-link text-left py-2 block">
                ВКонтакте
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}