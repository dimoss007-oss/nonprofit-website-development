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
        <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm rounded-lg border border-dashed border-beige-dark text-ink/60 hover:text-ink hover:border-ink transition-colors">
          <Icon name="Plus" size={14} /> Добавить еженедельный отчёт
        </button>
      )}

      {showForm && (
        <div className="bg-beige-mid rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">{editingId ? "Редактирование отчёта" : "Новый еженедельный отчёт"}</p>
            <button onClick={reset} className="p-1 text-ink/40 hover:text-ink"><Icon name="X" size={16} /></button>
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">Неделя (выберите любой день недели)</label>
            <input type="date" value={weekStart} onChange={(e) => e.target.value && setWeekStart(mondayOf(new Date(e.target.value + "T00:00:00")))} className="border border-beige-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink" />
            <span className="text-xs text-ink/50 ml-3">{weekLabel(weekStart)}</span>
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">Отчёт за неделю</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Поведение, настроение, контакт с мамой и детьми, учёба и занятия, трудности, что сделано, результат" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink resize-y" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={reset} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отмена</button>
            <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center gap-1.5">
              <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} />
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-beige-dark rounded-2xl p-5">
        <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-3">История еженедельных отчётов ({reports.length})</h3>
        {loading && <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>}
        {!loading && reports.length === 0 && <p className="text-ink/40 text-sm py-4 text-center">Пока нет еженедельных отчётов</p>}
        {!loading && reports.length > 0 && (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {reports.map((r) => (
              <div key={r.id} className="rounded-xl p-3 bg-beige-mid group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-ink">Неделя {weekLabel(r.week_start)}</span>
                    {r.author && <span className="text-xs text-ink/40">{r.author}</span>}
                    <span className="text-xs text-ink/30">внесён {fmt(r.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(r)} className="p-1 text-ink/40 hover:text-ink"><Icon name="Pencil" size={12} /></button>
                    {isAdmin && <button onClick={() => remove(r.id)} className="p-1 text-ink/30 hover:text-red-400"><Icon name="X" size={13} /></button>}
                  </div>
                </div>
                <p className="text-sm text-ink/80 whitespace-pre-wrap">{r.report_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
