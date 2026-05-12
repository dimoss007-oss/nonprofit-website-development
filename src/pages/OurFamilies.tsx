import SiteNav from "@/components/shared/SiteNav";

const CASES = [
  {
    id: 1,
    tag: "Кейс",
    title: "Светлана Л.",
    subtitle: "«Вопреки приговору системы»",
    lead: "Как вернуть пятерых детей, когда надежды не осталось",
    photos: [] as string[],
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
        text: "После трёхмесячного пребывания в детском доме успешно адаптировался. Общителен, легко идёт на контакт. В учёбе показывает хорошие результаты, проявляет познавательную активность. Отличается добрым нравом, отзывчив, умеет сопереживать.",
      },
      {
        name: "Ксения",
        age: "14 лет",
        text: "Демонстрирует высокий уровень социализации: легко идёт на контакт, общительна, выстроила дружеские отношения со сверстниками в центре. Успешно учится, проявляет инициативу в учёбе и по хозяйству. Добрая, отзывчивая, ответственная.",
      },
      {
        name: "Милана",
        age: "5 лет",
        text: "В детском саду — активный участник всех мероприятий. Проявляет лидерские качества: умеет организовать сверстников, предложить интересную идею. Добрая, отзывчивая, помогает взрослым. Поведение стабильно положительное.",
      },
      {
        name: "Серёжа",
        age: "4 года",
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
];

export default function OurFamilies() {
  const c = CASES[0];

  return (
    <div className="min-h-screen bg-beige-mid font-golos">
      <SiteNav />

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

        {/* CASE CARD */}
        <article className="bg-white rounded-sm shadow-sm overflow-hidden">
          {/* PHOTO PLACEHOLDER — здесь появятся фото */}
          <div className="w-full h-64 md:h-80 bg-beige-dark/40 flex items-center justify-center border-b border-beige-dark">
            <div className="text-center text-ink/30">
              <div className="text-4xl mb-2">🖼</div>
              <div className="text-sm">Здесь появятся фотографии</div>
            </div>
          </div>

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

            {/* RESULT LINE */}
            <div className="bg-sage/10 border border-sage/30 rounded-sm px-6 py-4 mb-12">
              <p className="font-cormorant text-ink text-xl font-semibold">{c.resultLine}</p>
            </div>

            {/* CHILDREN */}
            <div className="mb-12">
              <h3 className="font-cormorant text-ink text-2xl font-semibold mb-6">Как изменились дети</h3>
              <div className="space-y-6">
                {c.children.map((ch, i) => (
                  <div key={i} className="flex gap-5 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-beige-dark flex items-center justify-center font-cormorant text-ink font-semibold text-sm">
                      {ch.name[0]}
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

            {/* MOM PROGRESS */}
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

            {/* ACTIVITY */}
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

            {/* PLP */}
            <div className="mb-12">
              <h4 className="text-ink text-base font-semibold uppercase tracking-wide mb-3">
                Планы на постлечебную программу (ПЛП)
              </h4>
              <p className="text-ink/70 leading-relaxed text-sm">{c.plpText}</p>
            </div>

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