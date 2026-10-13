import DashboardCard, { StatusBadge } from "./DashboardCard";
import type { DashboardSummary } from "./dashboard.types";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

export default function TasksCard({ data, loading }: { data?: DashboardSummary["tasks"]; loading: boolean }) {
  const today = startOfToday();
  const overdueCount = data ? data.filter(t => new Date(t.date) < today).length : 0;

  return (
    <DashboardCard
      title="Задачи"
      icon="ClipboardList"
      iconClass="bg-violet-50 text-violet-600"
      loading={loading}
      className="lg:col-span-2"
      badge={overdueCount > 0
        ? <StatusBadge tone="bad">Просрочено: {overdueCount}</StatusBadge>
        : <StatusBadge tone="good">Всё в срок</StatusBadge>}
    >
      <ul className="space-y-2">
        {data?.map(t => {
          const overdue = new Date(t.date) < today;
          return (
            <li key={t.id} className={`rounded-xl px-3 py-2.5 border ${overdue ? "border-red-200 bg-red-50" : "border-beige-dark bg-beige-mid"}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-ink">{t.title}</p>
                <div className="flex gap-1 flex-shrink-0">
                  {t.isUrgent && <StatusBadge tone="warn">Срочно</StatusBadge>}
                  {overdue && <StatusBadge tone="bad">Просрочено</StatusBadge>}
                </div>
              </div>
              <p className="text-xs text-ink/50 mt-1">{t.author} · {formatDate(t.date)}</p>
            </li>
          );
        })}
        {data?.length === 0 && <li className="text-sm text-ink/50">Активных задач нет</li>}
      </ul>
    </DashboardCard>
  );
}
