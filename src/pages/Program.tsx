import Icon from "@/components/ui/icon";

const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";

const directions = [
  {
    icon: "Brain",
    title: "Социально-психологическая",
    text: "Развитие навыков общения, укрепление психоэмоционального состояния. Психодиагностика, психологическая коррекция и поддержка ребёнка и семьи, консультирование.",
  },
  {
    icon: "Globe",
    title: "Социально-средовая",
    text: "Формирование доступной среды, адаптация ребёнка к физическому и социальному окружению.",
  },
  {
    icon: "Home",
    title: "Социально-бытовая",
    text: "Помощь в освоении навыков самообслуживания. Личная гигиена, самоорганизация, работа с техникой, самостоятельное передвижение.",
  },
  {
    icon: "GraduationCap",
    title: "Социально-педагогическая",
    text: "Приспособление ребёнка к условиям социальной среды с помощью педагогических средств и методов.",
  },
];

const tasks = [
  "Комплексная диагностика развития ребёнка и семейного окружения",
  "Разработка индивидуальных планов реабилитации",
  "Организация коррекционно-развивающей работы",
  "Повышение психолого-педагогической компетентности родителей",
  "Сопровождение семьи на всех этапах реабилитации",
];

const workAreas = [
  {
    num: "01",
    title: "Диагностическое",
    items: ["Первичная оценка развития ребёнка", "Анализ семейного микроклимата", "Выявление потребностей семьи"],
  },
  {
    num: "02",
    title: "Коррекционно-развивающее",
    items: ["Индивидуальные занятия с ребёнком", "Групповые занятия с участием родителей", "Развитие коммуникативных навыков", "Формирование социально-бытовых умений"],
  },
  {
    num: "03",
    title: "Психолого-педагогическое",
    items: ["Обучение родителей коррекционным методикам", "Консультирование по вопросам воспитания", "Тренинги детско-родительского взаимодействия"],
  },
  {
    num: "04",
    title: "Сопровождающее",
    items: ["Дистанционное консультирование", "Мониторинг результатов", "Корректировка программы"],
  },
];

const lessonStructure = [
  "Ритуал приветствия",
  "Сенсорно-интеллектуальная деятельность",
  "Двигательные упражнения",
  "Развитие мелкой моторики",
  "Творческие задания",
];

const results = [
  { icon: "HeartHandshake", text: "Улучшение психоэмоционального состояния ребёнка" },
  { icon: "MessageCircle", text: "Развитие коммуникативных навыков" },
  { icon: "Users", text: "Повышение компетентности родителей" },
  { icon: "Heart", text: "Укрепление семейных отношений" },
  { icon: "UserCheck", text: "Социальная адаптация ребёнка" },
];

