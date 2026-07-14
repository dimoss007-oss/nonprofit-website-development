import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import SiteNav from "@/components/shared/SiteNav";
import SiteFooter from "@/components/shared/SiteFooter";
import Icon from "@/components/ui/icon";

const DOCUMENTS = [
  {
    title: "Дополнительная общеобразовательная программа «Английский язык: базовый уровень (А2)»",
    description: "Направленность: социально-гуманитарная · Уровень: базовый · Возраст обучающихся: 10–12 лет · Срок освоения: 34 учебные недели (68 часов) · Форма обучения: очная",
    file: "/documents/dop-programma-angliyskiy.pdf",
  },
  {
    title: "Журнал учёта работы организации в системе дополнительного профессионального образования",
    description: "На 2026–2027 учебный год",
    file: "/documents/zhurnal-ucheta-dpo.pdf",
  },
  {
    title: "Положение об обработке персональных данных",
    description: "Утверждено генеральным директором АНО «Спасение надежды»",
    file: "/documents/polozhenie-personalnye-dannye.pdf",
  },
  {
    title: "Положение об утверждении образцов документов об образовании и порядке их выдачи",
    file: "/documents/polozhenie-dokumenty-ob-obrazovanii.pdf",
  },
  {
    title: "Отчёт о результатах самообследования организации дополнительного образования",
    file: "/documents/otchet-samoobsledovanie.pdf",
  },
];

export default function EduLicense() {
  usePageMeta({
    title: "Сведения об образовательной лицензии — АНО «Спасение надежды»",
    description: "Официальные документы, регламентирующие образовательную деятельность АНО «Спасение надежды»: программы дополнительного образования, положения и отчёты.",
    canonical: "https://spasenie58.ru/edu-license",
  });

  return (
    <div className="min-h-screen bg-beige font-golos">
      <SiteNav />

      <div className="pt-28 pb-24 max-w-3xl mx-auto px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sage text-sm mb-8 hover:opacity-75 transition-opacity">
          <Icon name="ArrowLeft" size={14} />
          На главную
        </Link>

        <h1 className="font-cormorant text-ink text-4xl font-semibold mb-2">Сведения об образовательной деятельности</h1>
        <p className="text-foreground/50 text-sm mb-10">АНО «Спасение надежды» · ИНН 5800011843</p>

        <div className="space-y-8 text-foreground/75 leading-relaxed">
          <section>
            <h2 className="font-cormorant text-ink text-2xl font-semibold mb-3">Об организации</h2>
            <p>
              Автономная некоммерческая организация по оказанию помощи семьям, оказавшимся в кризисной ситуации,
              «Спасение надежды» осуществляет образовательную деятельность в рамках дополнительного образования
              в соответствии с Федеральным законом от 29.12.2012 № 273-ФЗ «Об образовании в Российской Федерации».
            </p>
          </section>

          <section>
            <h2 className="font-cormorant text-ink text-2xl font-semibold mb-3">Документы</h2>
            <div className="space-y-3">
              {DOCUMENTS.map((doc) => (
                <a
                  key={doc.file}
                  href={doc.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 bg-white rounded-sm p-5 hover:shadow-sm transition-shadow group"
                >
                  <Icon name="FileText" size={20} className="text-sage flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-ink font-medium group-hover:text-sage transition-colors">{doc.title}</p>
                    {doc.description && (
                      <p className="text-foreground/45 text-xs mt-1">{doc.description}</p>
                    )}
                  </div>
                  <Icon name="Download" size={16} className="text-foreground/30 flex-shrink-0 mt-1" />
                </a>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-cormorant text-ink text-2xl font-semibold mb-3">Реквизиты Организации</h2>
            <div className="bg-white rounded-sm p-6 space-y-2 text-sm">
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <span className="text-foreground/45 uppercase tracking-wider text-xs">Наименование</span>
                <span className="text-ink font-medium">АНО «Спасение надежды»</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <span className="text-foreground/45 uppercase tracking-wider text-xs">ОГРН</span>
                <span className="text-ink">1245800010114</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <span className="text-foreground/45 uppercase tracking-wider text-xs">ИНН</span>
                <span className="text-ink">5800011843</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <span className="text-foreground/45 uppercase tracking-wider text-xs">КПП</span>
                <span className="text-ink">580001001</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <span className="text-foreground/45 uppercase tracking-wider text-xs">Адрес</span>
                <span className="text-ink">440011, г. Пенза, ул. 8 Марта, стр. 17Б</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <span className="text-foreground/45 uppercase tracking-wider text-xs">Руководитель</span>
                <span className="text-ink">Генеральный директор Чуйкин Дмитрий Юрьевич</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <span className="text-foreground/45 uppercase tracking-wider text-xs">Email</span>
                <a href="mailto:spasenienadezhdi@bk.ru" className="text-sage hover:underline">spasenienadezhdi@bk.ru</a>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-ink/10 text-foreground/35 text-xs">
          Последнее обновление: июль 2026 г.
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
