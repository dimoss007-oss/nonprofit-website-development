import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import AdminTasksCalendar from "./AdminTasksCalendar";

const API = "https://functions.poehali.dev/6036e39a-3369-4ec5-a7b3-a4393528188a";

type Priority = "low" | "medium" | "high";
type Status = "new" | "in_progress" | "done";

type Task = {
  id: number;
  title: string;
  description?: string;
  assignee_login?: string;
  assignee_name?: string;
  priority: Priority;
  status: Status;
  deadline?: string;
  created_by?: string;
  created_at: string;
};

const PRIORITY_LABEL: Record<Priority, string> = { low: "Низкий", medium: "Средний", high: "Высокий" };
const PRIORITY_COLOR: Record<Priority, string> = {
  low: "bg-beige-dark text-ink/60",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-red-100 text-red-600",
};
const STATUS_LABEL: Record<Status, string> = { new: "Новая", in_progress: "В работе", done: "Выполнена" };
const STATUS_COLOR: Record<Status, string> = {
  new: "bg-beige-dark text-ink/60",
  in_progress: "bg-yellow-100 text-yellow-700",
  done: "bg-green-100 text-green-700",
};
const STATUS_NEXT: Record<Status, { status: Status; label: string; icon: string }> = {
  new: { status: "in_progress", label: "Взять в работу", icon: "Play" },
  in_progress: { status: "done", label: "Выполнена", icon: "Check" },
  done: { status: "new", label: "Вернуть", icon: "RotateCcw" },
};

function fmt(d?: string) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ru-RU");
}

function isOverdue(deadline?: string, status?: Status) {
  if (!deadline || status === "done") return false;
  return new Date(deadline) < new Date(new Date().toDateString());
}

const EMPTY_FORM = { title: "", description: "", assignee_login: "", assignee_name: "", priority: "medium" as Priority, deadline: "" };

