import { useState } from "react";
import SiteNav from "@/components/shared/SiteNav";

type CaseItem = {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  lead: string;
  sections: { heading: string; text: string }[];
  children: { name: string; age: string; photo: string; text: string }[];
  conclusion: string;
  results: string[];
  // кейс 1
  resultLine?: string;
  momProgress?: string[];
  activity?: string[];
  plpText?: string;
  // кейс 2
  highlights?: string[];
  nowText?: string;
};

const CASES: CaseItem[] = [
  {
    id: 1,
    tag: "Кейс",
    title: "Светлана Л.",
    subtitle: "«Вопреки приговору системы»",
    lead: "Как вернуть пятерых детей, когда надежды не осталось",
    sections: [
      {
        heading: "Было: точка невозврата",
        text: `Для многодетной матери жизненный кризис привёл к закономерному итогу: комиссией было зафиксировано социально опасное положение (СОП), и в целях безопасности все пятеро детей были помещены в социальный приют.

Светлана поступила в кризисный центр «Спасение Надежды» на третий день после этих событий — в тяжелейшем психоэмоциональном состоянии, когда риск полной десоциализации и лишения родительских прав был максимальным.`,
      },
      {
        heading: "Что изменилось",
        text: `Вместо пассивного принятия ситуации началась системная работа. Стратегия центра строилась не на противостоянии решению органов опеки, а на устранении причин, повлёкших изъятие. Светлана была немедленно включена в интенсивную терапевтическую программу и взяла на себя обязательства по ведению быта в центре.

Ключевым фактором успеха стал открытый диалог с Комиссией по делам несовершеннолетних (КДН). В течение трёх месяцев специалисты центра сопровождали Светлану на заседаниях, предоставляя объективные данные о динамике её реабилитации: устойчивую трезвость, психологическую стабилизацию и готовность матери взять ответственность за жизнь детей.

Убедившись в позитивных изменениях и наличии гарантий безопасности со стороны центра, КДН приняла прецедентное решение — досрочно вернуть детей матери с условием их совместного проживания на территории кризисного центра под наблюдение специалистов.`,
      },
    ],
    resultLine: "Сегодня семья полностью воссоединена.",
    children: [
      {
        name: "Вадим",
        age: "10 лет",
        photo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/15035a50-8ce0-46ad-bc02-f8cc7fda2ab1.jpg",
        text: "После трёхмесячного пребывания в детском доме успешно адаптировался. Общителен, легко идёт на контакт. В учёбе показывает хорошие результаты, проявляет познавательную активность. Отличается добрым нравом, отзывчив, умеет сопереживать.",
      },
      {
        name: "Ксения",
        age: "14 лет",
        photo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/b0e13794-4941-404e-9e92-fe3a5d0a86f7.jpg",
        text: "Демонстрирует высокий уровень социализации: легко идёт на контакт, общительна, выстроила дружеские отношения со сверстниками в центре. Успешно учится, проявляет инициативу в учёбе и по хозяйству. Добрая, отзывчивая, ответственная.",
      },
      {
        name: "Милана",
        age: "5 лет",
        photo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/e4315620-a82d-4f38-8b6c-893e59dfeb3d.jpg",
        text: "В детском саду — активный участник всех мероприятий. Проявляет лидерские качества: умеет организовать сверстников, предложить интересную идею. Добрая, отзывчивая, помогает взрослым. Поведение стабильно положительное.",
      },
      {
        name: "Серёжа",
        age: "4 года",
        photo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/898be228-036f-442e-940f-a069a775501d.jpg",
        text: "Успешно адаптировался после дома малютки, где находился отдельно от братьев и сестёр. Сразу наладил тёплые отношения с родными. Любознательный, активный, отзывчивый. Очень тактильный, любит объятия. Посещает логопедическую группу.",
      },

    ],
    momProgress: [
      "Программа 12 шагов: прошла три шага (признание бессилия, осознание высшей силы, решение передать свою волю).",
      "Статус стажёра: присваивается резидентам, демонстрирующим личностный рост, дисциплину и лидерские качества.",
      "Снята с учёта КДН: юридическое признание того, что её семья больше не представляет угрозы для детей.",
    ],
    activity: [
      "Курирует новых подопечных в центре, помогает им адаптироваться",
      "Участвует в гуманитарных миссиях с Российским детским фондом",
      "Регулярно посещает детский дом г. Спасска с профилактическими беседами о последствиях зависимости",
    ],
    plpText:
      "Светлана готовится к плавному выходу из центра. ПЛП включает наставничество, группы поддержки выпускников, дистанционные консультации специалистов и помощь в интеграции в социум — чтобы результат закрепился и семья осталась на плаву.",
    conclusion: `При правильной профессиональной поддержке даже глубокий социальный разрыв преодолим. А бывший получатель помощи способен стать надёжным партнёром государства в вопросах профилактики социального сиротства.

История Светланы — это не про чудо. Это про системную работу, экстренное вмешательство, поэтапную реабилитацию и веру в то, что семью можно сохранить.`,
    results: [
      "Семья воссоединена.",
      "Дети — с мамой.",
      "Учёт в КДН закрыт.",
      "Светлана сама теперь помогает другим.",
    ],
  },
  {
    id: 2,
    tag: "Кейс",
    title: "Наталья Б.",
    subtitle: "«От жилищного кризиса к внутренней устойчивости»",
    lead: "Как перестройка ценностей помогла принять зависимость и выйти на самостоятельную жизнь",
    sections: [
      {
        heading: "Было",
        text: `Наталья обратилась в кризисный центр «Спасение Надежды» в связи с отсутствием жилищных условий и проблемами, связанными с употреблением. Жизненная ситуация была близка к критической: ни жилья, ни устойчивого внутреннего стержня.

На момент поступления проблема зависимости не стояла в центре как основная — на первый план выходила социальная неустроенность. Но без работы над глубинными причинами решить бытовые вопросы было бы невозможно.`,
      },
      {
        heading: "Что изменилось",
        text: `В ходе прохождения программы реабилитации Наталья продемонстрировала высокую вовлечённость в процесс, проявила ответственность как мать и приложила значительные усилия для изменения жизненной ситуации.

Ключевой результат — не просто нормализация жилищных условий. Важнее то, что произошло внутри:`,
      },
    ],
    highlights: [
      "Перестройка ценностно-смысловых ориентиров. Наталья пришла к глубокому принятию своей зависимости — неформальному, не через «так надо», а через внутреннее осознание.",
      "Начала работать с зависимостью не потому, что «так положено», а потому что это стало её собственным выбором.",
      "Жилищные условия семьи нормализованы. Восстановлено то, с чего начинался запрос, — но теперь есть на чём держаться дальше.",
    ],
    nowText: `Наталья чувствует себя достаточно уверенно. Планируется в ближайшее время переход на этап ресоциализации (постадаптационный период). Есть внутренняя целостность и уверенность.

Оснований для продления пребывания в центре не выявлено — она готова к самостоятельной жизни.`,
    children: [
      {
        name: "Даниил",
        age: "1,5 месяца",
        photo: "",
        text: "Развитие соответствует возрастным нормам. Эмоциональное состояние стабильное, отмечается положительная динамика в общем развитии. Ребёнок проявляет активность, любознательность, демонстрирует навыки социального взаимодействия. Планируется зачисление в дошкольное учреждение в установленные сроки.",
      },
    ],
    conclusion: `Кейс Натальи — пример того, как реабилитация может начинаться с одного запроса (жильё, соцусловия), а приходить к совершенно другому, более глубинному результату: принятию зависимости, перестройке ценностей и внутренней устойчивости.

В добрый путь, Наталья!`,
    results: [
      "Жильё восстановлено.",
      "Зависимость принята.",
      "Ценности перестроены.",
      "Готова к самостоятельной жизни.",
    ],
  },
];

