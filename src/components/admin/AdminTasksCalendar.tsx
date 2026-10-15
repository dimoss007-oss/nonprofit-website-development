import { useState } from "react";
import Icon from "@/components/ui/icon";

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
  link_type?: string | null;
  link_id?: number | null;
  created_by?: string;
  created_at: string;
};

const LINK_LABELS: Record<string, { label: string; icon: string }> = {
  gov_agency: { label: "Открыть госорган", icon: "Landmark" },
  fundraising_org: { label: "Открыть организацию", icon: "Building2" },
  fundraising_person: { label: "Открыть жертвователя", icon: "UserHeart" },
};

const PRIORITY_DOT: Record<Priority, string> = {
  low: "bg-slate-100",
  medium: "bg-blue-400",
  high: "bg-red-400",
};

const STATUS_COLOR: Record<Status, string> = {
  new: "border-l-slate-300",
  in_progress: "border-l-yellow-400",
  done: "border-l-green-400",
};

const MONTHS_RU = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const DAYS_RU = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const STATUS_NEXT: Record<Status, { status: Status; label: string; icon: string }> = {
  new: { status: "in_progress", label: "Взять в работу", icon: "Play" },
  in_progress: { status: "done", label: "Выполнена", icon: "Check" },
  done: { status: "new", label: "Вернуть", icon: "RotateCcw" },
};
const STATUS_LABEL: Record<Status, string> = { new: "Новая", in_progress: "В работе", done: "Выполнена" };

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function toYMD(date: Date) {
  return date.toISOString().slice(0, 10);
}

const inp = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white";

