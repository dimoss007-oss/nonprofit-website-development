import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Patient } from "@/components/admin/crm/crmShared";

const shortName = (p: Patient) => (p.first_name || "").trim().toLowerCase();

export default function PatientNamesHint({ patients }: { patients: Patient[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const active = patients.filter((p) => !p.discharge_date);
  const counts = active.reduce<Record<string, number>>((acc, p) => {
    const k = shortName(p);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const writeAs = (p: Patient) => (p.alias?.trim() ? p.alias.trim() : `${p.first_name} ${p.last_name}`);
  const copy = () => {
    navigator.clipboard.writeText(active.map((p) => `${writeAs(p)} - `).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white border border-beige-dark rounded-2xl">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5 text-left">
        <span className="flex items-center gap-2 font-semibold text-ink text-sm">
          <Icon name="ListChecks" size={16} /> Как писать имена в отчёте для бота
        </span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={16} className="text-ink/40" />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-4 border-t border-beige-dark space-y-3">
          <p className="text-xs text-ink/60">Начинайте каждую строку отчёта с имени, как в списке ниже, затем тире и текст. Если в центре несколько человек с одним именем, одного имени «Таня» недостаточно — бот не сохранит такую строку.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {active.map((p) => {
              const shared = counts[shortName(p)] > 1;
              const hasAlias = !!p.alias?.trim();
              return (
                <div key={p.id} className="bg-beige-mid rounded-xl px-3 py-2">
                  <p className="text-sm font-medium text-ink">{writeAs(p)}</p>
                  <p className="text-xs text-ink/50">{p.last_name} {p.first_name}</p>
                  {shared && !hasAlias && <p className="text-xs text-amber-700 mt-0.5">Есть тёзки — добавьте псевдоним в карточке</p>}
                </div>
              );
            })}
          </div>
          <button onClick={copy} className="text-xs text-ink/60 hover:text-ink flex items-center gap-1">
            <Icon name={copied ? "Check" : "Copy"} size={12} /> {copied ? "Скопировано" : "Скопировать шаблон отчёта"}
          </button>
        </div>
      )}
    </div>
  );
}
