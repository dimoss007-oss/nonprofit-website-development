import Icon from "@/components/ui/icon";
import { useDashboardSummary } from "@/components/admin/dashboard/useDashboardSummary";
import ResidentsCard from "@/components/admin/dashboard/ResidentsCard";
import FinanceCard from "@/components/admin/dashboard/FinanceCard";
import TasksCard from "@/components/admin/dashboard/TasksCard";
import AiReportsCard from "@/components/admin/dashboard/AiReportsCard";
import SystemCard from "@/components/admin/dashboard/SystemCard";

export default function AdminDashboard() {
  const { data, loading, error, reload, saveCapacity, summaryLoading, refreshSummary } = useDashboardSummary();

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-red-700">
          <Icon name="TriangleAlert" size={16} /> Не удалось загрузить сводку
        </div>
        <button onClick={reload} className="text-sm px-3 py-1.5 rounded-lg bg-ink text-beige hover:opacity-90">
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
      <ResidentsCard data={data?.residents} loading={loading} onSaveCapacity={saveCapacity} />
      <FinanceCard data={data?.finance} loading={loading} />
      <SystemCard data={data?.system} loading={loading} />
      <TasksCard data={data?.tasks} loading={loading} />
      <AiReportsCard data={data?.aiReports} loading={loading} summaryLoading={summaryLoading} onRefresh={refreshSummary} />
    </div>
  );
}
