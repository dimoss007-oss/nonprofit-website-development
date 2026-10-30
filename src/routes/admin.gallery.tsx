import { createFileRoute } from "@tanstack/react-router";
import AdminGallery from "@/pages/AdminGallery";

export const Route = createFileRoute("/admin/gallery")({
  ssr: false,
  pendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center text-sm text-slate-400">Панель управления АНО «Спасение надежды» — загрузка...</div>
  ),
  component: AdminGallery,
});
