import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { CHILD_WEEKLY_API, ChildWeeklyReport, fmt } from "@/components/admin/crm/crmShared";

const mondayOf = (d: Date) => {
  const x = new Date(d);
  const shift = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - shift);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

const weekLabel = (start: string) => {
  const from = new Date(start.slice(0, 10) + "T00:00:00");
  const to = new Date(from);
  to.setDate(to.getDate() + 6);
  const f = (d: Date) => d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  return `${f(from)} – ${f(to)}.${to.getFullYear()}`;
};

export default function ChildWeeklyReports({ childId, authorName, isAdmin, onChanged }: {
  childId: number; authorName: string; isAdmin: boolean; onChanged?: () => void;
}) {
  const [reports, setReports] = useState<ChildWeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${CHILD_WEEKLY_API}?child_id=${childId}`);
      const d = await r.json();
      setReports(d.reports || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [childId]);

  const reset = () => {
    setShowForm(false); setEditingId(null); setText(""); setError(""); setWeekStart(mondayOf(new Date()));
  };

  const startEdit = (r: ChildWeeklyReport) => {
    setEditingId(r.id); setWeekStart(r.week_start.slice(0, 10)); setText(r.report_text); setError(""); setShowForm(true);
  };

  const submit = async () => {
    if (!text.trim()) { setError("Введите текст отчёта"); return; }
    setSaving(true); setError("");
    try {
      const payload = { child_id: childId, author: authorName, week_start: weekStart, report_text: text };
      const r = editingId
        ? await fetch(`${CHILD_WEEKLY_API}?id=${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch(CHILD_WEEKLY_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Не удалось сохранить отчёт"); return; }
      reset();
      await load();
      onChanged?.();
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить еженедельный отчёт?")) return;
    await fetch(`${CHILD_WEEKLY_API}?id=${id}`, { method: "DELETE" });
    load();
    onChanged?.();
  };

  return (
    <div className="space-y-4">
      {!showForm && (
        <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm rounded-lg border border-dashed border-slate-200 text-slate-500 hover:text-slate-800 hover:border-indigo-300 transition-colors">
          <Icon name="Plus" size={14} /> Добавить еженедельный отчёт
        </button>
      )}

      {showForm && (
        <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">{editingId ? "Редактирование отчёта" : "Новый еженедельный отчёт"}</p>
            <button onClick={reset} className="p-1 text-slate-400 hover:text-slate-800"><Icon name="X" size={16} /></button>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Неделя (выберите любой день недели)</label>
            <input type="date" value={weekStart} onChange={(e) => e.target.value && setWeekStart(mondayOf(new Date(e.target.value + "T00:00:00")))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
            <span className="text-xs text-slate-400 ml-3">{weekLabel(weekStart)}</span>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Отчёт за неделю</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Поведение, настроение, контакт с мамой и детьми, учёба и занятия, трудности, что сделано, результат" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400 resize-y" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={reset} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors">Отмена</button>
            <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-slate-100 transition-colors disabled:opacity-60 flex items-center gap-1.5">
              <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} />
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-3">История еженедельных отчётов ({reports.length})</h3>
        {loading && <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>}
        {!loading && reports.length === 0 && <p className="text-slate-400 text-sm py-4 text-center">Пока нет еженедельных отчётов</p>}
        {!loading && reports.length > 0 && (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {reports.map((r) => (
              <div key={r.id} className="rounded-xl p-3 bg-slate-50 group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-slate-800">Неделя {weekLabel(r.week_start)}</span>
                    {r.author && <span className="text-xs text-slate-400">{r.author}</span>}
                    <span className="text-xs text-slate-300">внесён {fmt(r.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(r)} className="p-1 text-slate-400 hover:text-slate-800"><Icon name="Pencil" size={12} /></button>
                    {isAdmin && <button onClick={() => remove(r.id)} className="p-1 text-slate-300 hover:text-red-400"><Icon name="X" size={13} /></button>}
                  </div>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{r.report_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
