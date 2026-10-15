import { useEffect, useState } from "react";
import DashboardCard, { StatusBadge } from "./DashboardCard";
import AdminTasksCalendar from "../AdminTasksCalendar";
import TaskForm from "../TaskForm";
import { API, EMPTY_FORM, Task, Status, isOverdue } from "../taskTypes";

interface Props {
  session: { login: string; full_name: string };
  users: { login: string; full_name?: string }[];
}

export default function TasksCalendarCard({ session, users }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const r = await fetch(`${API}?&is_admin=1`);
    const d = await r.json();
    setTasks(d.tasks || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const post = (body: object) =>
    fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  const changeStatus = async (id: number, status: Status) => {
    await post({ action: "update_status", task_id: id, status });
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status } : t));
  };

  const deleteTask = async (id: number) => {
    if (!confirm("Удалить задачу?")) return;
    await post({ action: "delete", task_id: id });
    load();
  };

  const createOnDate = async (data: Partial<typeof EMPTY_FORM>) => {
    await post({ action: "create", ...EMPTY_FORM, ...data, created_by: session.login });
    load();
  };

  const updateTask = async (form: typeof EMPTY_FORM) => {
    if (!editing) return;
    setSaving(true);
    await post({ action: "update", task_id: editing.id, ...form });
    setSaving(false);
    setEditing(null);
    load();
  };

  const overdueCount = tasks.filter(t => isOverdue(t.deadline, t.status)).length;

  return (
    <DashboardCard
      title="Календарь задач"
      icon="CalendarDays"
      iconClass="bg-violet-50 text-violet-600"
      loading={loading}
      className="lg:col-span-2"
      badge={overdueCount > 0
        ? <StatusBadge tone="bad">Просрочено: {overdueCount}</StatusBadge>
        : <StatusBadge tone="good">Всё в срок</StatusBadge>}
    >
      {editing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-slate-900/30" />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 mb-4">Редактирование задачи</h3>
            <TaskForm
              users={users}
              initial={{
                title: editing.title,
                description: editing.description || "",
                assignee_login: editing.assignee_login || "",
                assignee_name: editing.assignee_name || "",
                co_assignee_login: editing.co_assignee_login || "",
                co_assignee_name: editing.co_assignee_name || "",
                priority: editing.priority,
                start_date: editing.start_date?.slice(0, 10) || "",
                deadline: editing.deadline?.slice(0, 10) || "",
                call_time: editing.call_time || "",
              }}
              onSave={updateTask}
              onCancel={() => setEditing(null)}
              loading={saving}
            />
          </div>
        </div>
      )}
      <AdminTasksCalendar
        tasks={tasks}
        onStatusChange={changeStatus}
        onEdit={setEditing}
        onDelete={deleteTask}
        onCreateOnDate={createOnDate}
        isAdmin
        users={users}
      />
    </DashboardCard>
  );
}
