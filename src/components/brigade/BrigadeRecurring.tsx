import { useState } from "react";
import Icon from "@/components/ui/icon";

const YOOKASSA_URL = "https://functions.poehali.dev/96a24ba0-1990-499e-97df-59219cdda4af";
const AMOUNTS = [500, 1000, 3000];

export default function BrigadeRecurring() {
  const [monthly, setMonthly] = useState(true);
  const [amount, setAmount] = useState(1000);
  const [custom, setCustom] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const final = custom ? Number(custom) : amount;

  const pay = async () => {
    if (!final || final < 1) { setError("Укажите сумму от 1 ₽"); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError("Укажите email: на него придёт чек, и по нему вы сможете отключить подписку"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(YOOKASSA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: final, user_email: email.trim(), monthly, source: "brigade",
          success_url: `${window.location.origin}/donate?paid=1`,
        }),
      });
      const data = await res.json();
      if (data.payment_url) { window.location.href = data.payment_url; return; }
      if (data.code === "recurring_unavailable") setMonthly(false);
      setError(data.error || "Не удалось создать платёж");
    } catch {
      setError("Ошибка соединения. Попробуйте снова.");
    }
    setLoading(false);
  };

  const chip = (on: boolean) => `px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${on ? "bg-azure text-white border-azure" : "bg-white text-navy border-azure/30 hover:bg-mist"}`;

  return (
    <div className="bg-white rounded-xl p-5 sm:p-6">
      <h3 className="font-golos text-xl font-bold text-navy">Поддержать бригаду</h3>
      <div className="inline-flex mt-4 rounded-lg bg-mist p-1" role="group" aria-label="Периодичность">
        {[{ v: false, l: "Разовое пожертвование" }, { v: true, l: "Ежемесячно" }].map(o => (
          <button key={String(o.v)} onClick={() => setMonthly(o.v)} aria-pressed={monthly === o.v}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${monthly === o.v ? "bg-navy text-white" : "text-navy"}`}>{o.l}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        {AMOUNTS.map(a => (
          <button key={a} onClick={() => { setAmount(a); setCustom(""); }} aria-pressed={!custom && amount === a} className={chip(!custom && amount === a)}>{a.toLocaleString("ru-RU")} ₽</button>
        ))}
        <input type="number" min="1" inputMode="numeric" value={custom} onChange={e => setCustom(e.target.value)} placeholder="Другая сумма" aria-label="Другая сумма"
          className="w-36 px-3 py-2.5 rounded-lg border border-azure/30 text-sm text-navy focus:outline-none focus:border-azure" />
      </div>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Ваш email для чека" aria-label="Email"
        className="w-full mt-4 px-4 py-3 rounded-lg border border-azure/30 text-sm text-navy focus:outline-none focus:border-azure" />
      {monthly && (
        <p className="mt-3 text-sm text-navy/80 flex items-start gap-2 leading-relaxed">
          <Icon name="Info" size={16} className="text-teal-deep shrink-0 mt-0.5" />
          Сумма будет списываться раз в месяц. Отключить подписку можно в любой момент в <a href="/cabinet" className="underline text-azure">личном кабинете</a>: войдите по коду из письма и нажмите «Отключить».
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
      <button onClick={pay} disabled={loading} className="mt-4 w-full sm:w-auto px-8 py-3.5 rounded-lg bg-azure text-white font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
        {loading ? "Переходим к оплате..." : monthly ? `Помогать ${(final || 0).toLocaleString("ru-RU")} ₽ в месяц` : `Пожертвовать ${(final || 0).toLocaleString("ru-RU")} ₽`}
      </button>
    </div>
  );
}
