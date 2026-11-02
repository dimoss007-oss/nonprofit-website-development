import Icon from "@/components/ui/icon";
import { Link } from "@tanstack/react-router";

const WIDE = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/files/23fe2fad-aa29-4ec7-a196-8ce60b8a7335.jpg";
const SQUARE = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/files/1658c104-d649-4dd2-9a07-5ff0e8526aa1.jpg";

export default function BrigadeHero({ showCta }: { showCta: boolean }) {
  return (
    <header className="relative bg-navy text-white overflow-hidden">
      <picture>
        <source media="(min-width: 768px)" srcSet={WIDE} />
        <img src={SQUARE} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/55 md:to-navy/30" />
      <div className="relative max-w-5xl mx-auto px-5 py-14 sm:py-24 md:py-32">
        <Link to="/" className="text-sm text-white/85 hover:underline">На главную</Link>
        <h1 className="font-golos text-3xl sm:text-5xl md:text-6xl font-bold mt-4 mb-4 leading-tight max-w-3xl">Мобильная выездная бригада</h1>
        <p className="text-base sm:text-lg text-white/95 max-w-2xl leading-relaxed">
          Мы приезжаем туда, где нужна помощь: в отдалённые сёла и районы, к семьям, которые не могут добраться до центра сами.
        </p>
        {showCta && (
          <a href="#help" className="inline-flex items-center gap-2 mt-7 px-6 py-3.5 rounded-lg bg-white text-navy font-semibold hover:bg-mist transition-colors">
            Поддержать выезды <Icon name="ArrowDown" size={18} />
          </a>
        )}
        <p className="mt-8 text-xs text-white/70">Иллюстрация</p>
      </div>
    </header>
  );
}