const specialists = [
  { icon: "Brain", title: "Психолог" },
  { icon: "MessageSquare", title: "Логопед" },
  { icon: "HandHeart", title: "Социальный работник" },
  { icon: "BookOpen", title: "Педагог-дефектолог" },
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
            <span className="text-sage text-xs tracking-[0.2em] uppercase">Для семей с детьми</span>
          </div>
          <h1 className="font-cormorant text-ink text-5xl md:text-6xl font-light leading-tight mb-6">
            Программа <span className="text-sage font-semibold">социальной реабилитации</span> детей совместно с родителями
          </h1>
          <p className="text-foreground/65 text-lg leading-relaxed max-w-2xl">
            Процесс, направленный на восстановление функций организма ребёнка, социальную адаптацию и интеграцию в общество.
          </p>
        </div>

        {/* ЦЕЛЬ */}
        <div className="bg-sage text-white rounded-sm p-8 md:p-10 mb-12">
          <div className="text-xs uppercase tracking-[0.2em] opacity-70 mb-3">Цель программы</div>
          <p className="text-xl md:text-2xl font-cormorant font-light leading-relaxed">
            Содействие оптимальному развитию и формированию психического здоровья детей, укрепление детско-родительских отношений и повышение компетентности родителей в вопросах воспитания и развития.
          </p>
        </div>

        {/* ЗАДАЧИ */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-sage" />
            <h2 className="font-cormorant text-ink text-3xl font-semibold">Задачи программы</h2>
          </div>
          <div className="space-y-3">
            {tasks.map((task, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-sm px-6 py-4">
                <span className="text-sage font-cormorant text-xl font-semibold mt-0.5 w-6 flex-shrink-0">{i + 1}</span>
                <p className="text-foreground/75 leading-relaxed">{task}</p>
              </div>
            ))}
          </div>
        </div>

        {/* НАПРАВЛЕНИЯ РЕАБИЛИТАЦИИ */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-sage" />
            <h2 className="font-cormorant text-ink text-3xl font-semibold">Направления реабилитации</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {directions.map((d, i) => (
              <div key={i} className="bg-white rounded-sm p-7">
                <div className="w-10 h-10 bg-sage/10 rounded-sm flex items-center justify-center mb-4">
                  <Icon name={d.icon as "Brain"} size={20} className="text-sage" />
                </div>
                <h3 className="font-cormorant text-ink text-xl font-semibold mb-3">{d.title}</h3>
                <p className="text-foreground/65 text-sm leading-relaxed">{d.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* НАПРАВЛЕНИЯ РАБОТЫ */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-sage" />
            <h2 className="font-cormorant text-ink text-3xl font-semibold">Направления работы</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {workAreas.map((area) => (
              <div key={area.num} className="bg-white rounded-sm p-7">
                <div className="font-cormorant text-sage text-4xl font-bold opacity-30 mb-3">{area.num}</div>
                <h3 className="font-cormorant text-ink text-xl font-semibold mb-4">{area.title}</h3>
                <ul className="space-y-2">
                  {area.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground/65 text-sm">
                      <div className="w-1 h-1 rounded-full bg-sage mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ЗАНЯТИЯ */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-sage" />
            <h2 className="font-cormorant text-ink text-3xl font-semibold">Как проходят занятия</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-6">
            <div className="bg-white rounded-sm p-6 text-center">
              <div className="font-cormorant text-sage text-5xl font-bold mb-2">45</div>
              <div className="text-xs uppercase tracking-widest text-ink/50">минут</div>
              <div className="text-foreground/60 text-sm mt-2">длительность занятия</div>
            </div>
            <div className="bg-white rounded-sm p-6 text-center">
              <div className="font-cormorant text-sage text-5xl font-bold mb-2">2</div>
              <div className="text-xs uppercase tracking-widest text-ink/50">раза в неделю</div>
              <div className="text-foreground/60 text-sm mt-2">периодичность</div>
            </div>
            <div className="bg-white rounded-sm p-6 text-center">
              <Icon name="Users" size={40} className="text-sage mx-auto mb-2" />
              <div className="text-xs uppercase tracking-widest text-ink/50">формат</div>
              <div className="text-foreground/60 text-sm mt-2">индивидуальные и групповые</div>
            </div>
          </div>
          <div className="bg-white rounded-sm p-7">
            <h3 className="font-cormorant text-ink text-xl font-semibold mb-5">Структура занятия</h3>
            <div className="flex flex-wrap gap-3">
              {lessonStructure.map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-beige-mid rounded-sm px-4 py-2">
                  <span className="text-sage text-xs font-semibold">{i + 1}</span>
                  <span className="text-foreground/70 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* РЕЗУЛЬТАТЫ */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-sage" />
            <h2 className="font-cormorant text-ink text-3xl font-semibold">Ожидаемые результаты</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r, i) => (
              <div key={i} className="bg-white rounded-sm p-6 flex items-start gap-4">
                <div className="w-9 h-9 bg-sage/10 rounded-sm flex items-center justify-center flex-shrink-0">
                  <Icon name={r.icon as "Heart"} size={18} className="text-sage" />
                </div>
                <p className="text-foreground/70 text-sm leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* КОМАНДА */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-sage" />
            <h2 className="font-cormorant text-ink text-3xl font-semibold">Наша команда</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {specialists.map((s, i) => (
              <div key={i} className="bg-white rounded-sm p-6 text-center">
                <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon name={s.icon as "Brain"} size={22} className="text-sage" />
                </div>
                <div className="font-cormorant text-ink text-lg font-semibold">{s.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-sm p-10 text-center">
          <h2 className="font-cormorant text-ink text-3xl font-semibold mb-4">Записаться на программу</h2>
          <p className="text-foreground/60 mb-8 max-w-md mx-auto">Свяжитесь с нами, чтобы узнать подробности и записать ребёнка на первичную диагностику</p>
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
