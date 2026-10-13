import Icon from "@/components/ui/icon";
import DashboardCard, { StatusBadge } from "./DashboardCard";
import type { DashboardSummary } from "./dashboard.types";

const DIGEST = {
  ready: { text: "Дайджест готов", tone: "good" as const },
  pending: { text: "Готовится", tone: "warn" as const },
  error: { text: "Ошибка генерации", tone: "bad" as const },
};

interface Props {
  data?: DashboardSummary["aiReports"];
  loading: boolean;
  summaryLoading: boolean;
  onRefresh: () => void;
}

export default function AiReportsCard({ data, loading, summaryLoading, onRefresh }: Props) {
  const digest = data ? DIGEST[data.weeklyDigestStatus] : null;

  return (
    <DashboardCard
      title="Аналитика нейросети"
      icon="BrainCircuit"
      iconClass="bg-purple-50 text-purple-600"
      loading={loading}
      badge={digest && <StatusBadge tone={digest.tone}>{digest.text}</StatusBadge>}
    >
      {data && (
        <div className="space-y-2">
          <p className="text-xs text-ink/60">Тревожные сигналы от психологов</p>
          {data.criticalAlerts.length === 0 ? (
            <StatusBadge tone="good">Сигналов нет</StatusBadge>
          ) : (
            data.criticalAlerts.map(a => (
              <div key={a} className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                <Icon name="TriangleAlert" size={14} className="mt-0.5 flex-shrink-0" />
                {a}
              </div>
            ))
          )}
          {summaryLoading && !data.dailySummary ? (
            <p className="text-sm italic text-gray-400 border-l-2 border-beige-dark pl-3 pt-1">Нейросеть готовит сводку за сутки...</p>
          ) : data.dailySummary ? (
            <p className="text-sm italic text-gray-600 border-l-2 border-beige-dark pl-3 pt-1 leading-relaxed">
              {data.dailySummary}
            </p>
          ) : (
            <p className="text-sm italic text-gray-400 border-l-2 border-beige-dark pl-3 pt-1">Сводок пока нет</p>
          )}
          {data.dailySummaryDate && (
            <p className="text-[11px] text-ink/40">
              {data.dailySummaryFresh ? "Сегодня" : `От ${new Date(data.dailySummaryDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}`}
            </p>
          )}
          <button
            onClick={onRefresh}
            disabled={summaryLoading}
            className="flex items-center gap-1 text-xs text-ink/50 hover:text-ink disabled:opacity-50"
          >
            <Icon name="RefreshCw" size={12} className={summaryLoading ? "animate-spin" : ""} />
            Обновить сводку
          </button>
        </div>
      )}
    </DashboardCard>
  );
}
