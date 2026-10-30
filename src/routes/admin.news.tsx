import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/news")({
  component: RedirectToAdmin,
});

function RedirectToAdmin() {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-slate-400">
      <a href="/admin">Переход в панель управления АНО «Спасение надежды»...</a>
      <Navigate to="/admin" replace />
    </div>
  );
}
