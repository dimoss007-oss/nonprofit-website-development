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
      {!last && data && <p className="text-sm text-ink/60">Синхронизаций с ВКонтакте пока не было</p>}
      {last && (
        <div className="flex items-start gap-2 text-sm text-ink/80">
          <Icon name="RefreshCw" size={14} className="mt-0.5 flex-shrink-0" />
          <div className="min-w-0 break-words">
            <p>Последняя новость из ВКонтакте</p>
            <p className="text-xs text-ink/50 mt-0.5">
              {last.toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
