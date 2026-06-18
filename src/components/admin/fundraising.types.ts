export type DonorType = "org" | "person";
export type Section = "stats" | "orgs" | "persons" | "goals" | "funnel" | "qr";
export type Status = "active" | "inactive" | "potential" | "lost";
export type DonorCategory = "donation" | "grant" | "subsidy" | "targeted" | "corporate" | "fund";
export type DonationType = "money" | "goods" | "services" | "volunteer";

export interface Stats {
  orgs_total: number; orgs_active: number;
  persons_total: number; persons_active: number;
  donations_total: number; donations_count: number;
  donations_year: number; donations_month: number;
}

export interface Org {
  id: number; name: string; phone: string; email: string;
  website: string; manager: string; status: Status;
  donor_category: DonorCategory;
  inn: string; contact_person: string;
  notes: string; created_at: string;
  total_donated: number; donations_count: number;
}

export interface Person {
  id: number; full_name: string; phone: string; email: string;
  source: string; status: Status;
  donor_category: DonorCategory;
  notes: string; created_at: string;
  total_donated: number; donations_count: number;
}

export interface Donation {
  id: number; donor_type: DonorType; donor_id: number;
  amount: number; donated_at: string; comment: string;
  donation_type: DonationType;
  goal_id: number | null;
  thank_you_sent: boolean; thank_you_sent_at: string | null;
}

export interface FundraisingGoal {
  id: number; title: string; description: string;
  target_amount: number; collected_amount: number;
  is_active: boolean; sort_order: number; created_at: string;
}

export const FUNDRAISING_URL = "https://functions.poehali.dev/c07dbd95-dad7-4562-8589-f3a6fd76c820";
export const FUNNEL_URL = "https://functions.poehali.dev/96d356b3-84cb-4fdc-9772-5b7d1a94967e";

export type FunnelStage =
  | "identified" | "first_contact" | "meeting" | "proposal_sent"
  | "negotiation" | "confirmed" | "funded" | "reporting" | "renewal";

export interface FunnelCard {
  id: number;
  name: string;
  donor_type: DonorType;
  donor_category: DonorCategory;
  stage: FunnelStage;
  stage_order: number;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  potential_amount: number | null;
  notes: string | null;
  manager: string | null;
  last_action_at: string | null;
  next_action_at: string | null;
  next_action_note: string | null;
  linked_org_id: number | null;
  linked_person_id: number | null;
  created_at: string;
  updated_at: string;
}

export const FUNNEL_STAGES: { id: FunnelStage; label: string; color: string; icon: string }[] = [
  { id: "identified",    label: "Идентифицирован",       color: "bg-slate-100 border-slate-200",   icon: "Binoculars" },
  { id: "first_contact", label: "Первый контакт",         color: "bg-blue-50 border-blue-200",      icon: "Phone" },
  { id: "meeting",       label: "Встреча / презентация",  color: "bg-violet-50 border-violet-200",  icon: "CalendarCheck" },
  { id: "proposal_sent", label: "Отправлено предложение", color: "bg-amber-50 border-amber-200",    icon: "Send" },
  { id: "negotiation",   label: "Переговоры",             color: "bg-orange-50 border-orange-200",  icon: "MessageSquare" },
  { id: "confirmed",     label: "Подтверждение поддержки",color: "bg-lime-50 border-lime-200",      icon: "ThumbsUp" },
  { id: "funded",        label: "Получено финансирование",color: "bg-green-50 border-green-200",    icon: "Banknote" },
  { id: "reporting",     label: "Отчётность и сопровожд.",color: "bg-teal-50 border-teal-200",      icon: "FileText" },
  { id: "renewal",       label: "Повторное привлечение",  color: "bg-indigo-50 border-indigo-200",  icon: "RefreshCw" },
];

export const STATUS_LABELS: Record<Status, string> = {
  active: "Активный", inactive: "Неактивный",
  potential: "Потенциальный", lost: "Утраченный",
};

export const STATUS_COLORS: Record<Status, string> = {
  active: "bg-green-100 text-green-700",
  potential: "bg-blue-100 text-blue-700",
  inactive: "bg-beige-dark text-ink/40",
  lost: "bg-red-100 text-red-500",
};

export const DONOR_CATEGORY_LABELS: Record<DonorCategory, string> = {
  donation: "Пожертвование",
  grant: "Грант",
  subsidy: "Субсидия",
  targeted: "Целевое",
  corporate: "Корпоративный партнёр",
  fund: "Фонд",
};

export const DONOR_CATEGORY_COLORS: Record<DonorCategory, string> = {
  donation: "bg-beige-dark text-ink/60",
  grant: "bg-violet-100 text-violet-700",
  subsidy: "bg-sky-100 text-sky-700",
  targeted: "bg-amber-100 text-amber-700",
  corporate: "bg-indigo-100 text-indigo-700",
  fund: "bg-teal-100 text-teal-700",
};

export const DONATION_TYPE_LABELS: Record<DonationType, string> = {
  money: "Деньги",
  goods: "Товары / вещи",
  services: "Услуги",
  volunteer: "Волонтёрство",
};

export const SOURCE_OPTIONS = ["Сайт", "Соцсети", "Мероприятие", "Рекомендация", "Партнёрская НКО", "Гос. орган", "Холодный контакт", "Другое"];

export const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

export function exportToCsv(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers, ...rows].map(r => r.map(escape).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}