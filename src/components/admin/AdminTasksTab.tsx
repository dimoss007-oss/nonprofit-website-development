import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import AdminTasksCalendar from "./AdminTasksCalendar";
import TaskForm from "./TaskForm";
import TaskCard from "./TaskCard";
import { API, EMPTY_FORM, Task, Status } from "./taskTypes";

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
  const [view, setView] = useState<"list" | "calendar">("calendar");

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

  const filtered = filterStatus === "all" ? tasks : tasks.filter(t => t.status === filterStatus);
  const counts = {
    all: tasks.length,
    new: tasks.filter(t => t.status === "new").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-cormorant text-ink text-2xl font-semibold">Задачи</h2>
          {!isAdmin && <p className="text-xs text-ink/40 mt-0.5">Показаны только ваши задачи</p>}
        </div>
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
          {isAdmin && (
            <button onClick={() => { setAdding(true); setEditingTask(null); }} className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors">
              <Icon name="Plus" size={16} /> Добавить задачу
            </button>
          )}
        </div>
      </div>

      {adding && (
        <div className="bg-white border border-beige-dark rounded-2xl p-6">
          <h3 className="font-semibold text-ink mb-4">Новая задача</h3>
          <TaskForm users={users} onSave={createTask} onCancel={() => setAdding(false)} loading={saving} />
        </div>
      )}

      {editingTask && (
        <div className="bg-white border border-ink/20 rounded-2xl p-6">
          <h3 className="font-semibold text-ink mb-4">Редактирование задачи</h3>
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