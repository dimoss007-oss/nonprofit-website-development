import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { cabinetGet, cabinetPost, fmtDate, money } from "@/components/cabinet/cabinet.shared";

type Subscription = {
  id: number; amount: number; card_last4?: string | null; card_type?: string | null;
  status: string; next_charge_at: string; created_at: string; cancelled_at?: string | null;
};

export default function CabinetSubscription() {
  const [items, setItems] = useState<Subscription[] | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setItems((await cabinetGet<{ subscriptions: Subscription[] }>("subscriptions")).subscriptions); }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось загрузить подписки"); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cancel = async (id: number) => {
    setBusy(true); setError("");
    try { await cabinetPost({ action: "cancel_subscription", id }); setConfirmId(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось отключить подписку"); }
    finally { setBusy(false); }
  };

  if (!items) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>;

  const active = items.filter((i) => i.status === "active");
  const cancelled = items.filter((i) => i.status === "cancelled");

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-white border border-beige-dark rounded-2xl p-5">
        <h2 className="font-semibold text-ink text-lg">Моя ежемесячная подписка</h2>
        <p className="text-sm text-ink/60 mt-1">Здесь вы видите регулярные пожертвования и можете отключить их в любой момент. Отключение действует сразу, звонить или писать в поддержку не нужно.</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {active.length === 0 && (
        <div className="bg-white border border-beige-dark rounded-2xl p-6 text-center space-y-3">
          <Icon name="HeartHandshake" size={28} className="mx-auto text-ink/40" />
          <p className="text-sm text-ink/60">Активных ежемесячных подписок нет</p>
          <a href="/donate" className="inline-block px-4 py-2 rounded-xl bg-sage text-white text-sm font-semibold hover:bg-sage-dark transition-colors">Оформить подписку</a>
        </div>
      )}

      {active.map((s) => (
        <div key={s.id} className="bg-white border border-beige-dark rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold text-ink">{money(s.amount)} <span className="text-sm font-normal text-ink/50">в месяц</span></p>
              <p className="text-sm text-ink/60 mt-1">Следующее списание: {fmtDate(s.next_charge_at)}</p>
              <p className="text-sm text-ink/60 flex items-center gap-1.5 mt-1">
                <Icon name="CreditCard" size={14} />
                {s.card_last4 ? `Карта •••• ${s.card_last4}` : "Банковская карта"}
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">Активна</span>
          </div>

          {confirmId === s.id ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
              <p className="text-sm text-amber-900">Отключить ежемесячное пожертвование {money(s.amount)} и отвязать карту? Больше списаний не будет.</p>
              <div className="flex gap-2">
                <button onClick={() => cancel(s.id)} disabled={busy} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors">{busy ? "Отключаем..." : "Да, отключить"}</button>
                <button onClick={() => setConfirmId(null)} disabled={busy} className="px-4 py-2 rounded-xl border border-ink/20 text-ink text-sm font-semibold hover:bg-beige-mid transition-colors">Оставить</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmId(s.id)} className="px-4 py-2 rounded-xl border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center gap-1.5">
              <Icon name="Unlink" size={14} />Отключить подписку и отвязать карту
            </button>
          )}
        </div>
      ))}

      {cancelled.length > 0 && (
        <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-2">
          <h3 className="text-sm font-semibold text-ink/60">Отключённые подписки</h3>
          {cancelled.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm text-ink/60">
              <span>{money(s.amount)} в месяц{s.card_last4 ? `, карта •••• ${s.card_last4}` : ""}</span>
              <span>отключена {fmtDate(s.cancelled_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