export default function OurFamilies() {
  const [activeId, setActiveId] = useState(1);
  const c = CASES.find(x => x.id === activeId)!;
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-beige-mid font-golos">
      <SiteNav />

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt=""
            className="max-w-full max-h-full rounded-sm shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-5 text-white/80 hover:text-white text-3xl leading-none"
          >
            ×
          </button>
        </div>
      )}

      <div className="pt-28 pb-24 max-w-4xl mx-auto px-6">
        {/* PAGE HEADER */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-sage" />
            <span className="text-sage text-xs tracking-[0.2em] uppercase font-golos">Наши семьи</span>
          </div>
          <h1 className="font-cormorant text-ink text-5xl md:text-6xl font-semibold leading-tight">
            Истории, которые<br className="hidden md:block" /> меняют жизнь
          </h1>
        </div>

        {/* CASE TABS */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {CASES.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveId(item.id)}
              className={`px-5 py-2.5 rounded-sm text-sm font-golos transition-colors ${
                activeId === item.id
                  ? "bg-sage text-white"
                  : "bg-white text-ink/70 hover:bg-beige-dark border border-beige-dark"
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

        {/* CASE CARD */}
        <article className="bg-white rounded-sm shadow-sm overflow-hidden">
          {/* FAMILY PHOTO */}
          {activeId === 1 && (
            <div
              className="w-full h-64 md:h-80 overflow-hidden border-b border-beige-dark cursor-zoom-in"
              onClick={() => setLightbox("https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/31f9813f-2685-4968-be68-856b3e8f9c09.jpg")}
            >
              <img
                src="https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/31f9813f-2685-4968-be68-856b3e8f9c09.jpg"
                alt="Семья"
                className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          <div className="p-8 md:p-12">
            {/* CASE TAG + TITLE */}
            <div className="mb-8">
              <span className="inline-block text-sage text-xs tracking-[0.2em] uppercase font-golos mb-3">
                {c.tag}
              </span>
              <h2 className="font-cormorant text-ink text-4xl font-semibold leading-tight mb-2">
                {c.title}
              </h2>
              <p className="font-cormorant text-ink/70 text-2xl italic">{c.subtitle}</p>
            </div>

            {/* LEAD */}
            <div className="border-l-2 border-sage pl-6 mb-10">
              <p className="font-cormorant text-ink text-xl italic leading-relaxed">{c.lead}</p>
            </div>

            {/* MAIN SECTIONS */}
            {c.sections.map((s, i) => (
              <div key={i} className="mb-10">
                <h3 className="font-cormorant text-ink text-2xl font-semibold mb-4">{s.heading}</h3>
                {s.text.split("\n\n").map((p, j) => (
                  <p key={j} className="text-ink/80 leading-relaxed mb-4 last:mb-0">{p}</p>
                ))}
              </div>
            ))}

            {/* RESULT LINE (кейс 1) */}
            {c.resultLine && (
              <div className="bg-sage/10 border border-sage/30 rounded-sm px-6 py-4 mb-12">
                <p className="font-cormorant text-ink text-xl font-semibold">{c.resultLine}</p>
              </div>
            )}

            {/* HIGHLIGHTS (кейс 2) */}
            {c.highlights && (
              <div className="mb-10">
                <ul className="space-y-4">
                  {c.highlights.map((item, i) => (
                    <li key={i} className="flex gap-3 items-start bg-sage/5 border border-sage/20 rounded-sm px-5 py-4">
                      <span className="mt-1 text-sage text-lg leading-none">🔹</span>
                      <span className="text-ink/80 leading-relaxed text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* NOW (кейс 2) */}
            {c.nowText && (
              <div className="mb-12">
                <h3 className="font-cormorant text-ink text-2xl font-semibold mb-4">Сейчас</h3>
                {c.nowText.split("\n\n").map((p, i) => (
                  <p key={i} className="text-ink/80 leading-relaxed mb-4 last:mb-0">{p}</p>
                ))}
              </div>
            )}

            {/* CHILDREN */}
            <div className="mb-12">
              <h3 className="font-cormorant text-ink text-2xl font-semibold mb-6">
                {c.id === 1 ? "Как изменились дети" : "Ребёнок"}
              </h3>
              <div className="space-y-6">
                {c.children.map((ch, i) => (
                  <div key={i} className="flex gap-5 items-start">
                    <div
                      className={`flex-shrink-0 w-20 h-20 rounded-xl bg-beige-dark overflow-hidden shadow-sm transition-opacity ${ch.photo ? "cursor-pointer hover:opacity-90" : ""}`}
                      onClick={() => ch.photo && setLightbox(ch.photo)}
                    >
                      {ch.photo ? (
                        <img src={ch.photo} alt={ch.name} className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-cormorant text-ink font-semibold text-xl">
                          {ch.name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-ink mb-1">
                        {ch.name}
                        {ch.age && <span className="text-ink/50 font-normal ml-2 text-sm">({ch.age})</span>}
                      </div>
                      <p className="text-ink/70 leading-relaxed text-sm">{ch.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MOM PROGRESS (кейс 1) */}
            {c.momProgress && (
              <div className="mb-10">
                <h3 className="font-cormorant text-ink text-2xl font-semibold mb-5">Как изменилась сама Светлана</h3>
                <ul className="space-y-3">
                  {c.momProgress.map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" />
                      <span className="text-ink/80 leading-relaxed text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ACTIVITY (кейс 1) */}
            {c.activity && (
              <div className="mb-10">
                <h4 className="text-ink text-base font-semibold uppercase tracking-wide mb-4">
                  Общественная деятельность сегодня
                </h4>
                <ul className="space-y-3">
                  {c.activity.map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" />
                      <span className="text-ink/80 leading-relaxed text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* PLP (кейс 1) */}
            {c.plpText && (
              <div className="mb-12">
                <h4 className="text-ink text-base font-semibold uppercase tracking-wide mb-3">
                  Планы на постлечебную программу (ПЛП)
                </h4>
                <p className="text-ink/70 leading-relaxed text-sm">{c.plpText}</p>
              </div>
            )}

            {/* CONCLUSION */}
            <div className="border-t border-beige-dark pt-10 mb-8">
              <h3 className="font-cormorant text-ink text-2xl font-semibold mb-5">Вывод</h3>
              {c.conclusion.split("\n\n").map((p, i) => (
                <p key={i} className="text-ink/80 leading-relaxed mb-4 last:mb-0">{p}</p>
              ))}
            </div>

            {/* RESULTS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {c.results.map((r, i) => (
                <div key={i} className="bg-sage/10 rounded-sm px-4 py-4 text-center">
                  <p className="font-cormorant text-ink text-base font-semibold leading-tight">{r}</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}