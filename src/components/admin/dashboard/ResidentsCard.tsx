import DashboardCard from "./DashboardCard";
import type { DashboardSummary } from "./dashboard.types";

export default function ResidentsCard({ data, loading }: { data?: DashboardSummary["residents"]; loading: boolean }) {
  const items = data ? [
    { label: "В центре сейчас", value: data.totalActive },
    { label: "Свободных мест", value: data.freeBeds },
    { label: "Новые за неделю", value: data.newThisWeek },
  ] : [];

  return (
    <DashboardCard title="Оперативная сводка" icon="Users" iconClass="bg-blue-50 text-blue-600" loading={loading}>
      <div className="grid grid-cols-3 gap-3">
        {items.map(i => (
          <div key={i.label} className="bg-beige-mid rounded-xl px-3 py-3">
            <p className="text-2xl font-semibold text-ink">{i.value}</p>
            <p className="text-xs text-ink/60 mt-1">{i.label}</p>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
