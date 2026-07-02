import Icon from "@/components/ui/icon";
import TaskFilesSection from "./TaskFilesSection";
import {
  Task, Status,
  STATUS_COLOR, STATUS_LABEL, STATUS_NEXT,
  PRIORITY_COLOR, PRIORITY_LABEL,
  fmt, isOverdue,
} from "./taskTypes";

export default function TaskCard({ task, onStatusChange, onEdit, onDelete, isAdmin, currentLogin }: {
  task: Task;
  onStatusChange: (id: number, status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  isAdmin: boolean;
  currentLogin: string;
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
        {task.co_assignee_name && (
          <span className="text-xs text-ink/40 flex items-center gap-1">
            <Icon name="Users" size={11} />{task.co_assignee_name}
          </span>
        )}
        {(task.start_date || task.deadline) && (
          <span className={`text-xs flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : "text-ink/40"}`}>
            <Icon name="CalendarRange" size={11} />
            {task.start_date ? fmt(task.start_date) : "—"}
            {" → "}
            {task.deadline ? fmt(task.deadline) : "—"}
            {overdue && " · просрочена"}
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

      <TaskFilesSection taskId={task.id} uploaderLogin={currentLogin} />
    </div>
  );
}
