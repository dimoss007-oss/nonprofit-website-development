import Icon from "@/components/ui/icon";
import { Section } from "./fundraising.types";

export interface FundraisingMetric {
  key: string;
  label: string;
  value: string;
  color: string;
  border: string;
  hover: string;
  go: Section;
}

export interface FundraisingSectionItem {
  id: Section;
  label: string;
  icon: string;
}

interface Props {
  metrics: FundraisingMetric[];
  sections: FundraisingSectionItem[];
  section: Section;
  currentLabel: string;
  switchSection: (id: Section) => void;
}

export function FundraisingNav({ metrics, sections, section, currentLabel, switchSection }: Props) {
  return (
    <>
    <div className="flex flex-wrap justify-between items-center gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Фандрайзинг</h1>
        <p className="text-sm text-slate-500 mt-1">Пожертвования, партнёры и работа с жертвователями</p>
      </div>
      <span className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium shadow-sm">{currentLabel}</span>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {metrics.map(m => (
        <button key={m.key} onClick={() => switchSection(m.go)} className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center transition ${m.border} ${m.hover} ${m.key === "count" ? "col-span-2 md:col-span-1" : ""}`}>
          <span className={`text-2xl font-bold ${m.color}`}>{m.value}</span>
          <span className="text-xs text-slate-500 font-medium mt-1">{m.label}</span>
        </button>
      ))}
    </div>

    <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
      <div className="flex items-center gap-1 min-w-max">
        {sections.map(x => (
          <button key={x.id} onClick={() => switchSection(x.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${section === x.id ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
            <Icon name={x.icon} size={14} />
            {x.label}
          </button>
        ))}
      </div>
    </div>
    </>
  );
}
