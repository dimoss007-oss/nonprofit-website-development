export const CABINET_URL = "https://functions.poehali.dev/2ccce869-c4d0-430d-8877-9cae698f1c04";
export const TOKEN_KEY = "donor_cabinet_token";

export type Level = { id: number; title: string; description?: string; min_amount: number | string; icon: string; color: string };
export type Achievement = {
  id: number; title: string; description?: string; icon: string; color: string; kind: string; threshold: number | string;
  certificate: boolean; earned: boolean; awarded_at?: string | null;
  progress: { value: number; target: number; pct: number } | null;
};
export type Overview = {
  profile: {
    email: string; name: string; full_name?: string; display_name?: string; address?: string;
    show_in_rating: boolean; email_unsubscribed: boolean; referral_code: string; member_since: string;
  };
  stats: {
    total: number; count: number; avg: number; streak: number; years: number; year_total: number;
    first_date?: string; last_date?: string; by_month: { label: string; amount: number }[];
  };
  level: { current: Level | null; next: Level | null; progress_pct: number; left_to_next: number };
  levels: Level[];
  achievements: Achievement[];
  impact: { title: string; icon: string; unit_label: string; count: number }[];
  unread_messages: number;
  referrals: { friends: number; amount: number };
  rating_place: number | null;
  rating_total: number;
  years_available: number[];
  site_url: string;
  recent: { amount: number; dt: string; monthly: boolean }[];
};
export type Message = { id: number; kind: string; title: string; body: string; is_read: boolean; created_at: string };
export type FeedPost = { id: number; title: string; body: string; image_url?: string; created_at: string };

export const COLOR_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  rose: { bg: "bg-rose-100", text: "text-rose-600", ring: "ring-rose-200" },
  amber: { bg: "bg-amber-100", text: "text-amber-600", ring: "ring-amber-200" },
  sky: { bg: "bg-sky-100", text: "text-sky-600", ring: "ring-sky-200" },
  violet: { bg: "bg-violet-100", text: "text-violet-600", ring: "ring-violet-200" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600", ring: "ring-emerald-200" },
};
export const COLOR_KEYS = Object.keys(COLOR_STYLES);
export const colorOf = (c?: string) => COLOR_STYLES[c || ""] || COLOR_STYLES.rose;

export const money = (v: number | string | undefined | null) =>
  `${Math.round(Number(v) || 0).toLocaleString("ru-RU")} ₽`;
export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("ru-RU") : "—");
export const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export class AuthError extends Error {}

export async function cabinetGet<T>(view: string, extra = ""): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const r = await fetch(`${CABINET_URL}?view=${view}${extra}`, { headers: { "X-Auth-Token": token } });
  const d = await r.json();
  if (r.status === 401) throw new AuthError(d.error || "Требуется вход");
  if (!r.ok) throw new Error(d.error || "Ошибка запроса");
  return d as T;
}

export async function cabinetPost<T = Record<string, unknown>>(body: object, withToken = true): Promise<T> {
  const token = withToken ? localStorage.getItem(TOKEN_KEY) || "" : "";
  const r = await fetch(CABINET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": token },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (r.status === 401) throw new AuthError(d.error || "Требуется вход");
  if (!r.ok) throw new Error(d.error || "Ошибка запроса");
  return d as T;
}

export function downloadPdf(fileName: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function referralLink(siteUrl: string, code: string) {
  const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : siteUrl;
  return `${origin}/donate?ref=${code}`;
}
