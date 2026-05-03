import Icon from "@/components/ui/icon";

const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";

const directions = [
  {
    num: "4.1",
    icon: "MessageCircle",
    title: "Консультационная помощь",
    items: ["Психологическая", "Социальная", "Юридическая"],
  },
  {
    num: "4.2",
    icon: "HeartHandshake",
    title: "Реабилитационная и психотерапевтическая работа",
    items: ["Индивидуальная терапия", "Групповая работа", "12-шаговые программы"],
  },
  {
    num: "4.3",
    icon: "Scale",
    title: "Социально-правовое сопровождение семьи",
    items: ["Документы", "Права", "Трудоустройство"],
  },
  {
    num: "4.4",
    icon: "Baby",
    title: "Детская программа и защита детства",
    items: ["Диагностика", "Коррекция", "Родительское обучение"],
  },
  {
    num: "4.5",
    icon: "GraduationCap",
    title: "Образовательные и тренинговые программы для взрослых",
    items: ["Родительство", "Навыки трезвой жизни", "Финансовая грамотность", "Профориентация"],
  },
  {
    num: "4.6",
    icon: "Megaphone",
    title: "Профилактика и общественные инициативы",
    items: ["Лекции", "Акции", "Партнёрства"],
  },
  {
    num: "4.7",
    icon: "BarChart2",
    title: "Мониторинг, оценка и постсопровождение",
    items: ["Контроль результатов", "Наставничество", "Ремиссия"],
  },
];

const familyBlocks = [
  {
    title: "Родители",
    icon: "Users",
    items: ["Психотерапия", "Социальная поддержка", "Реабилитация"],
  },
  {
    title: "Дети",
    icon: "Baby",
    items: ["Диагностика и коррекция", "Творчество, обучение", "Психологическая защита"],
  },
];

export default function Program() {
  return (
    <div className="min-h-screen bg-beige font-golos">
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
          <a href="/" className="flex items-center gap-2 text-ink/60 hover:text-ink text-sm transition-colors">
            <Icon name="ArrowLeft" size={14} />
            На главную
          </a>
        </div>
      </nav>

      <div className="pt-28 pb-24 max-w-5xl mx-auto px-6">

        {/* HERO */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-sage" />
            <span className="text-sage text-xs tracking-[0.2em] uppercase">Кризисный центр</span>
          </div>
          <h1 className="font-cormorant text-ink text-5xl md:text-6xl font-light leading-tight mb-6">
            Программа <span className="text-sage font-semibold">работы центра</span>
          </h1>
          <p className="text-foreground/65 text-lg leading-relaxed max-w-2xl">
            Человек приходит не за услугой, а за восстановлением своей жизни. Все направления помогают семье пройти путь от кризиса и отчаяния к стабильности, ответственности и внутреннему равновесию.
          </p>
        </div>

        {/* ПРИНЦИП — работа с семьёй */}
        <div className="mb-16">
          <div className="bg-sage text-white rounded-sm p-8 md:p-10 mb-6">
            <div className="text-xs uppercase tracking-[0.2em] opacity-70 mb-3">Основной принцип</div>
            <p className="text-xl md:text-2xl font-cormorant font-light leading-relaxed">
              Работа кризисного центра строится вокруг семьи в целом — и вокруг родителей, и вокруг детей одновременно.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {familyBlocks.map((block) => (
              <div key={block.title} className="bg-white rounded-sm p-7">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-sage/10 rounded-sm flex items-center justify-center">
                    <Icon name={block.icon as "Users"} size={20} className="text-sage" />
                  </div>
                  <h3 className="font-cormorant text-ink text-2xl font-semibold">{block.title}</h3>
                </div>
                <ul className="space-y-3">
                  {block.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-foreground/70">
                      <div className="w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* НАПРАВЛЕНИЯ */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-sage" />
            <h2 className="font-cormorant text-ink text-3xl font-semibold">Основные направления работы</h2>
          </div>

          <div className="space-y-4">
            {directions.map((d) => (
              <div key={d.num} className="bg-white rounded-sm p-7 flex gap-6 items-start">
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="w-11 h-11 bg-sage/10 rounded-sm flex items-center justify-center">
                    <Icon name={d.icon as "MessageCircle"} size={20} className="text-sage" />
                  </div>
                  <span className="font-cormorant text-sage text-sm font-semibold opacity-60">{d.num}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-cormorant text-ink text-xl font-semibold mb-3">{d.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {d.items.map((item, i) => (
                      <span key={i} className="bg-beige text-foreground/65 text-xs px-3 py-1 rounded-sm border border-beige-dark">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-sm p-10 text-center">
          <h2 className="font-cormorant text-ink text-3xl font-semibold mb-4">Обратиться за помощью</h2>
          <p className="text-foreground/60 mb-8 max-w-md mx-auto">Свяжитесь с нами — специалисты центра подберут подходящее направление работы для вашей семьи</p>
          <a
            href="/#kontakty"
            className="inline-flex items-center gap-2 bg-sage text-white px-8 py-4 rounded-sm font-golos font-semibold uppercase tracking-wider text-sm hover:bg-sage-dark transition-colors"
          >
            Связаться с нами
            <Icon name="ArrowRight" size={16} />
          </a>
        </div>

      </div>
    </div>
  );
}
