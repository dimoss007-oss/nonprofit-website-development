import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Creds, adminCall, inputCls } from "@/components/admin/donorcabinet/adminApi";

type Settings = { org_name: string; org_inn?: string; org_ogrn?: string; org_address?: string; org_signer?: string; org_signer_post?: string; site_url: string; lapsed_days: number; reminder_cooldown_days: number };

export default function DonorSettings({ creds, onChanged }: { creds: Creds; onChanged: () => void }) {
  const [s, setS] = useState<Settings | null>(null);
  const [smtp, setSmtp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    adminCall<{ settings: Settings; smtp_configured: boolean }>(creds, "settings_get").then((d) => { setS(d.settings); setSmtp(d.smtp_configured); }).catch((e) => setError(e.message));
  }, []);

  const set = (k: keyof Settings, v: string | number) => setS((p) => (p ? { ...p, [k]: v } : p));

  const save = async () => {
    setBusy(true); setMsg(""); setError("");
    try { const d = await adminCall<{ settings: Settings }>(creds, "settings_save", { settings: s }); setS(d.settings); setMsg("Сохранено"); onChanged(); }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось сохранить"); }
    finally { setBusy(false); }
  };

  const runAuto = async () => {
    setRunning(true); setMsg(""); setError("");
    try {
      const d = await adminCall<{ awards_granted: number; anniversaries: number; reminders: number }>(creds, "run_automation");
      setMsg(`Готово: наград выдано ${d.awards_granted}, поздравлений с годовщиной ${d.anniversaries}, напоминаний ${d.reminders}`);
      onChanged();
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setRunning(false); }
  };

  if (!s) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${smtp ? "bg-green-50 text-green-800 border border-green-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
        <Icon name={smtp ? "CheckCircle" : "AlertTriangle"} size={16} />{smtp ? "Почта подключена: вход по коду и письма работают" : "Почта не подключена: добавьте данные SMTP в секреты проекта, иначе вход по коду не заработает"}
      </div>

      <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-ink">Реквизиты для документов</h3>
        <p className="text-xs text-ink/50">Попадают в справку о пожертвованиях и сертификат.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className="text-xs text-ink/50 mb-1 block">Название организации</label><input value={s.org_name} onChange={(e) => set("org_name", e.target.value)} className={inputCls} /></div>
          <div><label className="text-xs text-ink/50 mb-1 block">ИНН</label><input value={s.org_inn || ""} onChange={(e) => set("org_inn", e.target.value)} className={inputCls} /></div>
          <div><label className="text-xs text-ink/50 mb-1 block">ОГРН</label><input value={s.org_ogrn || ""} onChange={(e) => set("org_ogrn", e.target.value)} className={inputCls} /></div>
          <div className="sm:col-span-2"><label className="text-xs text-ink/50 mb-1 block">Адрес</label><input value={s.org_address || ""} onChange={(e) => set("org_address", e.target.value)} className={inputCls} /></div>
          <div><label className="text-xs text-ink/50 mb-1 block">Подписант (ФИО)</label><input value={s.org_signer || ""} onChange={(e) => set("org_signer", e.target.value)} className={inputCls} /></div>
          <div><label className="text-xs text-ink/50 mb-1 block">Должность подписанта</label><input value={s.org_signer_post || ""} onChange={(e) => set("org_signer_post", e.target.value)} placeholder="Генеральный директор" className={inputCls} /></div>
          <div className="sm:col-span-2"><label className="text-xs text-ink/50 mb-1 block">Адрес сайта (для ссылок в письмах)</label><input value={s.site_url} onChange={(e) => set("site_url", e.target.value)} className={inputCls} /></div>
        </div>
      </div>

      <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-ink">Автонапоминания и поздравления</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="text-xs text-ink/50 mb-1 block">Считать «давно не жертвовал» через, дней</label><input type="number" min={7} value={s.lapsed_days} onChange={(e) => set("lapsed_days", Number(e.target.value))} className={inputCls} /></div>
          <div><label className="text-xs text-ink/50 mb-1 block">Не напоминать чаще, чем раз в, дней</label><input type="number" min={7} value={s.reminder_cooldown_days} onChange={(e) => set("reminder_cooldown_days", Number(e.target.value))} className={inputCls} /></div>
        </div>
        <p className="text-xs text-ink/50">Кнопка ниже выдаёт недостающие награды, поздравляет с годовщиной помощи и мягко напоминает тем, кто давно не жертвовал. Каждое поздравление уходит один раз. Автоматического запуска по расписанию пока нет, запускайте вручную.</p>
        <button onClick={runAuto} disabled={running} className="px-4 py-2 rounded-xl border border-ink text-ink text-sm font-semibold hover:bg-ink hover:text-beige disabled:opacity-60 transition-colors flex items-center gap-1.5">
          <Icon name={running ? "Loader" : "Play"} size={14} className={running ? "animate-spin" : ""} />Запустить проверку сейчас
        </button>
      </div>

      {msg && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{msg}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <button onClick={save} disabled={busy} className="px-5 py-2.5 rounded-xl bg-ink text-beige text-sm font-semibold hover:bg-ink/90 disabled:opacity-60 transition-colors">{busy ? "Сохранение..." : "Сохранить настройки"}</button>
    </div>
  );
}
