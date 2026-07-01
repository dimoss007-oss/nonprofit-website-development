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
  created_by?: string;
  created_at: string;
};

const PRIORITY_DOT: Record<Priority, string> = {
  low: "bg-ink/30",
  medium: "bg-blue-400",
  high: "bg-red-400",
};

const STATUS_COLOR: Record<Status, string> = {
  new: "border-l-beige-dark",
  in_progress: "border-l-yellow-400",
  done: "border-l-green-400",
};

const MONTHS_RU = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const DAYS_RU = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

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

export default function AdminTasksCalendar({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  isAdmin,
}: {
  tasks: Task[];
  onStatusChange: (id: number, status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  isAdmin: boolean;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

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

  // map: "YYYY-MM-DD" → Task[]
  const tasksByDay: Record<string, Task[]> = {};
  for (const t of tasks) {
    if (!t.deadline) continue;
    const key = t.deadline.slice(0, 10);
    if (!tasksByDay[key]) tasksByDay[key] = [];
    tasksByDay[key].push(t);
  }

  const selectedTasks = selected ? (tasksByDay[selected] || []) : [];

  const STATUS_NEXT: Record<Status, { status: Status; label: string; icon: string }> = {
    new: { status: "in_progress", label: "Взять в работу", icon: "Play" },
    in_progress: { status: "done", label: "Выполнена", icon: "Check" },
    done: { status: "new", label: "Вернуть", icon: "RotateCcw" },
  };

  const STATUS_LABEL: Record<Status, string> = { new: "Новая", in_progress: "В работе", done: "Выполнена" };

  // tasks without deadline
  const noDeadline = tasks.filter(t => !t.deadline && t.status !== "done");

  return (
    <div className="space-y-4">
      {/* Навигация */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg text-ink/40 hover:text-ink hover:bg-beige-mid transition-colors">
          <Icon name="ChevronLeft" size={18} />
        </button>
        <h3 className="font-semibold text-ink text-base">
          {MONTHS_RU[month]} {year}
        </h3>
        <button onClick={nextMonth} className="p-2 rounded-lg text-ink/40 hover:text-ink hover:bg-beige-mid transition-colors">
          <Icon name="ChevronRight" size={18} />
        </button>
      </div>

      {/* Сетка */}
      <div className="bg-white rounded-2xl border border-beige-dark overflow-hidden">
        {/* Дни недели */}
        <div className="grid grid-cols-7 border-b border-beige-dark">
          {DAYS_RU.map(d => (
            <div key={d} className={`text-center text-xs font-medium py-2 ${d === "Сб" || d === "Вс" ? "text-ink/30" : "text-ink/50"}`}>{d}</div>
          ))}
        </div>

        {/* Ячейки */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[72px] border-b border-r border-beige-dark/50 bg-beige/20" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const ymd = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayTasks = tasksByDay[ymd] || [];
            const isToday = ymd === todayYMD;
            const isSelected = ymd === selected;
            const col = (firstDow + i) % 7;
            const isWeekend = col === 5 || col === 6;
            const hasOverdue = dayTasks.some(t => t.status !== "done" && ymd < todayYMD);

            return (
              <div
                key={ymd}
                onClick={() => setSelected(isSelected ? null : ymd)}
                className={`min-h-[72px] border-b border-r border-beige-dark/50 p-1.5 cursor-pointer transition-colors
                  ${isSelected ? "bg-ink/5 ring-1 ring-inset ring-ink/20" : "hover:bg-beige/40"}
                  ${isWeekend ? "bg-beige/10" : ""}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? "bg-ink text-beige" : isWeekend ? "text-ink/30" : "text-ink/70"}
                  `}>
                    {day}
                  </span>
                  {hasOverdue && <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />}
                </div>

                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map(t => (
                    <div key={t.id} className={`flex items-center gap-1 border-l-2 pl-1 rounded-r ${STATUS_COLOR[t.status]} ${t.status === "done" ? "opacity-50" : ""}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[t.priority]}`} />
                      <p className={`text-[10px] leading-tight truncate text-ink/70 ${t.status === "done" ? "line-through" : ""}`}>{t.title}</p>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="text-[10px] text-ink/40 pl-1">+{dayTasks.length - 3} ещё</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Панель выбранного дня */}
      {selected && (
        <div className="bg-white rounded-2xl border border-beige-dark p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">
              {new Date(selected + "T00:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <button onClick={() => setSelected(null)} className="text-ink/30 hover:text-ink transition-colors">
              <Icon name="X" size={14} />
            </button>
          </div>

          {selectedTasks.length === 0 ? (
            <p className="text-sm text-ink/40 py-2">Задач на этот день нет</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map(t => (
                <div key={t.id} className={`border-l-2 pl-3 py-2 rounded-r-xl bg-beige/30 ${STATUS_COLOR[t.status]}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium text-ink ${t.status === "done" ? "line-through text-ink/40" : ""}`}>{t.title}</p>
                      {t.description && <p className="text-xs text-ink/50 mt-0.5 line-clamp-2">{t.description}</p>}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-ink/40">{STATUS_LABEL[t.status]}</span>
                        {t.assignee_name && <span className="text-xs text-ink/40 flex items-center gap-0.5"><Icon name="User" size={10} />{t.assignee_name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onStatusChange(t.id, STATUS_NEXT[t.status].status)}
                        className="p-1.5 text-ink/30 hover:text-ink transition-colors"
                        title={STATUS_NEXT[t.status].label}
                      >
                        <Icon name={STATUS_NEXT[t.status].icon} size={13} />
                      </button>
                      {isAdmin && (
                        <>
                          <button onClick={() => onEdit(t)} className="p-1.5 text-ink/30 hover:text-ink transition-colors"><Icon name="Pencil" size={13} /></button>
                          <button onClick={() => onDelete(t.id)} className="p-1.5 text-ink/20 hover:text-red-400 transition-colors"><Icon name="Trash2" size={13} /></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Задачи без дедлайна */}
      {noDeadline.length > 0 && (
        <div className="bg-beige/40 rounded-2xl border border-beige-dark p-4 space-y-2">
          <p className="text-xs font-medium text-ink/50 uppercase tracking-wider">Без дедлайна ({noDeadline.length})</p>
          <div className="space-y-1.5">
            {noDeadline.map(t => (
              <div key={t.id} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[t.priority]}`} />
                <p className="text-sm text-ink/70 flex-1 truncate">{t.title}</p>
                {t.assignee_name && <span className="text-xs text-ink/40 flex-shrink-0">{t.assignee_name}</span>}
                {isAdmin && (
                  <button onClick={() => onEdit(t)} className="p-1 text-ink/20 hover:text-ink transition-colors flex-shrink-0">
                    <Icon name="Pencil" size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
