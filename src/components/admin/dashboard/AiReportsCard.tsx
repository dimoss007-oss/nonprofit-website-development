import Icon from "@/components/ui/icon";
import DashboardCard, { StatusBadge } from "./DashboardCard";
import type { DashboardSummary } from "./dashboard.types";

const DIGEST = {
  ready: { text: "Дайджест готов", tone: "good" as const },
  pending: { text: "Готовится", tone: "warn" as const },
  error: { text: "Ошибка генерации", tone: "bad" as const },
};

export default function AiReportsCard({ data, loading }: { data?: DashboardSummary["aiReports"]; loading: boolean }) {
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
        </div>
      )}
    </DashboardCard>
  );
}
