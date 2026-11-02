import Icon from "@/components/ui/icon";
import DashboardCard from "./DashboardCard";
import type { DashboardSummary } from "./dashboard.types";

export default function PsychologistCard({ data, loading, onOpen }: { data?: DashboardSummary["psychologist"]; loading: boolean; onOpen?: () => void }) {
  const month = new Date().toLocaleString("ru-RU", { month: "long" });
  const items = [
    { icon: "FileText", label: `Протоколов за ${month}`, value: data?.sessionsMonth },
    { icon: "Paperclip", label: `Рекомендаций прикреплено за ${month}`, value: data?.attachedMonth },
  ];

  return (
    <DashboardCard title="Кабинет психолога" icon="Brain" iconClass="bg-indigo-50 text-indigo-600" loading={loading}>
      {!data ? (
        <p className="text-sm text-slate-500">Данные пока недоступны</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {items.map(i => (
              <div key={i.label} className="bg-slate-50 rounded-xl px-3 py-3 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon name={i.icon} size={14} className="text-indigo-600 flex-shrink-0" />
                  <p className="text-2xl font-bold text-slate-800 leading-none">{i.value ?? 0}</p>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">{i.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">Всего прикреплено к карточкам семей: {data.attachedTotal}</p>
          {onOpen && (
            <button onClick={onOpen} className="mt-3 self-start text-xs text-indigo-600 hover:underline">Открыть кабинет психолога</button>
          )}
        </>
      )}
    </DashboardCard>
  );
}
