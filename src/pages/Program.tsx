import Icon from "@/components/ui/icon";
import ProgramNav from "@/components/program/ProgramNav";
import ProgramFamily from "@/components/program/ProgramFamily";
import ProgramDirections from "@/components/program/ProgramDirections";

export default function Program() {
  return (
    <div className="min-h-screen bg-beige font-golos">
      <ProgramNav />

      <div className="pt-28 pb-24 max-w-5xl mx-auto px-6">
        <ProgramFamily />
        <ProgramDirections />

        {/* CTA */}
        <div className="bg-white rounded-sm p-10 text-center">
          <h2 className="font-cormorant text-ink text-3xl font-semibold mb-4">Обратиться за помощью</h2>
          <p className="text-foreground/60 mb-8 max-w-md mx-auto">Свяжитесь с нами — специалисты центра подберут подходящее направление работы для вашей семьи</p>
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
