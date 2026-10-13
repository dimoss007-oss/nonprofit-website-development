import Icon from "@/components/ui/icon";
import DashboardCard, { StatusBadge } from "./DashboardCard";
import type { DashboardSummary } from "./dashboard.types";

const TREND = {
  up: { icon: "TrendingUp", text: "Растёт", tone: "good" as const },
  down: { icon: "TrendingDown", text: "Падает", tone: "bad" as const },
  stable: { icon: "Minus", text: "Стабильно", tone: "neutral" as const },
};

export default function FinanceCard({ data, loading }: { data?: DashboardSummary["finance"]; loading: boolean }) {
  const trend = data ? TREND[data.trend] : null;

  return (
    <DashboardCard
      title="Сбор средств (ЮKassa)"
      icon="HandCoins"
      iconClass="bg-green-50 text-green-600"
      loading={loading}
      badge={trend && <StatusBadge tone={trend.tone}>{trend.text}</StatusBadge>}
    >
      {data && (
        <div className="space-y-3">
          <div>
            <p className="text-3xl font-semibold text-ink">{data.monthlyTotalRub.toLocaleString("ru-RU")} ₽</p>
            <p className="text-xs text-ink/60 mt-1">Собрано за текущий месяц</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink/80 bg-beige-mid rounded-xl px-3 py-2">
            <Icon name="Repeat" size={14} />
            Активных ежемесячных доноров: <b>{data.activeRecurringDonors}</b>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
