import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";
const VK_URL = "https://vk.com/spasenienadezhdi";

const navItemsBefore = [
  { label: "главная", href: "/" },
];

const navItemsAfter = [
  { label: "программа", href: "/program" },
  { label: "наши семьи", href: "/our-families" },
  { label: "новости", href: "/news" },
];

const aboutItems = [
  { label: "О нас", anchor: "o-nas" },
  { label: "Миссия", anchor: "missiya" },
  { label: "Команда", anchor: "komanda" },
  { label: "Фотогалерея", href: "/gallery" },
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
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="Спасение надежды" className="w-14 h-14 object-contain" />
            <div>
              <div className="font-cormorant text-ink text-lg font-semibold leading-none">Спасение надежды</div>
              <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Кризисный центр</div>
            </div>
          </a>
          <a href="https://президентскиегранты.рф" target="_blank" rel="noopener noreferrer" title="Фонд президентских грантов" className="hidden sm:block border-l border-beige-dark pl-4">
            <img
              src="https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/fe35576e-c533-469d-97ee-1a6ffde86c77.png"
              alt="Фонд президентских грантов"
              className="h-14 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
            />
          </a>
        </div>

        <div className="hidden lg:flex items-center gap-4 text-sm">
          {navItemsBefore.map(({ label, href }) => (
            <a key={href} href={href} className="nav-link">{label}</a>
          ))}

          {/* О нас — дропдаун */}
          <div ref={aboutRef} className="relative">
            <button
              onClick={() => setAboutOpen(!aboutOpen)}
              className="nav-link flex items-center gap-1"
            >
              о нас
              <Icon name="ChevronDown" size={13} className={`transition-transform duration-200 ${aboutOpen ? "rotate-180" : ""}`} />
            </button>
            {aboutOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white shadow-lg rounded-sm border border-beige-dark min-w-[180px] py-1 z-50">
                {aboutItems.map((item) => (
                  "href" in item ? (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setAboutOpen(false)}
                      className="block px-4 py-2.5 text-sm text-ink hover:text-sage hover:bg-beige/50 transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <button
                      key={item.label}
                      onClick={() => navigateToAnchor(item.anchor)}
                      className="w-full text-left px-4 py-2.5 text-sm text-ink hover:text-sage hover:bg-beige/50 transition-colors"
                    >
                      {item.label}
                    </button>
                  )
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
            {aboutItems.map((item) => (
              "href" in item ? (
                <button key={item.label} onClick={() => navigateTo(item.href)} className="nav-link text-left py-2">{item.label}</button>
              ) : (
                <button key={item.label} onClick={() => navigateToAnchor(item.anchor)} className="nav-link text-left py-2">{item.label}</button>
              )
            ))}
            {navItemsAfter.map(({ label, href }) => (
              <button key={href} onClick={() => navigateTo(href)} className="nav-link text-left py-2">{label}</button>
            ))}
            <button onClick={() => navigateTo("/#podderzhka")} className="nav-link text-left py-2">поддержать нас</button>
            <button onClick={() => navigateTo("/#kontakty")} className="nav-link text-left py-2">контакты</button>

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