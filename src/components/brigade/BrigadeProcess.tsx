import Icon from "@/components/ui/icon";

const STEPS = [
  { icon: "PhoneIncoming", title: "Получаем обращение", text: "Семья или специалист сообщают о ситуации" },
  { icon: "Route", title: "Организуем выезд", text: "Планируем маршрут и состав бригады" },
  { icon: "ClipboardList", title: "Оцениваем потребности", text: "Беседуем с семьёй и определяем, что нужно" },
  { icon: "PackageCheck", title: "Оказываем поддержку", text: "Помогаем продуктами, консультацией, вещами" },
  { icon: "RefreshCw", title: "Продолжаем сопровождение", text: "Остаёмся на связи и возвращаемся при необходимости" },
];

export default function BrigadeProcess() {
  return (
    <section className="py-14 px-5 bg-white" aria-labelledby="brigade-process-title">
      <div className="max-w-6xl mx-auto">
        <h2 id="brigade-process-title" className="font-golos text-2xl sm:text-3xl font-bold text-navy text-center mb-10">Как работает бригада</h2>
        <ol className="grid gap-4 md:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative bg-mist rounded-xl p-5 border border-azure/10">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-azure text-white text-sm font-bold flex items-center justify-center" aria-hidden="true">{i + 1}</span>
                <Icon name={s.icon} size={22} className="text-teal-deep" />
              </div>
              <h3 className="font-golos font-semibold text-navy leading-snug">{s.title}</h3>
              <p className="text-sm text-navy/75 mt-1.5 leading-relaxed">{s.text}</p>
              {i < STEPS.length - 1 && (
                <Icon name="ChevronRight" size={20} className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 text-azure z-10 bg-white rounded-full" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
