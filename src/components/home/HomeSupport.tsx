import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const VK_URL = "https://vk.com/spasenienadezhdi";
const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";
const donationAmounts = [300, 500, 1000, 3000];

const navItems = [
  { label: "главная", id: "glavnaya" },
  { label: "о нас", id: "o-nas" },
  { label: "миссия", id: "missiya" },
  { label: "команда", id: "komanda" },
  { label: "поддержка", id: "podderzhka" },
  { label: "контакты", id: "kontakty" },
];

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

interface Props {
  onScrollTo: (id: string) => void;
}

export default function HomeSupport({ onScrollTo }: Props) {
  const [donationAmount, setDonationAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const finalAmount = customAmount ? Number(customAmount) : donationAmount;

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <>
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
                    { icon: "Mail", label: "Email", value: "spasenienadezhdi@bk.ru", href: "mailto:spasenienadezhdi@bk.ru" },
                    { icon: "Phone", label: "Телефон", value: "8 800 300-86-85", href: "tel:88003008685" },
                    { icon: "Clock", label: "Часы работы", value: "Пн–Пт, 9:00 – 18:00 МСК", href: null },
                    { icon: "MapPin", label: "Адрес", value: "440011, г. Пенза, ул. 8 марта 17 Б", href: "https://yandex.ru/maps/?text=Пенза%2C+ул.+8+марта+17+Б" },
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
              <img src={LOGO_IMG} alt="Спасение надежды" className="w-12 h-12 object-contain" />
              <div>
                <div className="font-cormorant text-beige text-lg font-semibold">Спасение надежды</div>
                <div className="text-beige/40 text-[10px] uppercase tracking-wider">АНО</div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {navItems.map(({ label, id }) => (
                <button key={id} onClick={() => onScrollTo(id)} className="nav-link text-beige/50 hover:text-beige/90 text-xs">
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
          <div className="text-center text-beige/25 text-xs space-y-1 mb-3">
            <p>АНО «Спасение надежды» | ОГРН 1245800010114 | ИНН 5800011843 | КПП 580001001</p>
            <p>Юридический адрес: г. Пенза, ул. 8 марта 17Б</p>
          </div>
          <p className="text-center text-beige/25 text-xs">
            © 2026 АНО «Спасение надежды». Все права защищены.
          </p>
        </div>
      </footer>
    </>
  );
}