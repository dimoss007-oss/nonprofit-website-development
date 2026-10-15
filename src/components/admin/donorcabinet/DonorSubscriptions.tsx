import { useEffect, useState } from "react";
import { fmtDate, money } from "@/components/cabinet/cabinet.shared";
import { Creds, adminCall } from "@/components/admin/donorcabinet/adminApi";

type Sub = {
  id: number; email: string; user_name: string; amount: number; card_last4?: string | null; status: string;
  next_charge_at: string; last_charge_at?: string | null; created_at: string; cancelled_at?: string | null;
  fail_count: number; last_error?: string | null;
};
type Summary = { active: number; monthly_total: number; failed: number; cancelled: number };

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Активна", cls: "bg-green-50 text-green-700 border-green-200" },
  failed: { label: "Списание не прошло", cls: "bg-red-50 text-red-700 border-red-200" },
  cancelled: { label: "Отключена", cls: "bg-slate-50 text-slate-500 border-slate-200" },
};

export default function DonorSubscriptions({ creds }: { creds: Creds }) {
  const [items, setItems] = useState<Sub[] | null>(null);
  const [sum, setSum] = useState<Summary | null>(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    adminCall<{ subscriptions: Sub[]; summary: Summary }>(creds, "subscriptions")
      .then((d) => { setItems(d.subscriptions); setSum(d.summary); })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, []);

  if (error) return <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>;
  if (!items || !sum) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  const shown = filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Активных подписок", value: String(sum.active) },
          { label: "Ежемесячно приходит", value: money(sum.monthly_total) },
          { label: "Списание не прошло", value: String(sum.failed) },
          { label: "Отключили", value: String(sum.cancelled) },
        ].map((c) => (
          <div key={c.label} className="bg-white border border-slate-200 rounded-2xl p-4"><p className="text-xs text-slate-400">{c.label}</p><p className="font-inter font-bold text-slate-800 text-3xl font-semibold leading-none mt-1">{c.value}</p></div>
        ))}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {[{ id: "all", label: "Все" }, { id: "active", label: "Активные" }, { id: "failed", label: "С ошибкой" }, { id: "cancelled", label: "Отключённые" }].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.id ? "bg-indigo-600 text-white" : "bg-white text-slate-500 border border-slate-200 hover:text-slate-800"}`}>{f.label}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-slate-400 bg-white border border-slate-200 rounded-2xl px-4 py-6 text-center">Подписок пока нет</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-200">
              <th className="px-4 py-3 font-medium">Донор</th><th className="px-4 py-3 font-medium">Сумма</th><th className="px-4 py-3 font-medium">Карта</th>
              <th className="px-4 py-3 font-medium">Следующее списание</th><th className="px-4 py-3 font-medium">Статус</th>
            </tr></thead>
            <tbody>
              {shown.map((s) => {
                const st = STATUS[s.status] || STATUS.cancelled;
                return (
                  <tr key={s.id} className="border-b border-slate-200 last:border-0 align-top">
                    <td className="px-4 py-3"><p className="text-slate-800 font-medium">{s.user_name}</p><p className="text-xs text-slate-400">{s.email}</p><p className="text-[11px] text-slate-400">с {fmtDate(s.created_at)}</p></td>
                    <td className="px-4 py-3 text-slate-800 whitespace-nowrap">{money(s.amount)}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.card_last4 ? `•••• ${s.card_last4}` : "—"}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.status === "active" ? fmtDate(s.next_charge_at) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full border ${st.cls}`}>{st.label}</span>
                      {s.status === "cancelled" && <p className="text-[11px] text-slate-400 mt-1">{fmtDate(s.cancelled_at)}</p>}
                      {s.fail_count > 0 && s.status !== "cancelled" && <p className="text-[11px] text-red-600 mt-1">неудачных попыток: {s.fail_count}</p>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
