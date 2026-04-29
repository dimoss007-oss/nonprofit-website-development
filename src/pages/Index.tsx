import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const HERO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/files/816a6f8b-3744-4a4f-9419-16fd09eae5d2.jpg";
const MISSION_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/files/3762e589-ebe3-4415-894b-2497fef34020.jpg";
const TEAM_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/files/df24eb93-543d-4047-8dd6-bcec81af892d.jpg";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className}`}
    >
      {children}
    </div>
  );
}

const teamMembers = [
  { name: "Анна Соколова", role: "Основатель и директор", emoji: "🌿" },
  { name: "Михаил Орлов", role: "Руководитель проектов", emoji: "🦅" },
  { name: "Лариса Ветрова", role: "Куратор программ", emoji: "🌸" },
  { name: "Дмитрий Лесной", role: "Координатор волонтёров", emoji: "🌲" },
];

const blogPosts = [
  {
    date: "18 апреля 2026",
    category: "Новости",
    title: "Открываем новую программу поддержки молодёжи",
    excerpt: "В этом году мы расширяем деятельность — запускаем образовательные мастерские в трёх городах.",
  },
  {
    date: "5 апреля 2026",
    category: "Истории",
    title: "Как одно доброе слово меняет судьбу",
    excerpt: "История Алины, которая нашла свой путь благодаря программе наставничества нашей организации.",
  },
  {
    date: "22 марта 2026",
    category: "Отчёт",
    title: "Итоги зимнего сезона: цифры и люди",
    excerpt: "1200 человек получили помощь, 80 волонтёров работали ежедневно — рассказываем о результатах.",
  },
];

const donationAmounts = [500, 1000, 2500, 5000];

