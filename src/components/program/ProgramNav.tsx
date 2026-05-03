import Icon from "@/components/ui/icon";

const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";

export default function ProgramNav() {
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
        <a href="/" className="flex items-center gap-2 text-ink/60 hover:text-ink text-sm transition-colors">
          <Icon name="ArrowLeft" size={14} />
          На главную
        </a>
      </div>
    </nav>
  );
}