function TaskForm({
  initial, onSave, onCancel, loading, users,
}: {
  initial?: Partial<typeof EMPTY_FORM>;
  onSave: (d: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  loading: boolean;
  users: { login: string; full_name?: string }[];
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAssignee = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const user = users.find(u => u.login === val);
    setForm(f => ({ ...f, assignee_login: val, assignee_name: user?.full_name || val }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Название *</label>
        <input value={form.title} onChange={set("title")} placeholder="Что нужно сделать?" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
      </div>
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Описание</label>
        <textarea value={form.description} onChange={set("description")} rows={3} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Исполнитель</label>
          <select value={form.assignee_login} onChange={handleAssignee} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink bg-white">
            <option value="">Не назначен</option>
            {users.map(u => (
              <option key={u.login} value={u.login}>{u.full_name || u.login}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Приоритет</label>
          <select value={form.priority} onChange={set("priority")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink bg-white">
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Дедлайн</label>
          <input type="date" value={form.deadline} onChange={set("deadline")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отмена</button>
        <button onClick={() => onSave(form)} disabled={loading || !form.title.trim()} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60">
          {loading ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
}

function TaskCard({ task, onStatusChange, onEdit, onDelete, isAdmin }: {
  task: Task;
  onStatusChange: (id: number, status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  isAdmin: boolean;
}) {
  const next = STATUS_NEXT[task.status];
  const overdue = isOverdue(task.deadline, task.status);

  return (
    <div className={`bg-white border rounded-2xl px-5 py-4 space-y-3 transition-colors ${task.status === "done" ? "border-beige-dark opacity-70" : "border-beige-dark hover:border-ink/30"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm text-ink ${task.status === "done" ? "line-through text-ink/50" : ""}`}>{task.title}</p>
          {task.description && <p className="text-xs text-ink/50 mt-1 line-clamp-2">{task.description}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isAdmin && (
            <>
              <button onClick={() => onEdit(task)} className="p-1.5 text-ink/30 hover:text-ink transition-colors"><Icon name="Pencil" size={13} /></button>
              <button onClick={() => onDelete(task.id)} className="p-1.5 text-ink/20 hover:text-red-400 transition-colors"><Icon name="Trash2" size={13} /></button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[task.status]}`}>{STATUS_LABEL[task.status]}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLOR[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
        {task.assignee_name && (
          <span className="text-xs text-ink/50 flex items-center gap-1">
            <Icon name="User" size={11} />{task.assignee_name}
          </span>
        )}
        {task.deadline && (
          <span className={`text-xs flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : "text-ink/40"}`}>
            <Icon name="Calendar" size={11} />{fmt(task.deadline)}{overdue && " — просрочена"}
          </span>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onStatusChange(task.id, next.status)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-beige-dark hover:border-ink text-ink/60 hover:text-ink transition-colors"
        >
          <Icon name={next.icon} size={12} />{next.label}
        </button>
      </div>
    </div>
  );
}

export default function AdminTasksTab({
  session,
  isAdmin,
  users,
}: {
  session: { login: string; full_name: string };
  isAdmin: boolean;
  users: { login: string; full_name?: string }[];
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [view, setView] = useState<"list" | "calendar">("list");

  const load = async () => {
    setLoading(true);
    const r = await fetch(API);
    const d = await r.json();
    setTasks(d.tasks || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createTask = async (form: typeof EMPTY_FORM) => {
    setSaving(true);
    await fetch(API, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...form, created_by: session.login }),
    });
    setSaving(false);
    setAdding(false);
    load();
  };

  const updateTask = async (form: typeof EMPTY_FORM) => {
    if (!editingTask) return;
    setSaving(true);
    await fetch(API, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", task_id: editingTask.id, ...form }),
    });
    setSaving(false);
    setEditingTask(null);
    load();
  };

  const changeStatus = async (id: number, status: Status) => {
    await fetch(API, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_status", task_id: id, status }),
    });
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status } : t));
  };

  const deleteTask = async (id: number) => {
    if (!confirm("Удалить задачу?")) return;
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", task_id: id }) });
    load();
  };

  const filtered = filterStatus === "all" ? tasks : tasks.filter(t => t.status === filterStatus);
  const counts = { all: tasks.length, new: tasks.filter(t => t.status === "new").length, in_progress: tasks.filter(t => t.status === "in_progress").length, done: tasks.filter(t => t.status === "done").length };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-cormorant text-ink text-2xl font-semibold">Задачи</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-beige-mid rounded-xl p-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === "list" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"}`}
            >
              <Icon name="List" size={14} /> Список
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === "calendar" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"}`}
            >
              <Icon name="CalendarDays" size={14} /> Календарь
            </button>
          </div>
          <button onClick={() => { setAdding(true); setEditingTask(null); }} className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors">
            <Icon name="Plus" size={16} /> Добавить задачу
          </button>
        </div>
      </div>

      {/* Форма создания */}
      {adding && (
        <div className="bg-white border border-beige-dark rounded-2xl p-6">
          <h3 className="font-semibold text-ink mb-4">Новая задача</h3>
          <TaskForm users={users} onSave={createTask} onCancel={() => setAdding(false)} loading={saving} />
        </div>
      )}

      {/* Форма редактирования */}
      {editingTask && (
        <div className="bg-white border border-ink/20 rounded-2xl p-6">
          <h3 className="font-semibold text-ink mb-4">Редактирование задачи</h3>
          <TaskForm
            users={users}
            initial={{ title: editingTask.title, description: editingTask.description || "", assignee_login: editingTask.assignee_login || "", assignee_name: editingTask.assignee_name || "", priority: editingTask.priority, deadline: editingTask.deadline?.slice(0, 10) || "" }}
            onSave={updateTask}
            onCancel={() => setEditingTask(null)}
            loading={saving}
          />
        </div>
      )}

      {view === "calendar" ? (
        loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <AdminTasksCalendar
            tasks={tasks}
            onStatusChange={changeStatus}
            onEdit={setEditingTask}
            onDelete={deleteTask}
            onCreateOnDate={(data) => createTask({ ...EMPTY_FORM, ...data })}
            isAdmin={isAdmin}
            users={users}
          />
        )
      ) : (
        <>
          {/* Фильтры */}
          <div className="flex items-center gap-1 bg-beige-mid rounded-xl p-1 w-fit flex-wrap">
            {([["all", "Все", "Layers"], ["new", "Новые", "Sparkles"], ["in_progress", "В работе", "Clock"], ["done", "Выполнены", "CheckCircle2"]] as [Status | "all", string, string][]).map(([s, label, icon]) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterStatus === s ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"}`}>
                <Icon name={icon} size={14} />
                {label}
                {counts[s] > 0 && <span className="text-xs opacity-60">{counts[s]}</span>}
              </button>
            ))}
          </div>

          {/* Список */}
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-ink/40">
              <Icon name="ClipboardList" size={40} className="mx-auto mb-3 opacity-30" />
              <p>{filterStatus === "all" ? "Задач пока нет" : "Нет задач с таким статусом"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={changeStatus}
                  onEdit={setEditingTask}
                  onDelete={deleteTask}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}