export default function Index() {
  const [activeNav, setActiveNav] = useState("главная");
  const [menuOpen, setMenuOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [donationName, setDonationName] = useState("");
  const [donationEmail, setDonationEmail] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const navItems = ["главная", "о нас", "миссия", "команда", "поддержка", "контакты", "блог"];

  const scrollTo = (id: string) => {
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
    <div className="min-h-screen bg-cream font-golos overflow-x-hidden">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-forest/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-forest font-cormorant font-bold text-lg">
              Д
            </div>
            <span className="font-cormorant text-cream text-xl font-semibold tracking-wide">Добро</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => { setActiveNav(item); scrollTo(item.replace(" ", "-")); }}
                className={`nav-link ${activeNav === item ? "opacity-100" : ""}`}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-cream"
          >
            <Icon name={menuOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-forest border-t border-white/10">
            <div className="px-6 py-4 flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => { setActiveNav(item); scrollTo(item.replace(" ", "-")); }}
                  className="nav-link text-left py-1"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section id="главная" className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Объединяем людей" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-forest/90 via-forest/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest/60 via-transparent to-transparent" />
        </div>

        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gold/20 hidden lg:block" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20 grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-up">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-gold" />
              <span className="text-gold font-golos text-xs tracking-[0.25em] uppercase">Некоммерческая организация</span>
            </div>
            <h1 className="font-cormorant text-cream text-6xl md:text-8xl font-light leading-[0.95] mb-8">
              Мы меняем<br/>
              <em className="text-gold-light not-italic font-semibold">мир</em><br/>
              вместе
            </h1>
            <p className="text-cream/75 font-golos text-lg leading-relaxed max-w-md mb-10">
              Организация «Добро» объединяет неравнодушных людей, создаёт устойчивые социальные изменения и даёт голос тем, кто в этом нуждается.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => scrollTo("поддержка")}
                className="px-8 py-4 bg-gold text-forest font-golos font-semibold text-sm tracking-wide uppercase hover:bg-gold-light transition-all duration-300 hover:scale-105"
              >
                Поддержать
              </button>
              <button
                onClick={() => scrollTo("о-нас")}
                className="px-8 py-4 border border-cream/40 text-cream font-golos text-sm tracking-wide uppercase hover:border-gold hover:text-gold transition-all duration-300"
              >
                Узнать больше
              </button>
            </div>
          </div>

          <div className="animate-fade-up delay-300 grid grid-cols-2 gap-4 lg:gap-6">
            {[
              { num: "12 лет", label: "на службе обществу" },
              { num: "48 000+", label: "людей получили помощь" },
              { num: "320", label: "волонтёров по стране" },
              { num: "95%", label: "средств идёт на программы" },
            ].map(({ num, label }) => (
              <div key={num} className="bg-cream/10 backdrop-blur border border-cream/15 p-6 hover:bg-cream/15 transition-colors duration-300">
                <div className="font-cormorant text-gold text-4xl font-semibold mb-2">{num}</div>
                <div className="text-cream/65 text-sm leading-snug">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cream/50 animate-float">
          <span className="text-xs tracking-widest uppercase">листайте</span>
          <Icon name="ChevronDown" size={16} />
        </div>
      </section>

      {/* О НАС */}
      <section id="о-нас" className="py-32 bg-cream">
        <div className="max-w-7xl mx-auto px-6">
          <Section>
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-8 bg-gold" />
                  <span className="text-gold text-xs tracking-[0.2em] uppercase font-golos">О нас</span>
                </div>
                <h2 className="font-cormorant text-ink text-5xl md:text-6xl font-light leading-tight mb-8">
                  История, рождённая<br/><em className="text-forest font-semibold not-italic">из сострадания</em>
                </h2>
                <div className="space-y-5 text-foreground/70 leading-relaxed">
                  <p>
                    Организация «Добро» была основана в 2014 году группой единомышленников, убеждённых: системные изменения возможны только тогда, когда каждый человек чувствует свою ценность и причастность.
                  </p>
                  <p>
                    Мы работаем в сферах образования, социальной поддержки и развития местных сообществ. Наши программы охватывают 18 регионов России.
                  </p>
                  <p>
                    Прозрачность, честность и человечность — три кита, на которых стоит всё, что мы делаем.
                  </p>
                </div>
                <div className="mt-10 deco-line" />
                <div className="mt-8 flex items-center gap-6">
                  <div className="w-14 h-14 rounded-full bg-forest flex items-center justify-center text-cream font-cormorant text-2xl">
                    А
                  </div>
                  <div>
                    <div className="font-cormorant text-ink text-lg font-semibold">Анна Соколова</div>
                    <div className="text-muted-foreground text-sm">Основатель и директор</div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="relative overflow-hidden aspect-[4/5]">
                  <img src={MISSION_IMG} alt="Наша история" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-forest/20" />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-forest text-cream p-6 shadow-2xl">
                  <div className="font-cormorant text-5xl text-gold font-semibold">12</div>
                  <div className="text-xs text-cream/70 uppercase tracking-wider mt-1">лет<br/>работы</div>
                </div>
                <div className="absolute -top-3 -right-3 w-full h-full border border-gold/30 pointer-events-none" />
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* МИССИЯ */}
      <section id="миссия" className="py-32 bg-forest relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-96 h-96 rounded-full border border-cream" />
          <div className="absolute bottom-20 right-10 w-64 h-64 rounded-full border border-cream" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-cream" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <Section>
            <div className="text-center mb-20">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-12 bg-gold/50" />
                <span className="text-gold text-xs tracking-[0.2em] uppercase font-golos">Миссия</span>
                <div className="h-px w-12 bg-gold/50" />
              </div>
              <h2 className="font-cormorant text-cream text-5xl md:text-7xl font-light leading-tight">
                Создавать пространство,<br/>
                <em className="text-gold not-italic font-semibold">где важен каждый</em>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: "Heart",
                  title: "Человек в центре",
                  text: "Каждое наше решение начинается с вопроса: как это повлияет на жизнь конкретного человека? Мы видим не статистику, а людей.",
                },
                {
                  icon: "Sprout",
                  title: "Устойчивые изменения",
                  text: "Мы не закрываем дыры — мы строим системы. Наши программы создают долгосрочный эффект, который живёт и после нас.",
                },
                {
                  icon: "Users",
                  title: "Сила сообщества",
                  text: "Объединяя людей с разным опытом и взглядами, мы создаём среду взаимной поддержки и коллективного действия.",
                },
              ].map(({ icon, title, text }) => (
                <div key={title} className="group border border-cream/15 p-8 hover:border-gold/50 transition-all duration-300 hover:bg-cream/5">
                  <div className="w-12 h-12 rounded-full border border-gold/40 flex items-center justify-center mb-6 group-hover:border-gold transition-colors duration-300">
                    <Icon name={icon as "Heart"} size={20} className="text-gold" />
                  </div>
                  <h3 className="font-cormorant text-cream text-2xl font-semibold mb-4">{title}</h3>
                  <p className="text-cream/60 leading-relaxed text-sm">{text}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* КОМАНДА */}
      <section id="команда" className="py-32 bg-cream-dark">
        <div className="max-w-7xl mx-auto px-6">
          <Section>
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-8 bg-gold" />
                <span className="text-gold text-xs tracking-[0.2em] uppercase font-golos">Команда</span>
              </div>
              <h2 className="font-cormorant text-ink text-5xl md:text-6xl font-light">
                Люди, которые<br/><em className="text-forest font-semibold not-italic">делают добро</em>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member, i) => (
                <div
                  key={member.name}
                  className="group bg-cream p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="w-20 h-20 rounded-full bg-forest/10 flex items-center justify-center text-4xl mb-6">
                    {member.emoji}
                  </div>
                  <h3 className="font-cormorant text-ink text-xl font-semibold mb-1">{member.name}</h3>
                  <p className="text-muted-foreground text-sm">{member.role}</p>
                  <div className="mt-4 h-px bg-gold/30 group-hover:bg-gold transition-colors duration-300" />
                </div>
              ))}
            </div>

            <div className="mt-16 relative overflow-hidden h-72 md:h-96">
              <img src={TEAM_IMG} alt="Наша команда" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-transparent" />
              <div className="absolute bottom-8 left-8 text-cream">
                <div className="font-cormorant text-3xl font-semibold">320+ волонтёров</div>
                <div className="text-cream/70 text-sm mt-1">по всей России</div>
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* ПОДДЕРЖКА */}
      <section id="поддержка" className="py-32 bg-cream relative overflow-hidden">
        <div className="absolute right-0 top-0 font-cormorant text-[20rem] font-bold text-forest/4 leading-none select-none pointer-events-none">
          ♡
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <Section>
            <div className="grid lg:grid-cols-2 gap-20 items-start">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-8 bg-gold" />
                  <span className="text-gold text-xs tracking-[0.2em] uppercase font-golos">Поддержка</span>
                </div>
                <h2 className="font-cormorant text-ink text-5xl md:text-6xl font-light leading-tight mb-8">
                  Ваш вклад<br/><em className="text-forest font-semibold not-italic">меняет жизни</em>
                </h2>
                <p className="text-foreground/65 leading-relaxed mb-10">
                  95% всех поступивших средств направляются непосредственно на программы помощи. Мы публикуем полные отчёты каждый квартал.
                </p>

                <div className="space-y-4">
                  {[
                    { amount: "500 ₽", impact: "обеспечит школьные принадлежности для одного ребёнка" },
                    { amount: "1 000 ₽", impact: "поддержит месяц занятий в кружке творчества" },
                    { amount: "5 000 ₽", impact: "даст возможность пройти курс переобучения" },
                  ].map(({ amount, impact }) => (
                    <div key={amount} className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <Icon name="Check" size={12} className="text-gold" />
                      </div>
                      <div>
                        <span className="font-golos font-semibold text-forest">{amount}</span>
                        <span className="text-foreground/60 text-sm"> — {impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-forest p-10 shadow-2xl">
                {submitted ? (
                  <div className="text-center py-10">
                    <div className="text-5xl mb-4">🌿</div>
                    <h3 className="font-cormorant text-cream text-3xl font-semibold mb-2">Спасибо!</h3>
                    <p className="text-cream/70">Ваша поддержка имеет значение. Мы свяжемся с вами по email.</p>
                  </div>
                ) : (
                  <form onSubmit={handleDonate} className="space-y-6">
                    <h3 className="font-cormorant text-cream text-3xl font-semibold">Сделать пожертвование</h3>

                    <div>
                      <label className="text-cream/60 text-xs uppercase tracking-wider mb-3 block">Сумма пожертвования</label>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {donationAmounts.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => { setDonationAmount(amount); setCustomAmount(""); }}
                            className={`py-3 text-sm font-semibold transition-all duration-200 ${
                              donationAmount === amount && !customAmount
                                ? "bg-gold text-forest"
                                : "border border-cream/20 text-cream hover:border-gold/50"
                            }`}
                          >
                            {amount.toLocaleString()} ₽
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        placeholder="Своя сумма (₽)"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full bg-cream/10 border border-cream/20 text-cream placeholder-cream/30 px-4 py-3 focus:outline-none focus:border-gold/60 text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsRecurring(!isRecurring)}
                        className={`w-10 h-6 rounded-full transition-all duration-300 flex items-center px-1 ${
                          isRecurring ? "bg-gold" : "bg-cream/20"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-cream transition-transform duration-300 ${isRecurring ? "translate-x-4" : ""}`} />
                      </button>
                      <span className="text-cream/70 text-sm">Ежемесячное пожертвование</span>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Ваше имя"
                        value={donationName}
                        onChange={(e) => setDonationName(e.target.value)}
                        className="w-full bg-cream/10 border border-cream/20 text-cream placeholder-cream/30 px-4 py-3 focus:outline-none focus:border-gold/60 text-sm"
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email для квитанции"
                        value={donationEmail}
                        onChange={(e) => setDonationEmail(e.target.value)}
                        className="w-full bg-cream/10 border border-cream/20 text-cream placeholder-cream/30 px-4 py-3 focus:outline-none focus:border-gold/60 text-sm"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gold text-forest py-4 font-golos font-semibold text-sm tracking-wide uppercase hover:bg-gold-light transition-all duration-300 hover:scale-[1.02]"
                    >
                      Пожертвовать {finalAmount ? `${finalAmount.toLocaleString()} ₽` : ""}
                      {isRecurring ? " / мес" : ""}
                    </button>

                    <p className="text-cream/40 text-xs text-center leading-relaxed">
                      Нажимая кнопку, вы соглашаетесь с условиями пожертвования.<br/>
                      Ваши данные в безопасности.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* БЛОГ */}
      <section id="блог" className="py-32 bg-cream-dark">
        <div className="max-w-7xl mx-auto px-6">
          <Section>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-8 bg-gold" />
                  <span className="text-gold text-xs tracking-[0.2em] uppercase font-golos">Блог</span>
                </div>
                <h2 className="font-cormorant text-ink text-5xl md:text-6xl font-light">
                  Истории и<br/><em className="text-forest font-semibold not-italic">новости</em>
                </h2>
              </div>
              <button className="link-hover text-forest font-golos text-sm uppercase tracking-wider self-start md:self-auto">
                Все публикации →
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {blogPosts.map((post, i) => (
                <article
                  key={post.title}
                  className="group bg-cream cursor-pointer hover:shadow-lg transition-all duration-300"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="h-1 bg-gradient-to-r from-gold to-gold/30 group-hover:from-forest group-hover:to-forest/30 transition-all duration-300" />
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-xs bg-forest/10 text-forest px-3 py-1 font-golos tracking-wide">{post.category}</span>
                      <span className="text-muted-foreground text-xs">{post.date}</span>
                    </div>
                    <h3 className="font-cormorant text-ink text-2xl font-semibold leading-tight mb-4 group-hover:text-forest transition-colors duration-200">
                      {post.title}
                    </h3>
                    <p className="text-foreground/60 text-sm leading-relaxed">{post.excerpt}</p>
                    <div className="mt-6 flex items-center gap-2 text-gold text-sm font-semibold">
                      Читать <Icon name="ArrowRight" size={14} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* КОНТАКТЫ */}
      <section id="контакты" className="py-32 bg-forest">
        <div className="max-w-7xl mx-auto px-6">
          <Section>
            <div className="grid lg:grid-cols-2 gap-20">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-8 bg-gold/50" />
                  <span className="text-gold text-xs tracking-[0.2em] uppercase font-golos">Контакты</span>
                </div>
                <h2 className="font-cormorant text-cream text-5xl md:text-6xl font-light leading-tight mb-8">
                  Давайте<br/><em className="text-gold not-italic font-semibold">поговорим</em>
                </h2>
                <p className="text-cream/60 leading-relaxed mb-10">
                  Мы открыты для партнёрства, волонтёрства и любых вопросов. Ответим в течение рабочего дня.
                </p>

                <div className="space-y-6">
                  {[
                    { icon: "MapPin", label: "Адрес", value: "Москва, ул. Садовая, 12, офис 304" },
                    { icon: "Phone", label: "Телефон", value: "+7 (495) 000-00-00" },
                    { icon: "Mail", label: "Email", value: "hello@dobro-nko.ru" },
                    { icon: "Clock", label: "Часы работы", value: "Пн–Пт, 10:00 – 18:00" },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full border border-cream/20 flex items-center justify-center flex-shrink-0">
                        <Icon name={icon as "MapPin"} size={16} className="text-gold" />
                      </div>
                      <div>
                        <div className="text-cream/40 text-xs uppercase tracking-wider mb-1">{label}</div>
                        <div className="text-cream text-sm">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Имя"
                    className="bg-cream/10 border border-cream/20 text-cream placeholder-cream/30 px-4 py-3 focus:outline-none focus:border-gold/60 text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="bg-cream/10 border border-cream/20 text-cream placeholder-cream/30 px-4 py-3 focus:outline-none focus:border-gold/60 text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Тема обращения"
                  className="w-full bg-cream/10 border border-cream/20 text-cream placeholder-cream/30 px-4 py-3 focus:outline-none focus:border-gold/60 text-sm"
                />
                <textarea
                  placeholder="Ваше сообщение..."
                  rows={5}
                  className="w-full bg-cream/10 border border-cream/20 text-cream placeholder-cream/30 px-4 py-3 focus:outline-none focus:border-gold/60 text-sm resize-none"
                />
                <button
                  type="submit"
                  className="w-full bg-gold text-forest py-4 font-golos font-semibold text-sm tracking-wide uppercase hover:bg-gold-light transition-all duration-300"
                >
                  Отправить сообщение
                </button>
              </form>
            </div>
          </Section>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-ink py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-forest font-cormorant font-bold text-lg">
                Д
              </div>
              <span className="font-cormorant text-cream text-xl font-semibold tracking-wide">Добро</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => scrollTo(item.replace(" ", "-"))}
                  className="nav-link text-xs"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              {["Share2", "Send", "Instagram"].map((s) => (
                <button
                  key={s}
                  className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center text-cream/50 hover:border-gold hover:text-gold transition-all duration-200"
                >
                  <Icon name={s as "Send"} size={14} />
                </button>
              ))}
            </div>
          </div>
          <div className="deco-line mt-8 mb-6" />
          <p className="text-center text-cream/30 text-xs">
            © 2026 НКО «Добро». Все права защищены. Организация работает на благо общества.
          </p>
        </div>
      </footer>
    </div>
  );
}
