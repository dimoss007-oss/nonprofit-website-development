import Icon from "@/components/ui/icon";
import { Stats, fmt } from "@/components/admin/fundraising.types";

export default function AdminFundraisingWidget({ stats, onClick }: { stats: Stats | null; onClick?: () => void }) {
  const donors = stats ? stats.orgs_total + stats.persons_total : 0;
  const items = [
    { icon: "Banknote", label: "Всего пожертвований", value: stats ? fmt(stats.donations_total) : "—", color: "text-green-600" },
    { icon: "CalendarDays", label: "За этот месяц", value: stats ? fmt(stats.donations_month) : "—", color: "text-blue-600" },
    { icon: "Users", label: "Доноров", value: stats ? String(donors) : "—", color: "text-slate-800" },
  ];
  return (
    <button onClick={onClick} className="text-left bg-white rounded-2xl border border-slate-200 p-5 hover:border-green-300 hover:shadow-sm transition w-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
          <Icon name="HandCoins" size={16} className="text-green-600" />
        </div>
        <h3 className="font-semibold text-slate-800 text-sm">Фандрайзинг</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map(i => (
          <div key={i.label} className="min-w-0">
            <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
              <Icon name={i.icon} size={13} />
              <span className="text-xs truncate">{i.label}</span>
            </div>
            <p className={`font-inter font-bold text-2xl break-words ${i.color}`}>{i.value}</p>
          </div>
        ))}
      </div>
    </button>
  );
}
