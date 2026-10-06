import { CABINET_URL } from "@/components/cabinet/cabinet.shared";

export type Creds = { authLogin: string; authPassword: string };

export async function adminCall<T = Record<string, unknown>>(creds: Creds, action: string, payload: object = {}): Promise<T> {
  const r = await fetch(CABINET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: `admin_${action}`, auth_login: creds.authLogin, auth_password: creds.authPassword, ...payload }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Ошибка запроса");
  return d as T;
}

export const ICON_CHOICES = ["Heart", "HandHeart", "Shield", "Crown", "Star", "Trophy", "Medal", "Award", "Flame", "Sparkles", "Sprout", "Coins", "Cake", "CalendarCheck", "Users", "Gift", "Sun", "Smile"];

export const KIND_LABELS: Record<string, string> = {
  first_donation: "Первое пожертвование",
  total_amount: "Накопленная сумма (₽)",
  donation_count: "Количество пожертвований",
  monthly_streak: "Месяцев подряд",
  anniversary_years: "Лет с первого пожертвования",
  manual: "Выдаёт администратор вручную",
};

export const inputCls = "w-full border border-beige-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink";
