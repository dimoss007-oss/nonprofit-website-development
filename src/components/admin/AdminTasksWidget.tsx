import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/6036e39a-3369-4ec5-a7b3-a4393528188a";

type Priority = "low" | "medium" | "high";
type Status = "new" | "in_progress" | "done";

type Task = {
  id: number;
  title: string;
  assignee_login?: string;
  assignee_name?: string;
  co_assignee_login?: string;
  co_assignee_name?: string;
  priority: Priority;
  status: Status;
  deadline?: string;
};

const STATUS_COLOR: Record<Status, string> = {
  new: "bg-beige-dark text-ink/60",
  in_progress: "bg-yellow-100 text-yellow-700",
  done: "bg-green-100 text-green-700",
};
const STATUS_LABEL: Record<Status, string> = { new: "Новая", in_progress: "В работе", done: "Выполнена" };
const STATUS_NEXT: Record<Status, Status> = { new: "in_progress", in_progress: "done", done: "new" };
const PRIORITY_DOT: Record<Priority, string> = { low: "bg-ink/20", medium: "bg-blue-400", high: "bg-red-400" };
const PRIORITY_LABEL: Record<Priority, string> = { low: "Низкий", medium: "Средний", high: "Высокий" };

function isOverdue(deadline?: string, status?: Status) {
  if (!deadline || status === "done") return false;
  return new Date(deadline) < new Date(new Date().toDateString());
}

function fmt(d?: string) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ru-RU");
}

