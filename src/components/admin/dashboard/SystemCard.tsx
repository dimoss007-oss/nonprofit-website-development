import Icon from "@/components/ui/icon";
import DashboardCard, { StatusBadge } from "./DashboardCard";
import type { DashboardSummary } from "./dashboard.types";

const STALE_HOURS = 24 * 7;

export default function SystemCard({ data, loading }: { data?: DashboardSummary["system"]; loading: boolean }) {
  const last = data?.lastVkSync ? new Date(data.lastVkSync) : null;
  const hoursAgo = last ? Math.floor((Date.now() - last.getTime()) / 3600000) : 0;
  const stale = hoursAgo >= STALE_HOURS;

  return (
    <DashboardCard
      title="Статус системы"
      icon="Activity"
      iconClass="bg-cyan-50 text-cyan-600"
      loading={loading}
      badge={last && <StatusBadge tone={stale ? "bad" : "good"}>{stale ? "Нет синхронизации" : "Работает"}</StatusBadge>}
    >
      {!last && data && <p className="text-sm text-slate-500">Синхронизаций с ВКонтакте пока не было</p>}
      {last && (
        <div className="flex items-start gap-2 text-sm text-slate-600">
          <Icon name="RefreshCw" size={14} className="mt-0.5 flex-shrink-0" />
          <div className="min-w-0 break-words">
            <p>Последняя новость из ВКонтакте</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {last.toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      )}
      {data && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {[
            { icon: "Newspaper", label: "Новостей на сайте", value: data.newsTotal },
            { icon: "Image", label: "Фото в галерее", value: data.photosTotal },
            { icon: "Users", label: "Карточек в CRM", value: data.patientsTotal },
            { icon: "UserCog", label: "Сотрудников", value: data.staffTotal },
            { icon: "Repeat", label: "Подписок доноров", value: data.subscriptionsActive },
            { icon: "ClipboardList", label: "Открытых задач", value: data.tasksOpen },
          ].map(i => (
            <div key={i.label} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 min-w-0">
              <Icon name={i.icon} size={14} className="text-cyan-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-none">{i.value}</p>
                <p className="text-[11px] text-slate-400 mt-1 truncate">{i.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
