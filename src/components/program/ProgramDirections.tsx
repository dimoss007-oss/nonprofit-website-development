import { useState } from "react";
import Icon from "@/components/ui/icon";
import { sections, Section } from "./program.data";

function SectionDetail({ section }: { section: Section }) {
  return (
    <div className="mt-6 pt-6 border-t border-beige-dark space-y-5">
      <p className="text-foreground/70 leading-relaxed">{section.intro}</p>
      {section.blocks.map((block, i) => (
        <div key={i}>
          {block.heading && (
            <h4 className="font-cormorant text-ink text-lg font-semibold mb-2">{block.heading}</h4>
          )}
          {block.text && (
            <p className="text-foreground/65 text-sm leading-relaxed">{block.text}</p>
          )}
          {block.image && (
            <img src={block.image} alt="" className="w-full rounded-sm object-cover max-h-80 mt-1" />
          )}
          {block.items && (
            <ul className="space-y-1.5 mt-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-foreground/65 text-sm">
                  <div className="w-1 h-1 rounded-full bg-sage mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {section.conclusion && (
        <div className="bg-sage/8 border-l-2 border-sage rounded-sm px-5 py-4 mt-4">
          <p className="text-foreground/75 text-sm leading-relaxed italic">{section.conclusion}</p>
        </div>
      )}
    </div>
  );
}

export default function ProgramDirections() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggle = (num: string) => setOpenSection(openSection === num ? null : num);

  return (
    <div className="mb-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-px w-8 bg-sage" />
        <h2 className="font-cormorant text-ink text-3xl font-semibold">Основные направления работы</h2>
      </div>

      <div className="space-y-3">
        {sections.map((s) => {
          const isOpen = openSection === s.num;
          return (
            <div key={s.num} className="bg-white rounded-sm overflow-hidden">
              <button
                onClick={() => toggle(s.num)}
                className="w-full flex gap-5 items-start p-7 text-left hover:bg-beige/40 transition-colors"
              >
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="w-11 h-11 bg-sage/10 rounded-sm flex items-center justify-center">
                    <Icon name={s.icon as "MessageCircle"} size={20} className="text-sage" />
                  </div>
                  <span className="font-cormorant text-sage text-sm font-semibold opacity-60">{s.num}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-cormorant text-ink text-xl font-semibold mb-3">{s.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {s.tags.map((tag, i) => (
                      <span key={i} className="bg-beige text-foreground/65 text-xs px-3 py-1 rounded-sm border border-beige-dark">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0 mt-1">
                  <Icon
                    name="ChevronDown"
                    size={18}
                    className={`text-sage/60 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="px-7 pb-7">
                  <SectionDetail section={s} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}