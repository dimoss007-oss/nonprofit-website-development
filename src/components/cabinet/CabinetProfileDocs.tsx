import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Overview, cabinetPost, downloadPdf, money } from "@/components/cabinet/cabinet.shared";

export function CabinetDocs({ data }: { data: Overview }) {
  const [year, setYear] = useState(data.years_available[0] || new Date().getFullYear());
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const has = data.stats.count > 0;

  const run = async (kind: "certificate" | "tax_statement") => {
    setBusy(kind); setError("");
    try {
      const d = await cabinetPost<{ file_name: string; file_base64: string }>(kind === "tax_statement" ? { action: kind, year } : { action: kind });
      downloadPdf(d.file_name, d.file_base64);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать документ");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="bg-white border border-beige-dark rounded-3xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0"><Icon name="Award" size={20} /></div>
          <div className="flex-1">
            <h3 className="font-semibold text-ink">Сертификат благодарности</h3>
            <p className="text-sm text-ink/50 mt-0.5">Именной документ от центра. Общая сумма вашей помощи: {money(data.stats.total)}.</p>
            <button onClick={() => run("certificate")} disabled={!has || busy === "certificate"} className="mt-3 px-4 py-2 rounded-xl bg-ink text-beige text-sm font-semibold hover:bg-ink/90 disabled:opacity-50 transition-colors flex items-center gap-1.5">
              <Icon name={busy === "certificate" ? "Loader" : "Download"} size={14} className={busy === "certificate" ? "animate-spin" : ""} />Скачать PDF
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-beige-dark rounded-3xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0"><Icon name="FileText" size={20} /></div>
          <div className="flex-1">
            <h3 className="font-semibold text-ink">Справка о пожертвованиях</h3>
            <p className="text-sm text-ink/50 mt-0.5">Список ваших платежей за год. Может пригодиться для отчётности и налоговых вопросов.</p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border border-beige-dark rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink">
                {(data.years_available.length ? data.years_available : [year]).map((y) => <option key={y} value={y}>{y} год</option>)}
              </select>
              <button onClick={() => run("tax_statement")} disabled={!has || busy === "tax_statement"} className="px-4 py-2 rounded-xl bg-ink text-beige text-sm font-semibold hover:bg-ink/90 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                <Icon name={busy === "tax_statement" ? "Loader" : "Download"} size={14} className={busy === "tax_statement" ? "animate-spin" : ""} />Скачать PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      {!has && <p className="text-xs text-ink/40 text-center">Документы станут доступны после первого пожертвования.</p>}
    </div>
  );
}

export function CabinetProfile({ data, onSaved }: { data: Overview; onSaved: () => void }) {
  const p = data.profile;
  const [fullName, setFullName] = useState(p.full_name || "");
  const [displayName, setDisplayName] = useState(p.display_name || "");
  const [address, setAddress] = useState(p.address || "");
  const [rating, setRating] = useState(p.show_in_rating);
  const [unsub, setUnsub] = useState(p.email_unsubscribed);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const input = "w-full border border-beige-dark rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-ink";

  const save = async () => {
    setBusy(true); setMsg("");
    try {
      await cabinetPost({ action: "update_profile", full_name: fullName, display_name: displayName, address, show_in_rating: rating, email_unsubscribed: unsub });
      setMsg("Сохранено");
      onSaved();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-beige-dark rounded-3xl p-6 space-y-4 max-w-xl">
      <div><label className="text-xs text-ink/50 mb-1 block">Email</label><input value={p.email} disabled className={`${input} bg-beige-mid text-ink/60`} /></div>
      <div><label className="text-xs text-ink/50 mb-1 block">ФИО для документов</label><input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иванова Мария Сергеевна" className={input} /></div>
      <div><label className="text-xs text-ink/50 mb-1 block">Как к вам обращаться</label><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Мария" className={input} /></div>
      <div><label className="text-xs text-ink/50 mb-1 block">Адрес (необязательно)</label><input value={address} onChange={(e) => setAddress(e.target.value)} className={input} /></div>
      <label className="flex items-center gap-2 text-sm text-ink cursor-pointer"><input type="checkbox" checked={rating} onChange={(e) => setRating(e.target.checked)} className="accent-sage w-4 h-4" />Показывать меня в рейтинге жертвователей</label>
      <label className="flex items-center gap-2 text-sm text-ink cursor-pointer"><input type="checkbox" checked={unsub} onChange={(e) => setUnsub(e.target.checked)} className="accent-sage w-4 h-4" />Не присылать письма-рассылки (сообщения в кабинете останутся)</label>
      {msg && <p className={`text-xs ${msg === "Сохранено" ? "text-green-700" : "text-red-600"}`}>{msg}</p>}
      <button onClick={save} disabled={busy} className="px-5 py-2.5 rounded-xl bg-ink text-beige text-sm font-semibold hover:bg-ink/90 disabled:opacity-60 transition-colors">{busy ? "Сохраняем..." : "Сохранить"}</button>
    </div>
  );
}
