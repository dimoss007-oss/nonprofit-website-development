import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  CRM_URL, fmt,
  Campaign, CampaignStatus,
  CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS,
  CHANNEL_OPTIONS,
} from "./fundraising.types";

const inp = "w-full border border-beige-dark rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40";
const lbl = "block text-xs uppercase tracking-widest text-ink/50 mb-1";

const EMPTY: Partial<Campaign> = {
  title: "", goal: "", budget: undefined, start_date: "", end_date: "",
  audience: "", channel: "", status: "planned", result_amount: undefined, result_donors: undefined, notes: "",
};

function CampaignForm({ initial, onSave, onCancel }: {
  initial?: Partial<Campaign>;
  onSave: (d: Partial<Campaign>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Campaign>>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Campaign, v: string | number | null) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="bg-white border border-beige-dark rounded-2xl p-5 space-y-4">
      <h3 className="font-semibold text-ink text-sm">{initial?.id ? "Редактировать кампанию" : "Новая кампания"}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={lbl}>Название *</label>
          <input required value={form.title || ""} onChange={e => set("title", e.target.value)} className={inp} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Цель кампании</label>
          <input value={form.goal || ""} onChange={e => set("goal", e.target.value)} placeholder="Привлечь 10 новых доноров" className={inp} />
        </div>
        <div>
          <label className={lbl}>Статус</label>
          <select value={form.status || "planned"} onChange={e => set("status", e.target.value as CampaignStatus)} className={inp}>
            {(Object.entries(CAMPAIGN_STATUS_LABELS) as [CampaignStatus, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Канал привлечения</label>
          <select value={form.channel || ""} onChange={e => set("channel", e.target.value)} className={inp}>
            <option value="">— не указан —</option>
            {CHANNEL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Бюджет (₽)</label>
          <input type="number" min="0" value={form.budget ?? ""} onChange={e => set("budget", e.target.value ? parseFloat(e.target.value) : null)} className={inp} placeholder="0" />
        </div>
        <div>
          <label className={lbl}>Аудитория</label>
          <input value={form.audience || ""} onChange={e => set("audience", e.target.value)} placeholder="Корпоративные доноры, физлица..." className={inp} />
        </div>
        <div>
          <label className={lbl}>Начало</label>
          <input type="date" value={form.start_date || ""} onChange={e => set("start_date", e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Конец</label>
          <input type="date" value={form.end_date || ""} onChange={e => set("end_date", e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Результат (сумма, ₽)</label>
          <input type="number" min="0" value={form.result_amount ?? ""} onChange={e => set("result_amount", e.target.value ? parseFloat(e.target.value) : null)} className={inp} placeholder="0" />
        </div>
        <div>
          <label className={lbl}>Результат (доноров)</label>
          <input type="number" min="0" value={form.result_donors ?? ""} onChange={e => set("result_donors", e.target.value ? parseInt(e.target.value) : null)} className={inp} placeholder="0" />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Заметки</label>
          <textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={2} className={`${inp} resize-none`} />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="bg-ink text-beige px-5 py-2 rounded-xl text-sm font-semibold hover:bg-ink/90 disabled:opacity-50">
          {saving ? "Сохраняем..." : "Сохранить"}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2 rounded-xl text-sm border border-beige-dark text-ink/60 hover:text-ink">Отмена</button>
      </div>
    </form>
  );
}

export default function FundraisingCampaignsTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`${CRM_URL}?type=campaigns`).then(r => r.json()).then(d => setCampaigns(d.campaigns || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async (data: Partial<Campaign>) => {
    await fetch(`${CRM_URL}?type=campaign`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    setShowForm(false); setEditing(null); load();
  };

  const del = async (id: number) => {
    if (!confirm("Удалить кампанию?")) return;
    await fetch(`${CRM_URL}?type=campaign&id=${id}`, { method: "DELETE" });
    load();
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("ru-RU") : "—";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cormorant text-ink text-2xl font-semibold">Кампании по сбору средств</h2>
          <p className="text-xs text-ink/40 mt-0.5">{campaigns.length} кампаний</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90">
          <Icon name="Plus" size={15} /> Добавить
        </button>
      </div>

      {showForm && !editing && <CampaignForm onSave={save} onCancel={() => setShowForm(false)} />}
      {editing && <CampaignForm initial={editing} onSave={save} onCancel={() => setEditing(null)} />}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 text-ink/40"><Icon name="Megaphone" size={36} className="mx-auto mb-3 opacity-30" /><p>Кампаний пока нет</p></div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-beige-dark p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-ink">{c.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CAMPAIGN_STATUS_COLORS[c.status]}`}>{CAMPAIGN_STATUS_LABELS[c.status]}</span>
                    {c.channel && <span className="text-[10px] px-2 py-0.5 rounded-full bg-beige-dark text-ink/60">{c.channel}</span>}
                  </div>
                  {c.goal && <p className="text-xs text-ink/60 mb-2">{c.goal}</p>}
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink/50">
                    {c.budget && <span className="flex items-center gap-1"><Icon name="Wallet" size={11} />Бюджет: {fmt(c.budget)}</span>}
                    {c.audience && <span className="flex items-center gap-1"><Icon name="Users" size={11} />{c.audience}</span>}
                    {(c.start_date || c.end_date) && <span className="flex items-center gap-1"><Icon name="Calendar" size={11} />{fmtDate(c.start_date)} — {fmtDate(c.end_date)}</span>}
                  </div>
                  {(c.result_amount || c.result_donors) && (
                    <div className="flex gap-4 mt-2 pt-2 border-t border-beige-dark/50">
                      {c.result_amount ? <span className="text-sm font-semibold text-green-700">{fmt(c.result_amount)}</span> : null}
                      {c.result_donors ? <span className="text-xs text-ink/50">{c.result_donors} доноров</span> : null}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditing(c); setShowForm(false); }} className="p-1.5 text-ink/30 hover:text-ink rounded-lg hover:bg-beige-mid"><Icon name="Pencil" size={14} /></button>
                  <button onClick={() => del(c.id)} className="p-1.5 text-ink/30 hover:text-red-500 rounded-lg hover:bg-red-50"><Icon name="Trash2" size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
