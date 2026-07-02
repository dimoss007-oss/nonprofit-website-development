export const API = "https://functions.poehali.dev/6036e39a-3369-4ec5-a7b3-a4393528188a";
export const FILES_API = "https://functions.poehali.dev/8353edab-4af8-435b-8e9b-acb557f8bd89";

export type Priority = "low" | "medium" | "high";
export type Status = "new" | "in_progress" | "done";

export type Task = {
  id: number;
  title: string;
  description?: string;
  assignee_login?: string;
  assignee_name?: string;
  co_assignee_login?: string;
  co_assignee_name?: string;
  priority: Priority;
  status: Status;
  start_date?: string;
  deadline?: string;
  call_time?: string;
  created_by?: string;
  created_at: string;
};

export type TaskFile = {
  id: number;
  task_id: number;
  filename: string;
  url: string;
  size: number | null;
  uploaded_by: string | null;
  created_at: string;
};

export const PRIORITY_LABEL: Record<Priority, string> = { low: "Низкий", medium: "Средний", high: "Высокий" };
export const PRIORITY_COLOR: Record<Priority, string> = {
  low: "bg-beige-dark text-ink/60",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-red-100 text-red-600",
};

export const STATUS_LABEL: Record<Status, string> = { new: "Новая", in_progress: "В работе", done: "Выполнена" };
export const STATUS_COLOR: Record<Status, string> = {
  new: "bg-beige-dark text-ink/60",
  in_progress: "bg-yellow-100 text-yellow-700",
  done: "bg-green-100 text-green-700",
};
export const STATUS_NEXT: Record<Status, { status: Status; label: string; icon: string }> = {
  new: { status: "in_progress", label: "Взять в работу", icon: "Play" },
  in_progress: { status: "done", label: "Выполнена", icon: "Check" },
  done: { status: "new", label: "Вернуть", icon: "RotateCcw" },
};

export const EMPTY_FORM = {
  title: "", description: "",
  assignee_login: "", assignee_name: "",
  co_assignee_login: "", co_assignee_name: "",
  priority: "medium" as Priority,
  start_date: "", deadline: "", call_time: "",
};

export function fmt(d?: string) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ru-RU");
}

export function isOverdue(deadline?: string, status?: Status) {
  if (!deadline || status === "done") return false;
  return new Date(deadline) < new Date(new Date().toDateString());
}

export function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export function fileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "Image";
  if (["pdf", "doc", "docx"].includes(ext)) return "FileText";
  if (["xls", "xlsx", "csv"].includes(ext)) return "Sheet";
  if (["zip", "rar", "7z"].includes(ext)) return "Archive";
  return "File";
}