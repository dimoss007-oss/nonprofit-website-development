import { useState } from "react";
import Icon from "@/components/ui/icon";
import { DonorType } from "./fundraising.types";
import { HistorySection, DonationsSection } from "./DonorHistorySection";
import { TasksSection } from "./DonorTasksSection";
import { DocsSection, MetricsSection } from "./DonorDocsMetricsSection";

type CrmSection = "history" | "donations" | "tasks" | "docs" | "metrics";

const sectionBtn = (active: boolean) =>
  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${active ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"}`;

export function DonorCrmPanel({ donorType, donorId, donorName, onClose }: {
  donorType: DonorType;
  donorId: number;
  donorName: string;
  onClose: () => void;
}) {
  const [section, setSection] = useState<CrmSection>("history");

  const SECTIONS: { id: CrmSection; label: string; icon: string }[] = [
    { id: "history", label: "История", icon: "Clock" },
    { id: "donations", label: "Пожертвования", icon: "Banknote" },
    { id: "tasks", label: "Задачи", icon: "CheckSquare" },
    { id: "docs", label: "Документы", icon: "FileText" },
    { id: "metrics", label: "Метрики", icon: "Activity" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <p className="font-semibold text-slate-800">{donorName}</p>
            <p className="text-xs text-slate-400">{donorType === "org" ? "Организация" : "Физическое лицо"}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 p-1">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Навигация */}
        <div className="flex items-center gap-1 px-5 py-2.5 border-b border-slate-200 overflow-x-auto flex-shrink-0">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} className={sectionBtn(section === s.id)}>
              <Icon name={s.icon} size={12} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Контент */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {section === "history" && <HistorySection donorType={donorType} donorId={donorId} />}
          {section === "donations" && <DonationsSection donorType={donorType} donorId={donorId} />}
          {section === "tasks" && <TasksSection donorType={donorType} donorId={donorId} />}
          {section === "docs" && <DocsSection donorType={donorType} donorId={donorId} />}
          {section === "metrics" && <MetricsSection donorType={donorType} donorId={donorId} />}
        </div>
      </div>
    </div>
  );
}
