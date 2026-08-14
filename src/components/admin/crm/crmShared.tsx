export const API = "https://functions.poehali.dev/c30060e8-222e-48b5-823a-3f1a5b44fbd5";
export const UPLOAD_API = "https://functions.poehali.dev/8a6d9ba2-3c66-4604-bccf-68b50295e021";

export type Child = { id: number; last_name?: string; first_name: string; middle_name?: string; birth_date?: string; photo_url?: string };
export type Document = { id: number; file_name: string; file_url: string; file_type?: string; file_size?: number; uploaded_at: string };
export type RiskLevel = "none" | "attention" | "high" | null | undefined;
export type Patient = {
  id: number; last_name: string; first_name: string; middle_name?: string; alias?: string;
  birth_date?: string; address?: string; admission_date?: string; discharge_date?: string;
  case_description?: string; created_at: string; children_count?: number;
  passport_series?: string; passport_number?: string;
  passport_issued_date?: string; passport_issued_by?: string;
  photo_url?: string; risk_level?: RiskLevel;
};
export type PatientFull = { patient: Patient; children: Child[]; documents: Document[]; latest_risk_level?: RiskLevel };

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

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}
