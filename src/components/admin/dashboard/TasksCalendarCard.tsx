import { useEffect, useState } from "react";
import DashboardCard, { StatusBadge } from "./DashboardCard";
import AdminTasksCalendar from "../AdminTasksCalendar";
import { API, EMPTY_FORM, Task, Status, isOverdue } from "../taskTypes";

interface Props {
  session: { login: string; full_name: string };
  users: { login: string; full_name?: string }[];
  onOpenTasks?: () => void;
}

export default function TasksCalendarCard({ session, users, onOpenTasks }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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
      <AdminTasksCalendar
        tasks={tasks}
        onStatusChange={changeStatus}
        onEdit={() => onOpenTasks?.()}
        onDelete={deleteTask}
        onCreateOnDate={createOnDate}
        isAdmin
        users={users}
      />
    </DashboardCard>
  );
}
