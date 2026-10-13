import DashboardCard, { StatusBadge } from "./DashboardCard";
import type { DashboardSummary } from "./dashboard.types";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

export default function TasksCard({ data, loading }: { data?: DashboardSummary["tasks"]; loading: boolean }) {
  const overdueCount = data ? data.filter(t => t.isOverdue).length : 0;

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
          const overdue = t.isOverdue;
          return (
            <li key={t.id} className={`rounded-xl px-3 py-2.5 border ${overdue ? "border-red-200 bg-red-50" : "border-beige-dark bg-beige-mid"}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                <p className="text-sm text-ink break-words min-w-0">{t.title}</p>
                <div className="flex gap-1 flex-shrink-0 flex-wrap">
                  {t.isUrgent && !overdue && <StatusBadge tone="warn">Срочно</StatusBadge>}
                  {overdue && <StatusBadge tone="bad">Просрочено</StatusBadge>}
                </div>
              </div>
              <p className="text-xs text-ink/50 mt-1">{t.author} · {t.hasDeadline ? `срок ${formatDate(t.date)}` : `создана ${formatDate(t.date)}`}</p>
            </li>
          );
        })}
        {data?.length === 0 && <li className="text-sm text-ink/50">Активных задач нет</li>}
      </ul>
    </DashboardCard>
  );
}
