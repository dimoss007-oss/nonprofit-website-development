import { createFileRoute } from "@tanstack/react-router";
import AdminPanel from "@/pages/AdminPanel";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  pendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center text-sm text-slate-400">Панель управления АНО «Спасение надежды» — загрузка...</div>
  ),
  component: AdminPanel,
});