// ─── Форма быстрого добавления задачи ─────────────────────────────────────
function QuickAddForm({
  date,
  users,
  onSave,
  onCancel,
}: {
  date: string;
  users: { login: string; full_name?: string }[];
  onSave: (data: { title: string; priority: Priority; assignee_login: string; assignee_name: string; deadline: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [assignee, setAssignee] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const user = users.find(u => u.login === assignee);
    await onSave({ title, priority, assignee_login: assignee, assignee_name: user?.full_name || assignee, deadline: date });
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Новая задача</p>
      <input
        required
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Что нужно сделать?"
        className={inp}
      />
      <div className="grid grid-cols-2 gap-2">
        <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className={inp}>
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
        <select value={assignee} onChange={e => setAssignee(e.target.value)} className={inp}>
          <option value="">Не назначен</option>
          <option value="__all__">Все сотрудники</option>
          {users.map(u => <option key={u.login} value={u.login}>{u.full_name || u.login}</option>)}
        </select>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors">Отмена</button>
        <button type="submit" disabled={saving || !title.trim()} className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-slate-100 transition-colors disabled:opacity-60">
          {saving ? "..." : "Сохранить"}
        </button>
      </div>
    </form>
  );
}

// ─── Модальное окно дня ────────────────────────────────────────────────────
function DayModal({
  date,
  tasks,
  users,
  isAdmin,
  onClose,
  onStatusChange,
  onEdit,
  onDelete,
  onCreateOnDate,
  onGoToLink,
}: {
  date: string;
  tasks: Task[];
  users: { login: string; full_name?: string }[];
  isAdmin: boolean;
  onClose: () => void;
  onStatusChange: (id: number, status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onCreateOnDate: (data: { title: string; priority: Priority; assignee_login: string; assignee_name: string; deadline: string }) => Promise<void>;
  onGoToLink?: (task: Task) => void;
}) {
  const [adding, setAdding] = useState(false);
  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  const handleSave = async (data: Parameters<typeof onCreateOnDate>[0]) => {
    await onCreateOnDate(data);
    setAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-100 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <p className="font-semibold text-slate-800">{dateLabel}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {tasks.length === 0 ? "Нет задач" : `${tasks.length} ${tasks.length === 1 ? "задача" : tasks.length < 5 ? "задачи" : "задач"}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && !adding && (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Icon name="Plus" size={12} /> Добавить
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-300 hover:text-slate-800 transition-colors">
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {adding && (
            <QuickAddForm
              date={date}
              users={users}
              onSave={handleSave}
              onCancel={() => setAdding(false)}
            />
          )}

          {tasks.length === 0 && !adding && (
            <div className="text-center py-8 text-slate-300">
              <Icon name="CalendarDays" size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Задач на этот день нет</p>
              {isAdmin && (
                <button onClick={() => setAdding(true)} className="mt-3 text-xs text-slate-400 hover:text-slate-800 underline underline-offset-2 transition-colors">
                  Добавить первую задачу
                </button>
              )}
            </div>
          )}

          {tasks.map(t => (
            <div key={t.id} className={`border-l-2 pl-3 py-2.5 pr-2 rounded-r-xl bg-slate-50 ${STATUS_COLOR[t.status]}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[t.priority]}`} />
                    <p className={`text-sm font-medium text-slate-800 leading-snug ${t.status === "done" ? "line-through text-slate-400" : ""}`}>{t.title}</p>
                  </div>
                  {t.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 pl-3">{t.description}</p>}
                  <div className="flex items-center gap-2 mt-1 pl-3 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      t.status === "new" ? "bg-slate-100 text-slate-500"
                      : t.status === "in_progress" ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                    }`}>{STATUS_LABEL[t.status]}</span>
                    {t.assignee_name && (
                      <span className="text-xs text-slate-400 flex items-center gap-0.5">
                        <Icon name="User" size={10} />{t.assignee_name}
                      </span>
                    )}
                  </div>
                  {t.link_type && LINK_LABELS[t.link_type] && onGoToLink && (
                    <button
                      onClick={() => { onGoToLink(t); onClose(); }}
                      className="mt-1.5 ml-3 flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-slate-200 hover:border-indigo-300 text-slate-400 hover:text-slate-800 transition-colors"
                    >
                      <Icon name={LINK_LABELS[t.link_type].icon} size={11} />{LINK_LABELS[t.link_type].label}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => onStatusChange(t.id, STATUS_NEXT[t.status].status)}
                    className="p-1.5 text-slate-300 hover:text-slate-800 transition-colors"
                    title={STATUS_NEXT[t.status].label}
                  >
                    <Icon name={STATUS_NEXT[t.status].icon} size={13} />
                  </button>
                  {isAdmin && (
                    <>
                      <button onClick={() => { onEdit(t); onClose(); }} className="p-1.5 text-slate-300 hover:text-slate-800 transition-colors">
                        <Icon name="Pencil" size={13} />
                      </button>
                      <button onClick={() => onDelete(t.id)} className="p-1.5 text-slate-300 hover:text-red-400 transition-colors">
                        <Icon name="Trash2" size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Основной компонент ────────────────────────────────────────────────────
export default function AdminTasksCalendar({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  onCreateOnDate,
  onGoToLink,
  isAdmin,
  users,
}: {
  tasks: Task[];
  onStatusChange: (id: number, status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onCreateOnDate: (data: { title: string; priority: Priority; assignee_login: string; assignee_name: string; deadline: string }) => Promise<void>;
  onGoToLink?: (task: Task) => void;
  isAdmin: boolean;
  users: { login: string; full_name?: string }[];
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [modalDate, setModalDate] = useState<string | null>(null);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const todayYMD = toYMD(today);

  const tasksByDay: Record<string, Task[]> = {};
  for (const t of tasks) {
    if (!t.deadline) continue;
    const key = t.deadline.slice(0, 10);
    if (!tasksByDay[key]) tasksByDay[key] = [];
    tasksByDay[key].push(t);
  }

  const noDeadline = tasks.filter(t => !t.deadline && t.status !== "done");
  const modalTasks = modalDate ? (tasksByDay[modalDate] || []) : [];

  const handleCreateOnDate = async (data: Parameters<typeof onCreateOnDate>[0]) => {
    await onCreateOnDate(data);
  };

  return (
    <div className="space-y-4">
      {/* Навигация */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors">
          <Icon name="ChevronLeft" size={18} />
        </button>
        <h3 className="font-semibold text-slate-800 text-base">{MONTHS_RU[month]} {year}</h3>
        <button onClick={nextMonth} className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors">
          <Icon name="ChevronRight" size={18} />
        </button>
      </div>

      {/* Сетка */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200">
          {DAYS_RU.map(d => (
            <div key={d} className={`text-center text-xs font-medium py-2 ${d === "Сб" || d === "Вс" ? "text-slate-300" : "text-slate-400"}`}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[72px] border-b border-r border-slate-200 bg-slate-50" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const ymd = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayTasks = tasksByDay[ymd] || [];
            const isToday = ymd === todayYMD;
            const isSelected = ymd === modalDate;
            const col = (firstDow + i) % 7;
            const isWeekend = col === 5 || col === 6;
            const hasOverdue = dayTasks.some(t => t.status !== "done" && ymd < todayYMD);

            return (
              <div
                key={ymd}
                onClick={() => setModalDate(ymd)}
                className={`min-h-[72px] border-b border-r border-slate-200 p-1.5 cursor-pointer transition-colors
                  ${isSelected ? "bg-slate-100 ring-1 ring-inset ring-ink/20" : "hover:bg-slate-50"}
                  ${isWeekend ? "bg-slate-50" : ""}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors
                    ${isToday ? "bg-indigo-600 text-white" : isWeekend ? "text-slate-300" : "text-slate-600"}
                  `}>
                    {day}
                  </span>
                  {hasOverdue && <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map(t => (
                    <div key={t.id} className={`flex items-center gap-1 border-l-2 pl-1 rounded-r ${STATUS_COLOR[t.status]} ${t.status === "done" ? "opacity-50" : ""}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[t.priority]}`} />
                      <p className={`text-[10px] leading-tight truncate text-slate-600 ${t.status === "done" ? "line-through" : ""}`}>{t.title}</p>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="text-[10px] text-slate-400 pl-1">+{dayTasks.length - 3} ещё</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Задачи без дедлайна */}
      {noDeadline.length > 0 && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Без дедлайна ({noDeadline.length})</p>
          <div className="space-y-1.5">
            {noDeadline.map(t => (
              <div key={t.id} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[t.priority]}`} />
                <p className="text-sm text-slate-600 flex-1 truncate">{t.title}</p>
                {t.assignee_name && <span className="text-xs text-slate-400 flex-shrink-0">{t.assignee_name}</span>}
                {isAdmin && (
                  <button onClick={() => onEdit(t)} className="p-1 text-slate-300 hover:text-slate-800 transition-colors flex-shrink-0">
                    <Icon name="Pencil" size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Модальное окно дня */}
      {modalDate && (
        <DayModal
          date={modalDate}
          tasks={modalTasks}
          users={users}
          isAdmin={isAdmin}
          onClose={() => setModalDate(null)}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onCreateOnDate={handleCreateOnDate}
          onGoToLink={onGoToLink}
        />
      )}
    </div>
  );
}