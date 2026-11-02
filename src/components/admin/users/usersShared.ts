export const API = "https://functions.poehali.dev/e6567f16-b3db-4b0d-9c1f-abed808c2ac8";

export type Role = "admin" | "user" | "psychologist";

export type AdminUser = {
  id: number; login: string; role: Role; full_name?: string; phone?: string; created_at: string; permissions?: string | null;
  position?: string | null; photo_url?: string | null; max_linked?: boolean; birth_date?: string | null;
  passport_series?: string | null; passport_number?: string | null; passport_issued_by?: string | null; passport_issued_date?: string | null;
};

export type ProfileForm = { position: string; birth_date: string; passport_series: string; passport_number: string; passport_issued_by: string; passport_issued_date: string };
export const EMPTY_PROFILE: ProfileForm = { position: "", birth_date: "", passport_series: "", passport_number: "", passport_issued_by: "", passport_issued_date: "" };

export const toProfile = (u: AdminUser): ProfileForm => ({
  position: u.position || "",
  birth_date: u.birth_date?.slice(0, 10) || "",
  passport_series: u.passport_series || "",
  passport_number: u.passport_number || "",
  passport_issued_by: u.passport_issued_by || "",
  passport_issued_date: u.passport_issued_date?.slice(0, 10) || "",
});

export const fmtDate = (d?: string | null) => (d ? d.slice(0, 10).split("-").reverse().join(".") : "");

export const readAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const INPUT_CLS = "w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink";

export const ROLE_LABELS: Record<Role, string> = { admin: "Администратор", user: "Пользователь", psychologist: "Психолог" };
export const ROLE_COLORS: Record<Role, string> = { admin: "bg-ink text-beige", user: "bg-beige-dark text-ink", psychologist: "bg-teal-100 text-teal-800" };

export const ALL_TABS = [
  { id: "crm",         label: "Пациенты",     icon: "Users" },
  { id: "sop",         label: "СОП",           icon: "ShieldAlert" },
  { id: "news",        label: "Новости",       icon: "Newspaper" },
  { id: "tasks",       label: "Задачи",        icon: "ClipboardList" },
  { id: "requests",    label: "Заявки",        icon: "Inbox" },
  { id: "users",       label: "Сотрудники",    icon: "UserCog" },
  { id: "gallery",     label: "Галерея",       icon: "Images" },
  { id: "fundraising", label: "Фандрайзинг",   icon: "HandCoins" },
  { id: "gov",         label: "Госорганы",     icon: "Landmark" },
  { id: "shifts",      label: "Отчёты смены",  icon: "Clock" },
  { id: "psychologist", label: "Психолог",      icon: "Brain" },
] as const;

export type TabId = typeof ALL_TABS[number]["id"];
export const DEFAULT_TABS: TabId[] = ALL_TABS.map(t => t.id).filter(id => id !== "psychologist");

export function parsePermissions(raw?: string | null): TabId[] | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as TabId[]; }
  catch { return null; }
}
