import { usePageMeta } from "@/hooks/usePageMeta";
import SiteNav from "@/components/shared/SiteNav";
import SiteFooter from "@/components/shared/SiteFooter";

const partners = [
  {
    name: "Уполномоченный при Президенте Российской Федерации по правам ребёнка",
    logo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/c9cb9db2-6a6a-477e-95e0-c9522f4143d2.jpg",
    href: "http://deti.gov.ru",
    description: "Федеральный институт защиты прав детей в России",
  },
  {
    name: "Губернатор Пензенской области",
    logo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/881d2108-517b-4541-918f-0a776a31c104.jpg",
    href: "https://pnzreg.ru",
    description: "Официальный сайт Пензенской области",
  },
  {
    name: "Фонд президентских грантов",
    logo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/fe35576e-c533-469d-97ee-1a6ffde86c77.png",
    href: "https://президентскиегранты.рф",
    description: "Государственная поддержка некоммерческих организаций",
  },
  {
    name: "Уполномоченный по правам ребёнка Пензенской области",
    logo: "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/b307552c-a91d-44d8-bbcc-5d52418f0f45.jpg",
    href: "https://ombudsmankid.pnzreg.ru",
    description: "Региональный институт защиты прав детей",
  },
  {
    name: "Министерство труда, социальной защиты и демографии Пензенской области",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Coat_of_arms_of_Penza_Oblast.svg/200px-Coat_of_arms_of_Penza_Oblast.svg.png",
    href: "https://trud.pnzreg.ru",
    description: "Государственная поддержка семей и социальная защита",
  },
  {
    name: "Благотворительный фонд «Царьград»",
    logo: "https://tsargrad.tv/favicons/apple-touch-icon-180x180.png",
    href: "https://tsargrad.tv",
    description: "Поддержка традиционных ценностей и благотворительности",
  },
  {
    name: "Благотворительный фонд «Страна для детей»",
    logo: "https://stranadetey.ru/favicon.ico",
    href: "https://stranadetey.ru",
    description: "Помощь детям и семьям в трудной жизненной ситуации",
  },
];

export default function Partners() {
  usePageMeta({
    title: "Партнёры — АНО «Спасение надежды»",
    description: "Партнёры кризисного центра «Спасение надежды» — организации, при поддержке которых реализуется проект помощи семьям в Пензе.",
    ogTitle: "Партнёры — АНО «Спасение надежды»",
    ogDescription: "Организации, при поддержке которых реализуется наш проект.",
    canonical: "https://spasenie58.ru/partners",
  });

  return (
    <div className="min-h-screen bg-beige font-golos">
      <SiteNav />

      <main id="main-content" tabIndex={-1} className="pt-28 pb-24 max-w-5xl mx-auto px-6">

        <div className="mb-14">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-sage" />
            <span className="text-sage text-xs tracking-[0.2em] uppercase font-golos">Поддержка</span>
          </div>
          <h1 className="font-cormorant text-ink text-5xl font-light leading-tight mb-5">
            Проект реализуется<br />
            <span className="text-sage font-semibold">при поддержке</span>
          </h1>
          <p className="text-foreground/65 leading-relaxed max-w-xl">
            Наша работа стала возможной благодаря государственным структурам и фондам, которые разделяют нашу миссию — помогать семьям в трудной жизненной ситуации.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-2xl p-7 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-beige-dark/40"
            >
              <div className="w-28 h-28 flex items-center justify-center mb-5 rounded-2xl bg-beige p-3">
                <img
                  src={p.logo}
                  alt={p.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <h2 className="font-cormorant text-ink text-lg font-semibold leading-snug mb-2 group-hover:text-sage transition-colors">
                {p.name}
              </h2>
              <p className="text-foreground/55 text-sm leading-relaxed">
                {p.description}
              </p>
              <div className="mt-4 text-sage text-xs font-golos font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                Перейти на сайт →
              </div>
            </a>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}