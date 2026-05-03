import Icon from "@/components/ui/icon";
import { familyBlocks } from "./program.data";

export default function ProgramFamily() {
  return (
    <>
      {/* HERO */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8 bg-sage" />
          <span className="text-sage text-xs tracking-[0.2em] uppercase">Кризисный центр</span>
        </div>
        <h1 className="font-cormorant text-ink text-5xl md:text-6xl font-light leading-tight mb-6">
          Программа <span className="text-sage font-semibold">работы центра</span>
        </h1>
        <p className="text-foreground/65 text-lg leading-relaxed max-w-2xl">
          Человек приходит не за услугой, а за восстановлением своей жизни. Все направления помогают семье пройти путь от кризиса и отчаяния к стабильности, ответственности и внутреннему равновесию.
        </p>
      </div>

      {/* ПРИНЦИП */}
      <div className="mb-16">
        <div className="bg-sage text-white rounded-sm p-8 md:p-10 mb-6">
          <div className="text-xs uppercase tracking-[0.2em] opacity-70 mb-3">Основной принцип</div>
          <p className="text-xl md:text-2xl font-cormorant font-light leading-relaxed">
            Работа кризисного центра строится вокруг семьи в целом — и вокруг родителей, и вокруг детей одновременно.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {familyBlocks.map((block) => (
            <div key={block.title} className="bg-white rounded-sm p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-sage/10 rounded-sm flex items-center justify-center">
                  <Icon name={block.icon as "Users"} size={20} className="text-sage" />
                </div>
                <h3 className="font-cormorant text-ink text-2xl font-semibold">{block.title}</h3>
              </div>
              <ul className="space-y-3">
                {block.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground/70">
                    <div className="w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
