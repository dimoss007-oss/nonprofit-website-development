import AdminResidentsYearWidget from "@/components/admin/AdminResidentsYearWidget";
import AdminFundraisingWidget from "@/components/admin/AdminFundraisingWidget";
import { Stats, FUNDRAISING_URL } from "@/components/admin/fundraising.types";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { useDashboardSummary } from "@/components/admin/dashboard/useDashboardSummary";
import ResidentsCard from "@/components/admin/dashboard/ResidentsCard";
import TasksCalendarCard from "@/components/admin/dashboard/TasksCalendarCard";
import AiReportsCard from "@/components/admin/dashboard/AiReportsCard";
import NewsCard from "@/components/admin/dashboard/NewsCard";
import SystemCard from "@/components/admin/dashboard/SystemCard";

export default function AdminDashboard({ onNavigate, session, users }: { onNavigate?: (tab: string) => void; session: { login: string; full_name: string }; users: { login: string; full_name?: string }[] }) {
  const [fundStats, setFundStats] = useState<Stats | null>(null);
  useEffect(() => {
    fetch(`${FUNDRAISING_URL}?type=stats`).then(r => r.json()).then(setFundStats).catch(() => {});
  }, []);
  const { data, loading, error, reload, saveCapacity, summaryLoading, refreshSummary } = useDashboardSummary();

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 flex items-center justify-between gap-4 font-inter">
        <div className="flex items-center gap-2 text-sm text-red-700">
          <Icon name="TriangleAlert" size={16} /> Не удалось загрузить сводку
        </div>
        <button onClick={reload} className="text-sm px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition font-medium">
          Повторить
        </button>
      </div>
    );
  }

  const overdue = data ? data.tasks.filter(t => t.isOverdue).length : 0;
  const metrics = [
    { key: "active", label: "В стационаре", value: data?.residents.totalActive ?? "—", color: "text-green-600", border: "border-green-100", hover: "hover:bg-green-50", go: "crm" },
    { key: "children", label: "Детей с ними", value: data?.residents.totalChildren ?? "—", color: "text-slate-700", border: "border-slate-100", hover: "hover:bg-slate-50", go: "crm" },
    { key: "beds", label: "Свободных мест", value: data?.residents.freeBeds ?? "—", color: "text-blue-600", border: "border-blue-100", hover: "hover:bg-blue-50", go: "crm" },
    { key: "overdue", label: "Просроченных задач", value: data ? overdue : "—", color: overdue > 0 ? "text-red-500" : "text-slate-700", border: overdue > 0 ? "border-red-100" : "border-slate-100", hover: "hover:bg-red-50", go: "tasks" },
  ];

  return (
    <div className="space-y-6 font-inter">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Главная</h1>
        <p className="text-sm text-slate-500 mt-1">Главное о центре за сегодня: семьи, сборы, задачи и новости</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(m => (
          <button key={m.key} onClick={() => onNavigate?.(m.go)} className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center transition min-w-0 ${m.border} ${m.hover} ${m.key === "overdue" ? "col-span-2 md:col-span-1" : ""}`}>
            <span className={`text-2xl font-bold break-words max-w-full ${m.color}`}>{m.value}</span>
            <span className="text-xs text-slate-500 font-medium mt-1 text-center">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminFundraisingWidget stats={fundStats} onClick={() => onNavigate?.("fundraising")} />
        <AdminResidentsYearWidget />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 [&>*]:min-w-0">
        <ResidentsCard data={data?.residents} loading={loading} onSaveCapacity={saveCapacity} />
        <SystemCard data={data?.system} loading={loading} />
        <TasksCalendarCard session={session} users={users} onOpenTasks={() => onNavigate?.("tasks")} />
        <AiReportsCard data={data?.aiReports} loading={loading} summaryLoading={summaryLoading} onRefresh={refreshSummary} />
        <NewsCard data={data?.news} loading={loading} />
      </div>
    </div>
  );
}
