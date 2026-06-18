import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { CRM_URL, DonorTask, TaskType, TASK_LABELS } from "./fundraising.types";

const inp = "w-full border border-beige-dark rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40";
const lbl = "block text-xs uppercase tracking-widest text-ink/50 mb-1";

const TASK_ICONS: Record<TaskType, string> = {
  call: "Phone", email: "Mail", report: "FileText",
  congrats: "PartyPopper", proposal: "FileEdit", meeting: "Users", other: "Circle",
};

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ru-RU");
}
function isOverdue(d: string | null) {
  if (!d) return false;
  return new Date(d) < new Date();
}
function isToday(d: string | null) {
  if (!d) return false;
  const t = new Date(d).toDateString();
  return t === new Date().toDateString();
}

export default function FundraisingTasksTab() {
  const [tasks, setTasks] = useState<DonorTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ task_type: "call" as TaskType, title: "", due_date: "", notes: "", manager: "" });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "today" | "overdue">("all");

  const load = () => {
    setLoading(true);
    fetch(`${CRM_URL}?type=tasks&all=1`).then(r => r.json()).then(d => setTasks(d.tasks || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await fetch(`${CRM_URL}?type=task`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setSaving(false); setOpen(false);
    setForm({ task_type: "call", title: "", due_date: "", notes: "", manager: "" });
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

  const filtered = tasks.filter(t => {
    if (filter === "overdue") return isOverdue(t.due_date);
    if (filter === "today") return isToday(t.due_date);
    return true;
  });

  const overdueCount = tasks.filter(t => isOverdue(t.due_date)).length;
  const todayCount = tasks.filter(t => isToday(t.due_date)).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-cormorant text-ink text-2xl font-semibold">Задачи и напоминания</h2>
          <div className="flex items-center gap-3 mt-1 text-xs text-ink/50">
            <span>{tasks.length} активных</span>
            {overdueCount > 0 && <span className="text-red-500 font-medium flex items-center gap-1"><Icon name="AlertCircle" size={11} />{overdueCount} просроченных</span>}
            {todayCount > 0 && <span className="text-amber-600 font-medium">На сегодня: {todayCount}</span>}
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90">
          <Icon name="Plus" size={15} /> Добавить
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="bg-white border border-beige-dark rounded-2xl p-5 space-y-3">
          <h3 className="font-semibold text-ink text-sm">Новая задача</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Тип задачи</label>
              <select value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value as TaskType }))} className={inp}>
                {(Object.entries(TASK_LABELS) as [TaskType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Срок</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Задача *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Например: Позвонить Иванову по поводу гранта" className={inp} />
            </div>
            <div>
              <label className={lbl}>Ответственный</label>
              <input value={form.manager} onChange={e => setForm(f => ({ ...f, manager: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>Заметки</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inp} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-ink text-beige px-5 py-2 rounded-xl text-sm font-semibold hover:bg-ink/90 disabled:opacity-50">{saving ? "Сохраняем..." : "Сохранить"}</button>
            <button type="button" onClick={() => setOpen(false)} className="px-5 py-2 rounded-xl text-sm border border-beige-dark text-ink/60 hover:text-ink">Отмена</button>
          </div>
        </form>
      )}

      {/* Фильтры */}
      <div className="flex items-center gap-1 bg-beige-mid rounded-xl p-1 w-fit">
        {([["all", "Все"], ["today", "Сегодня"], ["overdue", "Просроченные"]] as [typeof filter, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === id ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"}`}>
            {label}
            {id === "overdue" && overdueCount > 0 && <span className="ml-1 text-red-500">({overdueCount})</span>}
            {id === "today" && todayCount > 0 && <span className="ml-1 text-amber-600">({todayCount})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-ink/40"><Icon name="CheckCircle" size={36} className="mx-auto mb-3 opacity-30" /><p>{filter === "all" ? "Задач нет" : "Нет задач в этом фильтре"}</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <div key={t.id} className={`flex items-start gap-3 p-4 rounded-2xl border group transition-colors ${isOverdue(t.due_date) ? "border-red-200 bg-red-50" : isToday(t.due_date) ? "border-amber-200 bg-amber-50" : "border-beige-dark bg-white"}`}>
              <button onClick={() => done(t.id)} className="w-5 h-5 rounded border-2 border-ink/30 hover:border-green-500 hover:bg-green-50 flex-shrink-0 mt-0.5 transition-colors" />
              <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-white/70 flex-shrink-0">
                <Icon name={TASK_ICONS[t.task_type] || "Circle"} size={14} className="text-ink/50" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink leading-tight">{t.title}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap text-xs">
                  <span className="text-ink/40">{TASK_LABELS[t.task_type]}</span>
                  {t.due_date && (
                    <span className={isOverdue(t.due_date) ? "text-red-500 font-semibold" : isToday(t.due_date) ? "text-amber-600 font-semibold" : "text-ink/40"}>
                      {isOverdue(t.due_date) ? "Просрочено: " : isToday(t.due_date) ? "Сегодня: " : ""}{fmtDate(t.due_date)}
                    </span>
                  )}
                  {t.donor_name && <span className="text-ink/40 flex items-center gap-1"><Icon name="User" size={10} />{t.donor_name}</span>}
                  {t.manager && <span className="text-ink/40">{t.manager}</span>}
                </div>
                {t.notes && <p className="text-xs text-ink/40 mt-0.5">{t.notes}</p>}
              </div>
              <button onClick={() => del(t.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/30 hover:text-red-500 flex-shrink-0 transition-all">
                <Icon name="Trash2" size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
