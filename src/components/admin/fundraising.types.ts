export type DonorType = "org" | "person";
export type Section = "stats" | "orgs" | "persons";
export type Status = "active" | "inactive";

export interface Stats {
  orgs_total: number; orgs_active: number;
  persons_total: number; persons_active: number;
  donations_total: number; donations_count: number;
  donations_year: number; donations_month: number;
}

export interface Org {
  id: number; name: string; phone: string; email: string;
  website: string; manager: string; status: Status;
  notes: string; created_at: string;
  total_donated: number; donations_count: number;
}

export interface Person {
  id: number; full_name: string; phone: string; email: string;
  source: string; status: Status; notes: string; created_at: string;
  total_donated: number; donations_count: number;
}

export interface Donation {
  id: number; donor_type: DonorType; donor_id: number;
  amount: number; donated_at: string; comment: string;
}

export const FUNDRAISING_URL = "https://functions.poehali.dev/c07dbd95-dad7-4562-8589-f3a6fd76c820";

export const STATUS_LABELS: Record<string, string> = {
  active: "Активный", inactive: "Неактивный",
};

export const SOURCE_OPTIONS = ["Сайт", "Соцсети", "Мероприятие", "Рекомендация", "Холодный контакт", "Другое"];

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
