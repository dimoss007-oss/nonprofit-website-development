import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import AdminTasksCalendar from "./AdminTasksCalendar";
import TaskForm from "./TaskForm";
import TaskCard from "./TaskCard";
import { API, EMPTY_FORM, Task, Status, isOverdue } from "./taskTypes";

export default function AdminTasksTab({
  session,
  isAdmin,
  users,
  onGoToLink,
}: {
  session: { login: string; full_name: string };
  isAdmin: boolean;
  users: { login: string; full_name?: string }[];
  onGoToLink?: (task: Task) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const load = async () => {
    setLoading(true);
    const loginParam = !isAdmin ? `&login=${session.login}&is_admin=0` : "&is_admin=1";
    const r = await fetch(`${API}?${loginParam}`);
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

  const q = search.trim().toLowerCase();
  const matches = (t: Task) => !q || `${t.title} ${t.description ?? ""} ${t.assignee_name ?? ""} ${t.co_assignee_name ?? ""}`.toLowerCase().includes(q);
  const searched = tasks.filter(matches);
  const filtered = searched
    .filter(t => filterStatus === "all" || t.status === filterStatus)
    .filter(t => !onlyOverdue || isOverdue(t.deadline, t.status));
  const counts = {
    all: tasks.length,
    new: tasks.filter(t => t.status === "new").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
  };
  const overdueCount = tasks.filter(t => isOverdue(t.deadline, t.status)).length;

  const pickStatus = (s: Status | "all") => { setFilterStatus(s); setOnlyOverdue(false); };
  const pickOverdue = () => { setFilterStatus("all"); setOnlyOverdue(true); };

  const metrics: { key: string; value: number; label: string; color: string; border: string; hover: string; active: boolean; onClick: () => void }[] = [
    { key: "new", value: counts.new, label: "Новые", color: "text-blue-600", border: "border-blue-100", hover: "hover:bg-blue-50", active: !onlyOverdue && filterStatus === "new", onClick: () => pickStatus("new") },
    { key: "in_progress", value: counts.in_progress, label: "В работе", color: "text-amber-600", border: "border-amber-100", hover: "hover:bg-amber-50", active: !onlyOverdue && filterStatus === "in_progress", onClick: () => pickStatus("in_progress") },
    { key: "done", value: counts.done, label: "Выполнены", color: "text-green-600", border: "border-green-100", hover: "hover:bg-green-50", active: !onlyOverdue && filterStatus === "done", onClick: () => pickStatus("done") },
    { key: "overdue", value: overdueCount, label: "Просрочены", color: overdueCount > 0 ? "text-red-500" : "text-slate-700", border: overdueCount > 0 ? "border-red-100" : "border-slate-100", hover: "hover:bg-red-50", active: onlyOverdue, onClick: pickOverdue },
    { key: "all", value: counts.all, label: "Всего задач", color: "text-slate-800", border: "border-slate-100", hover: "hover:bg-slate-50", active: !onlyOverdue && filterStatus === "all", onClick: () => pickStatus("all") },
  ];

  return (
    <div className="space-y-6 font-inter">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Задачи</h1>
          <p className="text-sm text-slate-500 mt-1">{isAdmin ? "Поручения сотрудникам и контроль сроков" : "Показаны только ваши задачи"}</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setAdding(true); setEditingTask(null); }} className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium flex items-center gap-2 shadow-sm">
            <Icon name="Plus" size={16} /> Добавить задачу
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metrics.map(m => (
          <button key={m.key} onClick={m.onClick} className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center transition ${m.border} ${m.hover} ${m.active ? "ring-2 ring-offset-1 ring-brand-500" : ""} ${m.key === "all" ? "col-span-2 md:col-span-1" : ""}`}>
            <span className={`text-2xl font-bold ${m.color}`}>{m.value}</span>
            <span className="text-xs text-slate-500 font-medium mt-1">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center flex-1 min-w-[220px] bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:border-indigo-300 transition">
          <Icon name="Search" size={15} className="text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по названию, описанию или исполнителю..." className="bg-transparent border-none outline-none text-sm text-slate-700 w-full ml-3 placeholder:text-slate-400" />
        </div>
      </div>

      {adding && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Новая задача</h3>
          <TaskForm users={users} onSave={createTask} onCancel={() => setAdding(false)} loading={saving} />
        </div>
      )}

      {editingTask && (
        <div className="bg-white border border-slate-300 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Редактирование задачи</h3>
          <TaskForm
            users={users}
            initial={{
              title: editingTask.title,
              description: editingTask.description || "",
              assignee_login: editingTask.assignee_login || "",
              assignee_name: editingTask.assignee_name || "",
              co_assignee_login: editingTask.co_assignee_login || "",
              co_assignee_name: editingTask.co_assignee_name || "",
              priority: editingTask.priority,
              start_date: editingTask.start_date?.slice(0, 10) || "",
              deadline: editingTask.deadline?.slice(0, 10) || "",
              call_time: editingTask.call_time || "",
            }}
            onSave={updateTask}
            onCancel={() => setEditingTask(null)}
            loading={saving}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <AdminTasksCalendar
            tasks={searched}
            onStatusChange={changeStatus}
            onEdit={setEditingTask}
            onDelete={deleteTask}
            onCreateOnDate={(data) => createTask({ ...EMPTY_FORM, ...data })}
            onGoToLink={onGoToLink}
            isAdmin={isAdmin}
            users={users}
          />
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Icon name="ClipboardList" size={40} className="mx-auto mb-3 opacity-30" />
              <p>{search || onlyOverdue || filterStatus !== "all" ? "Нет задач по этим условиям" : "Задач пока нет"}</p>
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
                  onGoToLink={onGoToLink}
                  isAdmin={isAdmin}
                  currentLogin={session.login}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}