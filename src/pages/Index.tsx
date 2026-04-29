import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const HERO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/files/2f04b4eb-3162-4cce-86d9-50a2cb12022e.jpg";
const VK_URL = "https://vk.com/spasenienadezhdi";

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
}

const teamMembers = [
  { name: "Руководитель организации", role: "Директор", initial: "Р", emoji: "🌿" },
  { name: "Координатор программ", role: "Программный директор", initial: "К", emoji: "🤝" },
  { name: "Куратор волонтёров", role: "Волонтёрский менеджер", initial: "В", emoji: "💚" },
  { name: "Специалист по связям", role: "PR и коммуникации", initial: "С", emoji: "🌱" },
];

const donationAmounts = [300, 500, 1000, 3000];

export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("главная");
  const [donationAmount, setDonationAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const scrollTo = (id: string) => {
    if (id.startsWith("/")) { window.location.href = id; return; }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const finalAmount = customAmount ? Number(customAmount) : donationAmount;

  return (
    <div className="min-h-screen bg-beige font-golos overflow-x-hidden">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-beige/95 backdrop-blur-sm border-b border-beige-dark">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sage flex items-center justify-center">
              <Icon name="Heart" size={16} className="text-beige" />
            </div>
            <div>
              <div className="font-cormorant text-ink text-lg font-semibold leading-none">Спасение надежды</div>
              <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Некоммерческая организация</div>
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-6">
            {navItems.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => { setActiveSection(label); scrollTo(id); }}
                className={`nav-link ${activeSection === label ? "active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-ink">
            <Icon name={menuOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden bg-beige border-t border-beige-dark">
            <div className="px-6 py-4 grid grid-cols-2 gap-3">
              {navItems.map(({ label, id }) => (
                <button key={id} onClick={() => { setActiveSection(label); scrollTo(id); }} className="nav-link text-left py-2">
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
                onClick={() => scrollTo("podderzhka")}
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
              { num: "8+ лет", label: "помогаем людям" },
              { num: "2 400+", label: "человек получили помощь" },
              { num: "150+", label: "волонтёров" },
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

      {/* О НАС */}
      <section id="o-nas" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px w-8 bg-sage" />
                  <span className="text-sage text-xs tracking-[0.2em] uppercase font-golos">О нас</span>
                </div>
                <h2 className="font-cormorant text-ink text-5xl font-light leading-tight mb-7">
                  АНО «Спасение надежды» —<br/>
                  <span className="text-sage font-semibold">рядом в трудный момент</span>
                </h2>
                <div className="space-y-4 text-foreground/65 leading-relaxed">
                  <p>
                    Автономная некоммерческая организация «Спасение надежды» была создана, чтобы помогать людям, оказавшимся в сложных жизненных ситуациях: потерявшим жильё, работу, оказавшимся в социальной изоляции.
                  </p>
                  <p>
                    Мы верим, что каждый человек заслуживает поддержки и шанса на лучшую жизнь. Наши волонтёры и специалисты работают каждый день, чтобы эта вера становилась реальностью.
                  </p>
                  <p>
                    Следите за нашей работой в группе ВКонтакте — там мы публикуем новости, истории и отчёты о деятельности.
                  </p>
                </div>
                <div className="mt-8">
                  <a
                    href={VK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sage font-golos font-semibold text-sm hover:underline"
                  >
                    Подписаться на группу ВК <Icon name="ArrowRight" size={14} />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "Home", title: "Помощь с жильём", text: "Поддерживаем людей, оказавшихся без крыши над головой" },
                  { icon: "BookOpen", title: "Образование", text: "Организуем курсы и мастерские для повышения квалификации" },
                  { icon: "Users", title: "Сообщество", text: "Создаём среду взаимопомощи и социальных связей" },
                  { icon: "HandHeart", title: "Адресная помощь", text: "Адресная поддержка семей и одиноких людей" },
                ].map(({ icon, title, text }) => (
                  <div key={title} className="bg-sage-pale/60 p-5 rounded-sm hover:bg-sage-pale transition-colors duration-200">
                    <div className="w-10 h-10 bg-sage/15 rounded-full flex items-center justify-center mb-3">
                      <Icon name={icon as "Home"} size={18} className="text-sage" />
                    </div>
                    <div className="font-cormorant text-ink text-lg font-semibold mb-1">{title}</div>
                    <div className="text-muted-foreground text-xs leading-relaxed">{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* МИССИЯ */}
      <section id="missiya" className="py-28 bg-sage relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-10 left-10 w-80 h-80 rounded-full border-2 border-beige" />
          <div className="absolute bottom-10 right-20 w-56 h-56 rounded-full border-2 border-beige" />
          <div className="absolute top-1/2 right-1/3 w-40 h-40 rounded-full border border-beige" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="h-px w-10 bg-beige/40" />
                <span className="text-beige/70 text-xs tracking-[0.2em] uppercase font-golos">Наша миссия</span>
                <div className="h-px w-10 bg-beige/40" />
              </div>
              <h2 className="font-cormorant text-beige text-5xl md:text-6xl font-light leading-tight mb-6">
                Восстанавливать надежду<br/>
                <span className="font-semibold">в каждом человеке</span>
              </h2>
              <p className="text-beige/70 leading-relaxed">
                Мы убеждены: безвыходных ситуаций не бывает. Наша задача — быть рядом в самый трудный момент и помочь найти выход.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: "Heart", title: "Без осуждения", text: "Мы принимаем каждого человека таким, какой он есть, без оценок и предубеждений." },
                { icon: "Shield", title: "Надёжно и честно", text: "Все пожертвования расходуются прозрачно, мы публикуем отчёты о каждом потраченном рубле." },
                { icon: "Sprout", title: "Долгосрочно", text: "Мы не просто помогаем выжить сегодня — мы помогаем построить лучшее завтра." },
              ].map(({ icon, title, text }) => (
                <div key={title} className="bg-white/10 border border-beige/20 p-7 rounded-sm hover:bg-white/15 transition-colors duration-300 group">
                  <div className="w-11 h-11 rounded-full border border-beige/30 flex items-center justify-center mb-5 group-hover:border-beige/60 transition-colors">
                    <Icon name={icon as "Heart"} size={20} className="text-beige/80" />
                  </div>
                  <h3 className="font-cormorant text-beige text-2xl font-semibold mb-3">{title}</h3>
                  <p className="text-beige/60 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* КОМАНДА */}
      <section id="komanda" className="py-28 bg-beige-mid">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-8 bg-sage" />
              <span className="text-sage text-xs tracking-[0.2em] uppercase font-golos">Команда</span>
            </div>
            <h2 className="font-cormorant text-ink text-5xl font-light mb-12">
              Люди, которые<br/><span className="text-sage font-semibold">делают это возможным</span>
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {teamMembers.map((m) => (
                <div key={m.name} className="group bg-beige rounded-sm p-7 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="w-16 h-16 rounded-full bg-sage-pale flex items-center justify-center text-3xl mb-5">
                    {m.emoji}
                  </div>
                  <h3 className="font-cormorant text-ink text-xl font-semibold mb-1">{m.name}</h3>
                  <p className="text-muted-foreground text-sm">{m.role}</p>
                  <div className="mt-4 h-px bg-sage/20 group-hover:bg-sage/50 transition-colors duration-300" />
                </div>
              ))}
            </div>

            <div className="mt-10 bg-sage-pale/60 rounded-sm p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="font-cormorant text-ink text-2xl font-semibold mb-1">Хочешь стать волонтёром?</div>
                <p className="text-muted-foreground text-sm">Мы всегда рады новым людям, готовым помогать.</p>
              </div>
              <a
                href={VK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3 bg-sage text-beige text-sm font-golos font-semibold uppercase tracking-wide rounded-sm hover:bg-sage-dark transition-colors whitespace-nowrap flex items-center gap-2"
              >
                Написать нам <Icon name="ExternalLink" size={13} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* НОВОСТИ — превью */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
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

            <div className="grid md:grid-cols-3 gap-6">
              {[1,2,3].map((i) => (
                <div key={i} className="bg-beige rounded-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="h-1 bg-gradient-to-r from-sage to-sage-light" />
                  <div className="p-6">
                    <div className="skeleton h-3 rounded w-1/3 mb-4" />
                    <div className="skeleton h-4 rounded mb-2" />
                    <div className="skeleton h-4 rounded w-4/5 mb-2" />
                    <div className="skeleton h-4 rounded w-3/5 mb-5" />
                    <div className="skeleton h-3 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-muted-foreground text-sm mt-6">
              Новости загружаются автоматически из группы ВКонтакте →{" "}
              <a href="/news" className="text-sage hover:underline">открыть ленту</a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ВИДЕО — превью */}
      <section className="py-28 bg-beige-mid">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
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

            <div className="grid md:grid-cols-3 gap-6">
              {[1,2,3].map((i) => (
                <div key={i} className="bg-beige rounded-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="aspect-video bg-sage-pale flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-sage/20 flex items-center justify-center">
                      <Icon name="Play" size={24} className="text-sage ml-1" />
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="skeleton h-4 rounded mb-2" />
                    <div className="skeleton h-3 rounded w-3/5" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-muted-foreground text-sm mt-6">
              Видео загружаются из группы ВКонтакте после добавления токена →{" "}
              <a href="/video" className="text-sage hover:underline">открыть раздел</a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ПОДДЕРЖКА */}
      <section id="podderzhka" className="py-28 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sage-pale/50 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="grid lg:grid-cols-2 gap-20 items-start">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px w-8 bg-sage" />
                  <span className="text-sage text-xs tracking-[0.2em] uppercase font-golos">Поддержка</span>
                </div>
                <h2 className="font-cormorant text-ink text-5xl font-light leading-tight mb-7">
                  Ваш вклад —<br/><span className="text-sage font-semibold">чья-то надежда</span>
                </h2>
                <p className="text-foreground/65 leading-relaxed mb-8">
                  Любая сумма имеет значение. Мы работаем полностью на пожертвования и публикуем отчёты о каждом потраченном рубле.
                </p>
                <div className="space-y-3">
                  {[
                    { amount: "300 ₽", impact: "горячий обед для одного человека" },
                    { amount: "500 ₽", impact: "необходимые медикаменты" },
                    { amount: "1 000 ₽", impact: "неделя адресной поддержки семьи" },
                    { amount: "3 000 ₽", impact: "месяц в программе реабилитации" },
                  ].map(({ amount, impact }) => (
                    <div key={amount} className="flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full bg-sage/15 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <Icon name="Check" size={11} className="text-sage" />
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-sage">{amount}</span>
                        <span className="text-foreground/60"> — {impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-sage rounded-sm p-8 shadow-xl">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">💚</div>
                    <h3 className="font-cormorant text-beige text-3xl font-semibold mb-2">Спасибо!</h3>
                    <p className="text-beige/70 text-sm">Ваша поддержка меняет жизни. Мы свяжемся с вами.</p>
                  </div>
                ) : (
                  <form onSubmit={handleDonate} className="space-y-5">
                    <h3 className="font-cormorant text-beige text-2xl font-semibold">Сделать пожертвование</h3>

                    <div>
                      <label className="text-beige/60 text-xs uppercase tracking-wider mb-2.5 block">Сумма</label>
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {donationAmounts.map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => { setDonationAmount(a); setCustomAmount(""); }}
                            className={`py-2.5 text-sm font-semibold rounded-sm transition-all duration-200 ${
                              donationAmount === a && !customAmount
                                ? "bg-beige text-sage"
                                : "border border-beige/25 text-beige hover:border-beige/50"
                            }`}
                          >
                            {a} ₽
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        placeholder="Другая сумма (₽)"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full bg-white/10 border border-beige/20 text-beige placeholder-beige/35 px-3 py-2.5 focus:outline-none focus:border-beige/50 text-sm rounded-sm"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsRecurring(!isRecurring)}
                        className={`w-10 h-5 rounded-full transition-all duration-300 flex items-center px-0.5 ${isRecurring ? "bg-beige" : "bg-white/20"}`}
                      >
                        <div className={`w-4 h-4 rounded-full transition-transform duration-300 ${isRecurring ? "bg-sage translate-x-5" : "bg-beige"}`} />
                      </button>
                      <span className="text-beige/70 text-sm">Ежемесячно</span>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Ваше имя"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className="w-full bg-white/10 border border-beige/20 text-beige placeholder-beige/35 px-3 py-2.5 focus:outline-none focus:border-beige/50 text-sm rounded-sm"
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        className="w-full bg-white/10 border border-beige/20 text-beige placeholder-beige/35 px-3 py-2.5 focus:outline-none focus:border-beige/50 text-sm rounded-sm"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-beige text-sage py-3.5 font-golos font-semibold text-sm tracking-wide uppercase rounded-sm hover:bg-beige-mid transition-all duration-300"
                    >
                      Пожертвовать {finalAmount ? `${finalAmount.toLocaleString()} ₽` : ""}{isRecurring ? " / мес" : ""}
                    </button>
                    <p className="text-beige/35 text-xs text-center">Ваши данные в безопасности</p>
                  </form>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* КОНТАКТЫ */}
      <section id="kontakty" className="py-28 bg-beige-mid">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="grid lg:grid-cols-2 gap-20">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px w-8 bg-sage" />
                  <span className="text-sage text-xs tracking-[0.2em] uppercase font-golos">Контакты</span>
                </div>
                <h2 className="font-cormorant text-ink text-5xl font-light leading-tight mb-7">
                  Свяжитесь<br/><span className="text-sage font-semibold">с нами</span>
                </h2>
                <p className="text-foreground/65 leading-relaxed mb-10">
                  Мы отвечаем на все обращения. Если вам нужна помощь или вы хотите помочь — напишите нам.
                </p>
                <div className="space-y-5">
                  {[
                    { icon: "ExternalLink", label: "ВКонтакте", value: "vk.com/spasenienadezhdi", href: VK_URL },
                    { icon: "Mail", label: "Email", value: "info@spasenienadezhdi.ru", href: "mailto:info@spasenienadezhdi.ru" },
                    { icon: "Phone", label: "Телефон", value: "+7 (000) 000-00-00", href: "tel:+70000000000" },
                    { icon: "Clock", label: "Часы работы", value: "Пн–Пт, 10:00 – 18:00", href: null },
                  ].map(({ icon, label, value, href }) => (
                    <div key={label} className="flex gap-4 items-start">
                      <div className="w-9 h-9 rounded-full bg-sage/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon name={icon as "Mail"} size={15} className="text-sage" />
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">{label}</div>
                        {href ? (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-ink text-sm hover:text-sage transition-colors">{value}</a>
                        ) : (
                          <div className="text-ink text-sm">{value}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form className="space-y-4 bg-beige rounded-sm p-8" onSubmit={(e) => e.preventDefault()}>
                <h3 className="font-cormorant text-ink text-2xl font-semibold mb-2">Написать нам</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Имя" className="bg-white border border-beige-dark text-ink placeholder-muted-foreground px-3 py-2.5 focus:outline-none focus:border-sage text-sm rounded-sm" />
                  <input type="email" placeholder="Email" className="bg-white border border-beige-dark text-ink placeholder-muted-foreground px-3 py-2.5 focus:outline-none focus:border-sage text-sm rounded-sm" />
                </div>
                <input type="text" placeholder="Тема" className="w-full bg-white border border-beige-dark text-ink placeholder-muted-foreground px-3 py-2.5 focus:outline-none focus:border-sage text-sm rounded-sm" />
                <textarea placeholder="Сообщение..." rows={4} className="w-full bg-white border border-beige-dark text-ink placeholder-muted-foreground px-3 py-2.5 focus:outline-none focus:border-sage text-sm rounded-sm resize-none" />
                <button type="submit" className="w-full bg-sage text-beige py-3.5 font-golos font-semibold text-sm tracking-wide uppercase rounded-sm hover:bg-sage-dark transition-colors duration-300">
                  Отправить
                </button>
              </form>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-ink py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sage flex items-center justify-center">
                <Icon name="Heart" size={14} className="text-beige" />
              </div>
              <div>
                <div className="font-cormorant text-beige text-lg font-semibold">Спасение надежды</div>
                <div className="text-beige/40 text-[10px] uppercase tracking-wider">АНО</div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {navItems.map(({ label, id }) => (
                <button key={id} onClick={() => scrollTo(id)} className="nav-link text-beige/50 hover:text-beige/90 text-xs">
                  {label}
                </button>
              ))}
            </div>
            <a
              href={VK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-beige/50 hover:text-sage-light transition-colors text-sm"
            >
              <Icon name="ExternalLink" size={14} /> ВКонтакте
            </a>
          </div>
          <div className="deco-line mb-5" />
          <p className="text-center text-beige/25 text-xs">
            © 2026 АНО «Спасение надежды». Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
}
