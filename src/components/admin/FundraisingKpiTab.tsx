import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { CRM_URL, KpiData, fmt } from "./fundraising.types";

function KpiCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon name={icon} size={20} />
      </div>
      <div className="text-xl font-bold text-ink">{value}</div>
      <div className="text-xs text-ink/50 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-ink/30 mt-0.5">{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, max, label, color = "bg-sage" }: { value: number; max: number; label: string; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-ink/60">{label}</span>
        <span className="font-semibold text-ink">{pct}%</span>
      </div>
      <div className="h-2 bg-beige-mid rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function FundraisingKpiTab() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${CRM_URL}?type=kpi`).then(r => r.json()).then(d => setKpi(d.kpi || null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>;
  if (!kpi) return <div className="text-center py-16 text-ink/40">Нет данных</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-cormorant text-ink text-2xl font-semibold">Отчётность и KPI</h2>
        <p className="text-xs text-ink/40 mt-0.5">Актуальные данные по фандрайзингу</p>
      </div>

      {/* Финансы */}
      <div>
        <p className="text-xs uppercase tracking-widest text-ink/40 mb-3">Финансовые показатели</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Собрано за год" value={fmt(kpi.total_year)} icon="TrendingUp" color="text-green-600 bg-green-50" />
          <KpiCard label="Собрано за месяц" value={fmt(kpi.total_month)} icon="CalendarDays" color="text-blue-600 bg-blue-50" />
          <KpiCard label="Средний чек" value={fmt(kpi.avg_donation)} icon="Banknote" color="text-violet-600 bg-violet-50" />
          <KpiCard label="Всего пожертвований" value={String(kpi.donations_total)} icon="Heart" color="text-rose-600 bg-rose-50" />
        </div>
      </div>

      {/* Доноры */}
      <div>
        <p className="text-xs uppercase tracking-widest text-ink/40 mb-3">Доноры</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Доноров за год" value={String(kpi.donors_year)} icon="Users" color="text-indigo-600 bg-indigo-50" />
          <KpiCard label="Новых за месяц" value={String(kpi.new_donors_month)} icon="UserPlus" color="text-teal-600 bg-teal-50" />
          <KpiCard label="Регулярные" value={String(kpi.regular_count)} icon="RefreshCw" color="text-amber-600 bg-amber-50" />
          <KpiCard label="Доноров за месяц" value={String(kpi.donors_month)} icon="CalendarCheck" color="text-sky-600 bg-sky-50" />
        </div>
      </div>

      {/* Метрики удержания и воронки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <p className="text-xs uppercase tracking-widest text-ink/40">Удержание и лояльность</p>
          <ProgressBar value={kpi.repeat_rate} max={100} label="Доля повторных пожертвований" color="bg-violet-500" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-beige/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-ink">{kpi.repeat_rate}%</p>
              <p className="text-xs text-ink/50 mt-0.5">повторные доноры</p>
            </div>
            <div className="bg-beige/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-ink">{kpi.regular_count}</p>
              <p className="text-xs text-ink/50 mt-0.5">регулярных</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <p className="text-xs uppercase tracking-widest text-ink/40">Конверсия воронки</p>
          <ProgressBar value={kpi.funnel_funded} max={kpi.funnel_total} label="Подтверждённые → Финансирование" color="bg-green-500" />
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-beige/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-ink">{kpi.funnel_total}</p>
              <p className="text-xs text-ink/50 mt-0.5">в воронке</p>
            </div>
            <div className="bg-beige/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{kpi.funnel_funded}</p>
              <p className="text-xs text-ink/50 mt-0.5">получили</p>
            </div>
            <div className="bg-beige/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-ink">{kpi.funnel_conversion}%</p>
              <p className="text-xs text-ink/50 mt-0.5">конверсия</p>
            </div>
          </div>
        </div>
      </div>

      {/* Итоговая сводка */}
      <div className="bg-ink text-beige rounded-2xl p-5">
        <p className="text-xs uppercase tracking-widest text-beige/40 mb-4">Краткая сводка</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Собрано (год)", value: fmt(kpi.total_year) },
            { label: "Средний чек", value: fmt(kpi.avg_donation) },
            { label: "Повторные", value: `${kpi.repeat_rate}%` },
            { label: "Конверсия", value: `${kpi.funnel_conversion}%` },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xl font-bold">{item.value}</p>
              <p className="text-xs text-beige/50 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
