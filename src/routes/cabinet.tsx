import { createFileRoute } from "@tanstack/react-router";
import Cabinet from "@/pages/Cabinet";

export const Route = createFileRoute("/cabinet")({
  ssr: false,
  pendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center text-sm text-slate-400">Личный кабинет АНО «Спасение надежды» — загрузка...</div>
  ),
  component: Cabinet,
});
