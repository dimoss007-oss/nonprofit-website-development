import Icon from "@/components/ui/icon";
import { Stats, Section, fmt } from "./fundraising.types";

export function FundraisingStats({ stats, setSection }: {
  stats: Stats | null;
  setSection: (s: Section) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Всего собрано", value: fmt(stats?.donations_total || 0), icon: "Banknote", color: "text-green-600 bg-green-50" },
          { label: "За этот месяц", value: fmt(stats?.donations_month || 0), icon: "CalendarDays", color: "text-blue-600 bg-blue-50" },
          { label: "За этот год", value: fmt(stats?.donations_year || 0), icon: "TrendingUp", color: "text-violet-600 bg-violet-50" },
          { label: "Пожертвований", value: String(stats?.donations_count || 0), icon: "Heart", color: "text-rose-600 bg-rose-50" },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <Icon name={card.icon} size={20} />
            </div>
            <div className="text-xl font-bold text-ink">{card.value}</div>
            <div className="text-xs text-ink/50 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-ink/40 mb-3">Организации</div>
          <div className="flex items-end gap-4">
            <div>
              <div className="text-3xl font-bold text-ink">{stats?.orgs_total || 0}</div>
              <div className="text-xs text-ink/50">всего</div>
            </div>
            <div className="text-lg font-semibold text-green-600">
              {stats?.orgs_active || 0} <span className="text-xs font-normal text-ink/40">активных</span>
            </div>
          </div>
          <button onClick={() => setSection("orgs")}
            className="mt-4 text-xs text-ink/40 hover:text-ink transition-colors flex items-center gap-1">
            Перейти к списку <Icon name="ArrowRight" size={12} />
          </button>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-ink/40 mb-3">Частные жертвователи</div>
          <div className="flex items-end gap-4">
            <div>
              <div className="text-3xl font-bold text-ink">{stats?.persons_total || 0}</div>
              <div className="text-xs text-ink/50">всего</div>
            </div>
            <div className="text-lg font-semibold text-green-600">
              {stats?.persons_active || 0} <span className="text-xs font-normal text-ink/40">активных</span>
            </div>
          </div>
          <button onClick={() => setSection("persons")}
            className="mt-4 text-xs text-ink/40 hover:text-ink transition-colors flex items-center gap-1">
            Перейти к списку <Icon name="ArrowRight" size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
