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
const PRIORITY_DOT: Record<Priority, string> = { low: "bg-ink/20", medium: "bg-blue-400", high: "bg-red-400" };

function isOverdue(deadline?: string, status?: Status) {
  if (!deadline || status === "done") return false;
  return new Date(deadline) < new Date(new Date().toDateString());
}

function fmt(d?: string) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ru-RU");
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

  useEffect(() => {
    fetch(`${API}?is_admin=1`)
      .then(r => r.json())
      .then(d => setTasks((d.tasks || []).filter((t: Task) => t.status !== "done")))
      .finally(() => setLoading(false));
  }, []);

  // Группируем по сотруднику
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

      {/* Счётчики */}
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
                    <div key={t.id} className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[t.priority]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-ink leading-snug truncate">{t.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLOR[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                          {t.deadline && (
                            <span className={`text-[10px] ${isOverdue(t.deadline, t.status) ? "text-red-500 font-medium" : "text-ink/30"}`}>
                              {fmt(t.deadline)}
                            </span>
                          )}
                          {t.co_assignee_login === u.login && (
                            <span className="text-[10px] text-ink/30">соисп.</span>
                          )}
                        </div>
                      </div>
                    </div>
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
                    <div key={t.id} className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[t.priority]}`} />
                      <p className="text-xs text-ink/60 truncate">{t.title}</p>
                    </div>
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
