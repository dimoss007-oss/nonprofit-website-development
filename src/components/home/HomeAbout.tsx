import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

function PhotoPopup({ photo, name, onClose }: { photo: string; name: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Фото — ${name}`}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-xs w-full mx-4" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Закрыть фото"
          className="absolute top-3 right-3 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          <Icon name="X" size={16} aria-hidden="true" />
        </button>
        <img src={photo} alt={name} className="w-full object-cover object-top max-h-96" />
        <div className="px-5 py-4">
          <p className="font-cormorant text-ink text-lg font-semibold">{name}</p>
        </div>
      </div>
    </div>
  );
}

const VK_URL = "https://vk.com/spasenienadezhdi";

const teamMembers: { name: string; role: string; initial: string; emoji: string; photo?: string; photoPosition?: string }[] = [
  { name: "Сайфуллин Василий Валерьевич", role: "Учредитель", initial: "С", emoji: "🌿", photo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/d5b098f1-b52e-4625-82c1-06bd3c4b4aec.jpg" },
  { name: "Чуйкин Дмитрий Юрьевич", role: "Генеральный директор", initial: "Д", emoji: "🤝", photo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/39b68d23-4d9f-4c15-ab4e-5467b30f8c13.jpg" },
  { name: "Хайдарова Назира", role: "Заместитель директора по социальной работе", initial: "Н", emoji: "💚", photo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/66588711-1ffc-4150-b3a7-6d0828539d2e.jpg", photoPosition: "right center" },
  { name: "Тузкова Евгения Юрьевна", role: "Психолог", initial: "Е", emoji: "🌱", photo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/d95c831d-3e47-4cb7-a03b-46604f99c161.jpg", photoPosition: "center top" },
  { name: "Мартынова Анастасия Георгиевна", role: "Социальный педагог", initial: "А", emoji: "📚", photo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/a331dbf5-10a1-4ef0-8713-16689d0bbd3f.jpg", photoPosition: "80% 80%" },
  { name: "Зимина Надежда Васильевна", role: "Руководитель отдела фандрайзинга", initial: "Н", emoji: "🌿", photo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/8fe39684-99c3-41d8-9bea-ba9448855b19.jpg", photoPosition: "center top" },
  { name: "Мамаев Рамазан Агитович", role: "Специалист по работе с химической зависимостью", initial: "Р", emoji: "🤝", photo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/ef769298-a7b4-4c09-a9a3-e073a3c8391b.jpg", photoPosition: "right center" },
  { name: "Домнин Дмитрий Михайлович", role: "Специалист по работе с химической зависимостью", initial: "Д", emoji: "🤝", photo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/efe31d79-556e-4670-9de0-bd70c23353d5.jpg", photoPosition: "center top" },
  { name: "Скородумова Софья Константиновна", role: "Специалист по работе с химической зависимостью", initial: "С", emoji: "🤝", photo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/167c928a-d9cb-4a55-922c-30575c48fa09.jpg", photoPosition: "center 30%" },

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
  const [popup, setPopup] = useState<{ photo: string; name: string } | null>(null);

  return (
    <>
      {popup && <PhotoPopup photo={popup.photo} name={popup.name} onClose={() => setPopup(null)} />}
      {/* О НАС — скрыто временно */}

      {/* МИССИЯ */}
      <section id="missiya" className="py-28 bg-sage relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" aria-hidden="true">
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
                <div key={title} className="bg-white/10 border border-beige/20 p-7 rounded-2xl hover:bg-white/15 transition-colors duration-300 group">
                  <div className="w-11 h-11 rounded-full border border-beige/30 flex items-center justify-center mb-5 group-hover:border-beige/60 transition-colors" aria-hidden="true">
                    <Icon name={icon as "Heart"} size={20} className="text-beige/80" aria-hidden="true" />
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {teamMembers.map((m) => (
                <article key={m.name} className="group bg-white rounded-2xl p-7 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  {m.photo ? (
                    <button
                      className="w-28 h-28 rounded-full bg-sage-pale flex items-center justify-center text-3xl mb-5 overflow-hidden cursor-pointer"
                      onClick={() => setPopup({ photo: m.photo!, name: m.name })}
                      aria-label={`Увеличить фото — ${m.name}`}
                    >
                      <img src={m.photo} alt={m.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-125" style={{ objectPosition: m.photoPosition || 'center' }} />
                    </button>
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-sage-pale flex items-center justify-center text-3xl mb-5 overflow-hidden" aria-hidden="true">
                      {m.emoji}
                    </div>
                  )}
                  <h3 className="font-cormorant text-ink text-xl font-semibold mb-1">{m.name}</h3>
                  <p className="text-muted-foreground text-sm">{m.role}</p>
                  <div className="mt-4 h-px bg-sage/20 group-hover:bg-sage/50 transition-colors duration-300" aria-hidden="true" />
                </article>
              ))}
            </div>

            <div className="mt-10 bg-sage-pale/60 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="font-cormorant text-ink text-2xl font-semibold mb-1">Хочешь стать волонтёром?</div>
                <p className="text-muted-foreground text-sm">Мы всегда рады новым людям, готовым помогать.</p>
              </div>
              <a
                href={VK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3 bg-sage text-beige text-sm font-golos font-semibold uppercase tracking-wide rounded-xl hover:bg-sage-dark transition-colors whitespace-nowrap flex items-center gap-2"
              >
                Написать нам <Icon name="ExternalLink" size={13} aria-hidden="true" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}