import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { DonorType, CRM_URL, DonorTask, TASK_LABELS, TaskType } from "./fundraising.types";

const inp = "w-full border border-beige-dark rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-white";
const lbl = "block text-xs text-ink/50 mb-1";

function isOverdue(d: string | null) {
  if (!d) return false;
  return new Date(d) < new Date();
}

export function TasksSection({ donorType, donorId }: { donorType: DonorType; donorId: number }) {
  const [tasks, setTasks] = useState<DonorTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ task_type: "call" as TaskType, title: "", due_date: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${CRM_URL}?type=tasks&donor_type=${donorType}&donor_id=${donorId}`)
      .then(r => r.json()).then(d => setTasks(d.tasks || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [donorId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`${CRM_URL}?type=task`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donor_type: donorType, donor_id: donorId, ...form }),
    });
    setSaving(false); setOpen(false);
    setForm({ task_type: "call", title: "", due_date: "", notes: "" });
    load();
  };

  const done = async (id: number) => {
    await fetch(`${CRM_URL}?type=task_done&id=${id}`, { method: "POST" });
    load();
  };

  const del = async (id: number) => {
    await fetch(`${CRM_URL}?type=task&id=${id}`, { method: "DELETE" });
    load();
  };

  const pending = tasks.filter(t => !t.is_done);
  const completed = tasks.filter(t => t.is_done);

  return (
    <div className="space-y-3">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-xs bg-ink text-beige px-3 py-1.5 rounded-lg hover:bg-ink/90 transition-colors">
        <Icon name="Plus" size={12} /> Добавить задачу
      </button>
      {open && (
        <form onSubmit={save} className="bg-beige/50 rounded-xl p-3 space-y-2 border border-beige-dark">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Тип задачи</label>
              <select value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value as TaskType }))} className={inp}>
                {(Object.entries(TASK_LABELS) as [TaskType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Срок</label><input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inp} /></div>
          </div>
          <div><label className={lbl}>Заголовок</label><input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} /></div>
          <div><label className={lbl}>Заметки</label><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inp} /></div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-ink text-beige px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">{saving ? "..." : "Сохранить"}</button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink/50 hover:text-ink">Отмена</button>
          </div>
        </form>
      )}
      {loading ? <div className="text-center py-4 text-ink/30 text-xs">Загружаем...</div>
        : tasks.length === 0 ? <div className="text-center py-6 text-ink/30 text-xs">Задач нет</div>
        : (
          <div className="space-y-1.5">
            {pending.map(t => (
              <div key={t.id} className={`flex items-start gap-2 p-2.5 rounded-xl border group ${isOverdue(t.due_date) ? "border-red-200 bg-red-50" : "border-beige-dark"}`}>
                <button onClick={() => done(t.id)} className="w-4 h-4 rounded border-2 border-ink/30 hover:border-green-500 hover:bg-green-50 flex-shrink-0 mt-0.5 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink font-medium leading-tight">{t.title}</p>
                  <p className={`text-xs mt-0.5 ${isOverdue(t.due_date) ? "text-red-500 font-medium" : "text-ink/40"}`}>
                    {TASK_LABELS[t.task_type]}{t.due_date ? ` · ${new Date(t.due_date).toLocaleDateString("ru-RU")}` : ""}
                    {isOverdue(t.due_date) ? " — просрочено" : ""}
                  </p>
                </div>
                <button onClick={() => del(t.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/30 hover:text-red-500"><Icon name="X" size={11} /></button>
              </div>
            ))}
            {completed.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-ink/40 cursor-pointer select-none">Выполнено ({completed.length})</summary>
                <div className="mt-1.5 space-y-1">
                  {completed.map(t => (
                    <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg opacity-50">
                      <Icon name="CheckCircle" size={13} className="text-green-500 flex-shrink-0" />
                      <p className="text-xs text-ink line-through">{t.title}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
    </div>
  );
}
