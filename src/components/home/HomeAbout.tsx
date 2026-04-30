import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const VK_URL = "https://vk.com/spasenienadezhdi";

const teamMembers = [
  { name: "Сайфуллин Василий Валерьевич", role: "Учредитель", initial: "С", emoji: "🌿", photo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/d5b098f1-b52e-4625-82c1-06bd3c4b4aec.jpg" },
  { name: "Чуйкин Дмитрий Юрьевич", role: "Генеральный директор", initial: "Д", emoji: "🤝" },
  { name: "Хайдарова Назира", role: "Заместитель директора по социальной работе", initial: "Н", emoji: "💚" },
  { name: "Тузкова Евгения Юрьевна", role: "Психолог", initial: "Е", emoji: "🌱" },
  { name: "Мартынова Анастасия Георгиевна", role: "Социальный педагог", initial: "А", emoji: "📚" },
  { name: "Зимина Надежда Васильевна", role: "Руководитель отдела фандрайзинга", initial: "Н", emoji: "🌿" },
  { name: "Мамаев Рамазан Агитович", role: "Специалист по работе с химической зависимостью", initial: "Р", emoji: "🤝" },
  { name: "Домнин Дмитрий Михайлович", role: "Специалист по работе с химической зависимостью", initial: "Д", emoji: "🤝" },
  { name: "Скородумова Софья Константиновна", role: "Специалист по работе с химической зависимостью", initial: "С", emoji: "🤝" },

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

export default function HomeAbout() {
  return (
    <>
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
                  <div className="w-28 h-28 rounded-full bg-sage-pale flex items-center justify-center text-3xl mb-5 overflow-hidden">
                    {m.photo
                      ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-125" />
                      : m.emoji}
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
    </>
  );
}