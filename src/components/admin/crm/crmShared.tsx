export const API = "https://functions.poehali.dev/c30060e8-222e-48b5-823a-3f1a5b44fbd5";
export const UPLOAD_API = "https://functions.poehali.dev/8a6d9ba2-3c66-4604-bccf-68b50295e021";
export const CHILD_REPORTS_API = "https://functions.poehali.dev/5c7a56b7-8b5d-4577-aeb5-bc9c3f9aaad1";

export type Child = {
  id: number; last_name?: string; first_name: string; middle_name?: string; birth_date?: string; photo_url?: string;
  previous_education?: string; current_education?: string; extracurriculars?: string; current_age?: number;
  latest_avg_score?: number;
};
export type ChildWithPatient = Child & {
  patient_id: number; patient_last_name?: string; patient_first_name?: string; patient_middle_name?: string;
  patient_alias?: string; patient_discharge_date?: string;
};
export type Document = { id: number; file_name: string; file_url: string; file_type?: string; file_size?: number; uploaded_at: string };
export type RiskLevel = "none" | "attention" | "high" | null | undefined;
export type CareStage = "inpatient" | "posttreatment";
export type Patient = {
  id: number; last_name: string; first_name: string; middle_name?: string; alias?: string;
  birth_date?: string; address?: string; admission_date?: string; discharge_date?: string;
  case_description?: string; created_at: string; children_count?: number;
  passport_series?: string; passport_number?: string;
  passport_issued_date?: string; passport_issued_by?: string;
  photo_url?: string; risk_level?: RiskLevel; care_stage?: CareStage; care_stage_since?: string;
};
export type TaskStatus = "active" | "completed";
export type TaskType = "main" | "additional";
export type PatientTask = { id: number; patient_id: number; description: string; deadline?: string; status: TaskStatus; created_at: string; completed_at?: string; task_type: TaskType };
export type AiSummary = { id: number; patient_id: number; summary_text: string; created_at: string };
export type PatientFull = { patient: Patient; children: Child[]; documents: Document[]; latest_risk_level?: RiskLevel; shift_reports_count?: number; tasks?: PatientTask[]; advanced_local_summary?: string; saved_summaries?: AiSummary[] };

export type ChildScales = {
  scale_emotional: number | null; scale_stress: number | null; scale_sociability: number | null; scale_activity: number | null;
  scale_contact_mother: number | null; scale_contact_peers: number | null; scale_academic: number | null; scale_work: number | null;
  scale_attention: number | null; scale_discipline: number | null;
};
export type ChildDailyReport = ChildScales & {
  id: number; child_id: number; author?: string; report_date: string;
  identified_problems?: string; taken_actions?: string; results?: string; created_at: string;
};
export type ChildAiSummary = { id: number; child_id: number; summary_text: string; created_at: string };

export const CHILD_SCALE_META: { key: keyof ChildScales; label: string }[] = [
  { key: "scale_emotional", label: "Эмоциональный фон" },
  { key: "scale_stress", label: "Стрессоустойчивость" },
  { key: "scale_sociability", label: "Коммуникабельность" },
  { key: "scale_activity", label: "Активность" },
  { key: "scale_contact_mother", label: "Контакт с матерью" },
  { key: "scale_contact_peers", label: "Контакт со сверстниками" },
  { key: "scale_academic", label: "Успеваемость" },
  { key: "scale_work", label: "Трудоспособность" },
  { key: "scale_attention", label: "Внимательность" },
  { key: "scale_discipline", label: "Дисциплина" },
];

export const CARE_STAGE_META: Record<CareStage, { label: string }> = {
  inpatient: { label: "Стационар" },
  posttreatment: { label: "Амбулаторная программа" },
};

export const RISK_META: Record<string, { label: string; badge: string }> = {
  none: { label: "Норма", badge: "bg-green-100 text-green-700" },
  attention: { label: "Внимание", badge: "bg-amber-100 text-amber-700" },
  high: { label: "Высокий риск", badge: "bg-red-100 text-red-700" },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  if (!level || !RISK_META[level]) return null;
  const m = RISK_META[level];
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${m.badge}`}>{m.label}</span>;
}

export function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}
export function fmtDateTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function fmtSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export function stayDuration(admission?: string, discharge?: string): string | null {
  if (!admission) return null;
  const from = new Date(admission);
  const to = discharge ? new Date(discharge) : new Date();
  if (isNaN(from.getTime())) return null;
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  if (days < 0) { months--; days += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "год" : years < 5 ? "года" : "лет"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "месяц" : months < 5 ? "месяца" : "месяцев"}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"}`);
  return parts.join(" ");
}

export const EMPTY_FORM = { last_name: "", first_name: "", middle_name: "", alias: "", birth_date: "", address: "", admission_date: "", discharge_date: "", case_description: "", passport_series: "", passport_number: "", passport_issued_date: "", passport_issued_by: "" };

export function elapsedTime(createdAt: string, completedAt?: string | null): string {
  const from = new Date(createdAt);
  const to = completedAt ? new Date(completedAt) : new Date();
  if (isNaN(from.getTime())) return "—";
  let totalMinutes = Math.max(0, Math.floor((to.getTime() - from.getTime()) / 60000));
  const days = Math.floor(totalMinutes / (60 * 24));
  totalMinutes -= days * 60 * 24;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes - hours * 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "час" : hours < 5 ? "часа" : "часов"}`);
  if (parts.length === 0) parts.push(`${minutes} ${minutes === 1 ? "минута" : minutes < 5 ? "минуты" : "минут"}`);
  return parts.join(" ");
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}