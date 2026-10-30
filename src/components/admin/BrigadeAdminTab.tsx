import { useEffect, useState } from "react";
import { Creds, adminCall } from "@/components/admin/donorcabinet/adminApi";

const inp = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50";
const lbl = "block text-xs uppercase tracking-widest text-slate-400 mb-1";

type Stats = { period_label: string; trips: number; families: number; km: number; map_url: string | null };
type Action = { id: number; title: string; amount: number; goal_id: number | null; sort_order: number; is_active: boolean };

export default function BrigadeAdminTab({ authLogin, authPassword }: { authLogin: string; authPassword: string }) {
  const creds: Creds = { authLogin, authPassword };
  const [stats, setStats] = useState<Stats>({ period_label: "", trips: 0, families: 0, km: 0, map_url: "" });
  const [actions, setActions] = useState<Action[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("1000");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const load = async () => {
    try {
      const d = await adminCall<{ stats: Stats; actions: Action[] }>(creds, "brigade_get");
      setStats({ ...d.stats, map_url: d.stats.map_url || "" });
      setActions(d.actions);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };
  useEffect(() => { load(); }, []);

  const run = async (fn: () => Promise<void>, ok = "Сохранено") => {
    setError(""); setInfo("");
    try { await fn(); setInfo(ok); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };

  const num = (k: "trips" | "families" | "km") => (
    <input type="number" min="0" className={inp} value={stats[k]} onChange={e => setStats(s => ({ ...s, [k]: Number(e.target.value) }))} />
  );

  const patch = (id: number, p: Partial<Action>) => setActions(list => list.map(a => a.id === id ? { ...a, ...p } : a));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">Цифры для страницы «Мобильная бригада»</h3>
        <div>
          <label className={lbl}>Период (подпись над цифрами)</label>
          <input className={inp} value={stats.period_label} onChange={e => setStats(s => ({ ...s, period_label: e.target.value }))} placeholder="За 3 квартал 2026" />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div><label className={lbl}>Выездов</label>{num("trips")}</div>
          <div><label className={lbl}>Семей проконсультировано</label>{num("families")}</div>
          <div><label className={lbl}>Километров</label>{num("km")}</div>
        </div>
        <div>
          <label className={lbl}>Ссылка на карту выездов (DataLens, https://…)</label>
          <input className={inp} value={stats.map_url || ""} onChange={e => setStats(s => ({ ...s, map_url: e.target.value }))} placeholder="Необязательно" />
        </div>
        <button onClick={() => run(() => adminCall(creds, "brigade_stats_save", stats).then(() => undefined))} className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700">Сохранить цифры</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">Кнопки адресного сбора</h3>
        <div className="space-y-3">
          {actions.map(a => (
            <div key={a.id} className="flex flex-wrap items-center gap-2">
              <input className={`${inp} flex-1 min-w-[200px]`} value={a.title} onChange={e => patch(a.id, { title: e.target.value })} />
              <input type="number" min="1" className={`${inp} w-28`} value={a.amount} onChange={e => patch(a.id, { amount: Number(e.target.value) })} />
              <label className="flex items-center gap-1.5 text-sm text-slate-600"><input type="checkbox" checked={a.is_active} onChange={e => patch(a.id, { is_active: e.target.checked })} />Показывать</label>
              <button onClick={() => run(() => adminCall(creds, "brigade_action_save", a).then(() => undefined))} className="px-3 py-2 rounded-xl text-xs bg-indigo-600 text-white">Сохранить</button>
              <button onClick={() => { if (confirm("Удалить кнопку?")) run(() => adminCall(creds, "brigade_action_delete", { id: a.id }).then(() => undefined), "Удалено"); }} className="text-xs text-slate-400 hover:text-red-600">Удалить</button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <input className={`${inp} flex-1 min-w-[200px]`} placeholder="Новая кнопка, например: Купить зимние шины" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          <input type="number" min="1" className={`${inp} w-28`} value={newAmount} onChange={e => setNewAmount(e.target.value)} />
          <button disabled={!newTitle.trim()} onClick={() => run(async () => { await adminCall(creds, "brigade_action_save", { title: newTitle, amount: Number(newAmount), sort_order: actions.length + 1 }); setNewTitle(""); }, "Кнопка добавлена")} className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white disabled:opacity-40">Добавить</button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-700">{info}</p>}
      </div>
    </div>
  );
}
