import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  DonorType, CRM_URL, fmt,
  Interaction, Donation, FundraisingGoal,
  FUNDRAISING_URL,
  INTERACTION_LABELS, INTERACTION_ICONS, InteractionType,
  DONATION_TYPE_LABELS,
} from "./fundraising.types";

const inp = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 bg-white";
const lbl = "block text-xs text-slate-400 mb-1";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}

// ─── История взаимодействий ────────────────────────────────────────────────
export function HistorySection({ donorType, donorId }: { donorType: DonorType; donorId: number }) {
  const [items, setItems] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ interaction_type: "call" as InteractionType, title: "", description: "", interaction_date: new Date().toISOString().slice(0, 10), outcome: "", next_step: "" });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${CRM_URL}?type=interactions&donor_type=${donorType}&donor_id=${donorId}`)
      .then(r => r.json()).then(d => setItems(d.interactions || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [donorId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`${CRM_URL}?type=interaction`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donor_type: donorType, donor_id: donorId, ...form }),
    });
    setSaving(false);
    setOpen(false);
    setForm({ interaction_type: "call", title: "", description: "", interaction_date: new Date().toISOString().slice(0, 10), outcome: "", next_step: "" });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Удалить запись?")) return;
    await fetch(`${CRM_URL}?type=interaction&id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-3">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
        <Icon name="Plus" size={12} /> Добавить запись
      </button>
      {open && (
        <form onSubmit={save} className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Тип</label>
              <select value={form.interaction_type} onChange={e => setForm(f => ({ ...f, interaction_type: e.target.value as InteractionType }))} className={inp}>
                {(Object.entries(INTERACTION_LABELS) as [InteractionType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Дата</label>
              <input type="date" value={form.interaction_date} onChange={e => setForm(f => ({ ...f, interaction_date: e.target.value }))} className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Тема</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Краткая тема" className={inp} />
          </div>
          <div>
            <label className={lbl}>Описание</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={`${inp} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Итог / результат</label>
              <input value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>Следующий шаг</label>
              <input value={form.next_step} onChange={e => setForm(f => ({ ...f, next_step: e.target.value }))} className={inp} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">{saving ? "..." : "Сохранить"}</button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-slate-800">Отмена</button>
          </div>
        </form>
      )}
      {loading ? <div className="text-center py-4 text-slate-300 text-xs">Загружаем...</div>
        : items.length === 0 ? <div className="text-center py-6 text-slate-300 text-xs">История пуста</div>
        : (
          <div className="space-y-2">
            {items.map(it => (
              <div key={it.id} className="rounded-xl border border-slate-200 p-3 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                      <Icon name={INTERACTION_ICONS[it.interaction_type] || "MessageSquare"} size={13} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 leading-tight">{it.title || INTERACTION_LABELS[it.interaction_type]}</p>
                      <p className="text-xs text-slate-400">{fmtDate(it.interaction_date)} · {INTERACTION_LABELS[it.interaction_type]}</p>
                    </div>
                  </div>
                  <button onClick={() => del(it.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all">
                    <Icon name="Trash2" size={12} />
                  </button>
                </div>
                {it.description && <p className="text-xs text-slate-500 mt-2 ml-9">{it.description}</p>}
                {it.outcome && <p className="text-xs text-green-700 mt-1 ml-9 flex items-center gap-1"><Icon name="Check" size={10} />Итог: {it.outcome}</p>}
                {it.next_step && <p className="text-xs text-amber-600 mt-0.5 ml-9 flex items-center gap-1"><Icon name="ArrowRight" size={10} />Далее: {it.next_step}</p>}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Пожертвования ─────────────────────────────────────────────────────────
export function DonationsSection({ donorType, donorId }: { donorType: DonorType; donorId: number }) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [goals, setGoals] = useState<FundraisingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: "", donated_at: new Date().toISOString().slice(0, 10), comment: "", donation_type: "money", goal_id: "", payment_purpose: "", is_regular: false });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`${FUNDRAISING_URL}?type=donations&donor_type=${donorType}&donor_id=${donorId}`).then(r => r.json()),
      fetch(`${FUNDRAISING_URL}?type=goals`).then(r => r.json()),
    ]).then(([d, g]) => {
      setDonations(d.donations || []);
      setGoals(g.goals || []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [donorId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) return;
    setSaving(true);
    await fetch(`${FUNDRAISING_URL}?type=donation`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donor_type: donorType, donor_id: donorId, ...form, amount: parseFloat(form.amount), goal_id: form.goal_id ? parseInt(form.goal_id) : null }),
    });
    setSaving(false); setOpen(false);
    setForm({ amount: "", donated_at: new Date().toISOString().slice(0, 10), comment: "", donation_type: "money", goal_id: "", payment_purpose: "", is_regular: false });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Удалить пожертвование?")) return;
    await fetch(`${FUNDRAISING_URL}?type=donation&id=${id}`, { method: "DELETE" });
    load();
  };

  const total = donations.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-3">
      {total > 0 && <div className="bg-green-50 rounded-xl px-3 py-2 text-sm text-green-700 font-semibold">Итого: {fmt(total)}</div>}
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
        <Icon name="Plus" size={12} /> Добавить пожертвование
      </button>
      {open && (
        <form onSubmit={save} className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>Сумма (₽) *</label><input type="number" min="1" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inp} placeholder="0" /></div>
            <div><label className={lbl}>Дата</label><input type="date" value={form.donated_at} onChange={e => setForm(f => ({ ...f, donated_at: e.target.value }))} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Тип</label>
              <select value={form.donation_type} onChange={e => setForm(f => ({ ...f, donation_type: e.target.value }))} className={inp}>
                {Object.entries(DONATION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Цель сбора</label>
              <select value={form.goal_id} onChange={e => setForm(f => ({ ...f, goal_id: e.target.value }))} className={inp}>
                <option value="">— не указана —</option>
                {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </div>
          </div>
          <div><label className={lbl}>Назначение платежа</label><input value={form.payment_purpose} onChange={e => setForm(f => ({ ...f, payment_purpose: e.target.value }))} placeholder="Благотворительное пожертвование..." className={inp} /></div>
          <div><label className={lbl}>Комментарий</label><input value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} className={inp} /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_regular} onChange={e => setForm(f => ({ ...f, is_regular: e.target.checked }))} className="rounded" />
            <span className="text-xs text-slate-500">Регулярное пожертвование</span>
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">{saving ? "..." : "Добавить"}</button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-slate-800">Отмена</button>
          </div>
        </form>
      )}
      {loading ? <div className="text-center py-4 text-slate-300 text-xs">Загружаем...</div>
        : donations.length === 0 ? <div className="text-center py-6 text-slate-300 text-xs">Пожертвований пока нет</div>
        : (
          <div className="space-y-2">
            {donations.map(d => (
              <div key={d.id} className="flex items-center justify-between gap-2 py-2 border-b border-slate-200 last:border-0 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-green-700">{fmt(d.amount)}</span>
                    {d.is_regular && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Регулярное</span>}
                    {d.thank_you_sent && <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">Поблагодарили</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {fmtDate(d.donated_at)}
                    {d.payment_purpose && ` · ${d.payment_purpose}`}
                    {d.comment && ` · ${d.comment}`}
                  </p>
                </div>
                <button onClick={() => del(d.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500">
                  <Icon name="Trash2" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
