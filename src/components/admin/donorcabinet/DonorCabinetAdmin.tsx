import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { money } from "@/components/cabinet/cabinet.shared";
import { Creds, adminCall } from "@/components/admin/donorcabinet/adminApi";
import DonorCatalog from "@/components/admin/donorcabinet/DonorCatalog";
import DonorBroadcasts from "@/components/admin/donorcabinet/DonorBroadcasts";
import DonorPeople from "@/components/admin/donorcabinet/DonorPeople";
import DonorSettings from "@/components/admin/donorcabinet/DonorSettings";
import { DonorFeedAdmin, DonorGifts } from "@/components/admin/donorcabinet/DonorGiftsFeed";

type Overview = { accounts: number; logged_in: number; awards: number; total_amount: number; donors_with_payments: number; gifts_planned: number; smtp_configured: boolean; email_queue: Record<string, number> };

const SUBS = [
  { id: "people", label: "Жертвователи", icon: "Users" },
  { id: "achievements", label: "Ачивки", icon: "Award" },
  { id: "levels", label: "Уровни", icon: "TrendingUp" },
  { id: "broadcasts", label: "Рассылки", icon: "Send" },
  { id: "gifts", label: "Подарки", icon: "Gift" },
  { id: "feed", label: "Лента", icon: "Newspaper" },
  { id: "impact", label: "Влияние", icon: "HeartHandshake" },
  { id: "settings", label: "Настройки", icon: "Settings" },
] as const;

type SubId = typeof SUBS[number]["id"];

export default function DonorCabinetAdmin({ authLogin, authPassword }: { authLogin: string; authPassword: string }) {
  const creds: Creds = { authLogin, authPassword };
  const [sub, setSub] = useState<SubId>("people");
  const [ov, setOv] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  const loadOverview = () => adminCall<Overview>(creds, "overview").then(setOv).catch((e) => setError(e instanceof Error ? e.message : "Ошибка"));
  useEffect(() => { loadOverview(); }, []);

  if (!authPassword) return <p className="text-sm text-ink/50">Войдите в админ-панель заново, чтобы управлять кабинетом.</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div><h2 className="font-cormorant text-ink text-2xl font-semibold">Личный кабинет жертвователей</h2><p className="text-xs text-ink/50">Страница для жертвователей: <span className="font-mono">/cabinet</span></p></div>
        <a href="/cabinet" target="_blank" rel="noreferrer" className="text-sm px-3 py-1.5 rounded-lg border border-beige-dark hover:border-ink transition-colors flex items-center gap-1.5"><Icon name="ExternalLink" size={14} />Открыть кабинет</a>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {ov && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Жертвователей", value: String(ov.donors_with_payments), hint: `аккаунтов: ${ov.accounts}` },
            { label: "Заходили в кабинет", value: String(ov.logged_in), hint: ov.smtp_configured ? "почта работает" : "почта не настроена" },
            { label: "Выдано наград", value: String(ov.awards) },
            { label: "Подарков ждёт", value: String(ov.gifts_planned), hint: `собрано всего ${money(ov.total_amount)}` },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-beige-dark rounded-2xl p-4"><p className="text-xs text-ink/40">{c.label}</p><p className="font-cormorant text-ink text-3xl font-semibold leading-none mt-1">{c.value}</p>{c.hint && <p className="text-[11px] text-ink/40 mt-1.5">{c.hint}</p>}</div>
          ))}
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SUBS.map((t) => (
          <button key={t.id} onClick={() => setSub(t.id)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${sub === t.id ? "bg-ink text-beige" : "bg-white text-ink/60 border border-beige-dark hover:text-ink"}`}><Icon name={t.icon} size={14} />{t.label}</button>
        ))}
      </div>

      {sub === "people" && <DonorPeople creds={creds} />}
      {sub === "achievements" && <DonorCatalog creds={creds} entity="achievement" />}
      {sub === "levels" && <DonorCatalog creds={creds} entity="level" />}
      {sub === "impact" && <DonorCatalog creds={creds} entity="impact" />}
      {sub === "broadcasts" && <DonorBroadcasts creds={creds} smtp={!!ov?.smtp_configured} />}
      {sub === "gifts" && <DonorGifts creds={creds} />}
      {sub === "feed" && <DonorFeedAdmin creds={creds} />}
      {sub === "settings" && <DonorSettings creds={creds} onChanged={loadOverview} />}
    </div>
  );
}