// ─── Инлайн-редактор задачи ────────────────────────────────────────────────
function TaskRow({ task, users, onUpdated }: {
  task: Task;
  users: { login: string; full_name?: string }[];
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    assignee_login: task.assignee_login || "",
    assignee_name: task.assignee_name || "",
    priority: task.priority,
    deadline: task.deadline?.slice(0, 10) || "",
  });
  const [saving, setSaving] = useState(false);

  const changeStatus = async () => {
    const next = STATUS_NEXT[task.status];
    await fetch(API, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_status", task_id: task.id, status: next }),
    });
    onUpdated();
  };

  const save = async () => {
    setSaving(true);
    const user = users.find(u => u.login === form.assignee_login);
    await fetch(API, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        task_id: task.id,
        title: form.title,
        assignee_login: form.assignee_login || null,
        assignee_name: user?.full_name || form.assignee_login || null,
        co_assignee_login: task.co_assignee_login || null,
        co_assignee_name: task.co_assignee_name || null,
        priority: form.priority,
        deadline: form.deadline || null,
        description: null,
        start_date: null,
      }),
    });
    setSaving(false);
    setEditing(false);
    onUpdated();
  };

  const deleteTask = async () => {
    if (!confirm("Удалить задачу?")) return;
    await fetch(API, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", task_id: task.id }),
    });
    onUpdated();
  };

  if (editing) {
    return (
      <div className="bg-beige/50 rounded-xl p-3 space-y-2 border border-beige-dark">
        <input
          autoFocus
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full border border-beige-dark rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-ink"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-ink/40 mb-0.5 block">Исполнитель</label>
            <select
              value={form.assignee_login}
              onChange={e => setForm(f => ({ ...f, assignee_login: e.target.value }))}
              className="w-full border border-beige-dark rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-ink bg-white"
            >
              <option value="">Не назначен</option>
              {users.map(u => (
                <option key={u.login} value={u.login}>{u.full_name || u.login}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-ink/40 mb-0.5 block">Приоритет</label>
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
              className="w-full border border-beige-dark rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-ink bg-white"
            >
              {(["low", "medium", "high"] as Priority[]).map(p => (
                <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-[10px] text-ink/40 mb-0.5 block">Дедлайн</label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              className="w-full border border-beige-dark rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-ink"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="bg-ink text-beige px-3 py-1 rounded-lg text-xs font-semibold disabled:opacity-50">
            {saving ? "..." : "Сохранить"}
          </button>
          <button onClick={() => setEditing(false)} className="text-xs text-ink/40 hover:text-ink">Отмена</button>
          <button onClick={deleteTask} className="ml-auto text-xs text-ink/20 hover:text-red-400 transition-colors">
            <Icon name="Trash2" size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 group">
      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-snug truncate ${task.status === "done" ? "line-through text-ink/30" : "text-ink"}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <button
            onClick={changeStatus}
            className={`text-[10px] px-1.5 py-0.5 rounded-full hover:opacity-70 transition-opacity ${STATUS_COLOR[task.status]}`}
            title="Сменить статус"
          >
            {STATUS_LABEL[task.status]}
          </button>
          {task.deadline && (
            <span className={`text-[10px] ${isOverdue(task.deadline, task.status) ? "text-red-500 font-medium" : "text-ink/30"}`}>
              {fmt(task.deadline)}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-1 text-ink/20 hover:text-ink transition-all flex-shrink-0"
        title="Редактировать"
      >
        <Icon name="Pencil" size={11} />
      </button>
    </div>
  );
}

export default function AdminTasksWidget({
  onGoToTasks,
  users,
}: {
  onGoToTasks: () => void;
  users: { login: string; full_name?: string }[];
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`${API}?is_admin=1`)
      .then(r => r.json())
      .then(d => setTasks((d.tasks || []).filter((t: Task) => t.status !== "done")))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const byUser = users.map(u => {
    const myTasks = tasks.filter(t =>
      t.assignee_login === u.login || t.co_assignee_login === u.login
    );
    return { ...u, tasks: myTasks };
  }).filter(u => u.tasks.length > 0);

  const unassigned = tasks.filter(t => !t.assignee_login && !t.co_assignee_login);

  const overdue = tasks.filter(t => isOverdue(t.deadline, t.status)).length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const newTasks = tasks.filter(t => t.status === "new").length;

  if (loading) return (
    <div className="bg-white rounded-2xl border border-beige-dark p-5">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-beige-dark rounded w-1/3" />
        <div className="h-3 bg-beige-dark rounded w-1/2" />
        <div className="h-3 bg-beige-dark rounded w-2/3" />
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-beige-dark overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-ink text-sm">Задачи сотрудников</h3>
          <p className="text-xs text-ink/40 mt-0.5">Активные задачи</p>
        </div>
        <button onClick={onGoToTasks} className="text-xs text-ink/40 hover:text-ink flex items-center gap-1 transition-colors">
          Все задачи <Icon name="ArrowRight" size={12} />
        </button>
      </div>

      <div className="px-5 pb-3 flex gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-xs text-ink/60">{inProgress} в работе</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-beige-dark border border-ink/20" />
          <span className="text-xs text-ink/60">{newTasks} новых</span>
        </div>
        {overdue > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-xs text-red-500 font-medium">{overdue} просрочено</span>
          </div>
        )}
      </div>

      <div className="divide-y divide-beige-dark/60">
        {byUser.length === 0 && unassigned.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-ink/30">Активных задач нет</div>
        ) : (
          <>
            {byUser.map(u => (
              <div key={u.login} className="px-5 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-violet-600">{(u.full_name || u.login).charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-xs font-semibold text-ink">{u.full_name || u.login}</span>
                  <span className="text-xs text-ink/30">{u.tasks.length} {u.tasks.length === 1 ? "задача" : u.tasks.length < 5 ? "задачи" : "задач"}</span>
                </div>
                <div className="space-y-1.5 pl-8">
                  {u.tasks.map(t => (
                    <TaskRow key={t.id} task={t} users={users} onUpdated={load} />
                  ))}
                </div>
              </div>
            ))}
            {unassigned.length > 0 && (
              <div className="px-5 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-beige-dark flex items-center justify-center flex-shrink-0">
                    <Icon name="HelpCircle" size={12} className="text-ink/30" />
                  </div>
                  <span className="text-xs font-semibold text-ink/50">Не назначены</span>
                  <span className="text-xs text-ink/30">{unassigned.length}</span>
                </div>
                <div className="space-y-1.5 pl-8">
                  {unassigned.map(t => (
                    <TaskRow key={t.id} task={t} users={users} onUpdated={load} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-5 py-3 border-t border-beige-dark/60">
        <button onClick={onGoToTasks} className="w-full text-xs text-ink/40 hover:text-ink transition-colors py-1">
          Перейти к задачам →
        </button>
      </div>
    </div>
  );
}
