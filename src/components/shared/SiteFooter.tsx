import Icon from "@/components/ui/icon";

const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";
const VK_URL = "https://vk.com/spasenienadezhdi";

const navLinks = [
  { label: "главная", href: "/" },
  { label: "о нас", href: "/#o-nas" },
  { label: "программа", href: "/program" },
  { label: "новости", href: "/news" },
  { label: "поддержать нас", href: "/#podderzhka" },
  { label: "контакты", href: "/#kontakty" },
  { label: "сведения об образовании", href: "/edu-license" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-ink py-10" aria-label="Подвал сайта">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <a href="/" aria-label="АНО Спасение надежды — на главную" className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="Логотип АНО Спасение надежды" style={{ borderRadius: "50%", width: 48, height: 48, objectFit: "cover", flexShrink: 0 }} />
            <div aria-hidden="true">
              <div className="font-cormorant text-beige text-lg font-semibold">Спасение надежды</div>
              <div className="text-beige/40 text-[10px] uppercase tracking-wider">АНО</div>
            </div>
          </a>

          <nav aria-label="Навигация в подвале">
            <ul className="flex flex-wrap justify-center gap-6 list-none p-0 m-0">
              {navLinks.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-beige/50 hover:text-beige/90 text-xs font-golos uppercase tracking-widest transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <a
            href={VK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ВКонтакте — страница организации (открывается в новой вкладке)"
            className="flex items-center gap-2 text-beige/50 hover:text-sage-light transition-colors text-sm"
          >
            <Icon name="ExternalLink" size={14} aria-hidden="true" />
            ВКонтакте
          </a>
        </div>

        <div className="deco-line mb-5" aria-hidden="true" />

        <address className="not-italic text-center text-beige/25 text-xs space-y-1 mb-3">
          <p>АНО «Спасение надежды» | ОГРН 1245800010114 | ИНН 5800011843 | КПП 580001001</p>
          <p>Юридический адрес: г. Пенза, ул. 8 марта 17Б</p>
        </address>

        <p className="text-center text-beige/25 text-xs">
          <small>© 2026 АНО «Спасение надежды». Все права защищены.</small>
        </p>
      </div>
    </footer>
  );
}