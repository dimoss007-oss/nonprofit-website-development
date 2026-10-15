import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  DonorType, CRM_URL,
  DonorDocument, DonorMetrics,
  DOC_TYPE_LABELS, DocType,
} from "./fundraising.types";

const inp = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 bg-white";
const lbl = "block text-xs text-slate-400 mb-1";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}
function isOverdue(d: string | null) {
  if (!d) return false;
  return new Date(d) < new Date();
}

// ─── Документы ────────────────────────────────────────────────────────────
export function DocsSection({ donorType, donorId }: { donorType: DonorType; donorId: number }) {
  const [docs, setDocs] = useState<DonorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ doc_type: "contract" as DocType, title: "", url: "", notes: "", doc_date: "" });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${CRM_URL}?type=documents&donor_type=${donorType}&donor_id=${donorId}`)
      .then(r => r.json()).then(d => setDocs(d.documents || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [donorId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`${CRM_URL}?type=document`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donor_type: donorType, donor_id: donorId, ...form }),
    });
    setSaving(false); setOpen(false);
    setForm({ doc_type: "contract", title: "", url: "", notes: "", doc_date: "" });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Удалить документ?")) return;
    await fetch(`${CRM_URL}?type=document&id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-3">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
        <Icon name="Plus" size={12} /> Добавить документ
      </button>
      {open && (
        <form onSubmit={save} className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Тип</label>
              <select value={form.doc_type} onChange={e => setForm(f => ({ ...f, doc_type: e.target.value as DocType }))} className={inp}>
                {(Object.entries(DOC_TYPE_LABELS) as [DocType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Дата документа</label><input type="date" value={form.doc_date} onChange={e => setForm(f => ({ ...f, doc_date: e.target.value }))} className={inp} /></div>
          </div>
          <div><label className={lbl}>Название *</label><input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} /></div>
          <div><label className={lbl}>Ссылка (URL)</label><input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://drive.google.com/..." className={inp} /></div>
          <div><label className={lbl}>Заметки</label><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inp} /></div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">{saving ? "..." : "Сохранить"}</button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-slate-800">Отмена</button>
          </div>
        </form>
      )}
      {loading ? <div className="text-center py-4 text-slate-300 text-xs">Загружаем...</div>
        : docs.length === 0 ? <div className="text-center py-6 text-slate-300 text-xs">Документов нет</div>
        : (
          <div className="space-y-2">
            {docs.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 group">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Icon name="FileText" size={13} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 leading-tight truncate">{d.title}</p>
                  <p className="text-xs text-slate-400">{DOC_TYPE_LABELS[d.doc_type]}{d.doc_date ? ` · ${fmtDate(d.doc_date)}` : ""}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="p-1 text-slate-400 hover:text-slate-800"><Icon name="ExternalLink" size={12} /></a>}
                  <button onClick={() => del(d.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500"><Icon name="Trash2" size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Метрики отношений ─────────────────────────────────────────────────────
export function MetricsSection({ donorType, donorId }: { donorType: DonorType; donorId: number }) {
  const [metrics, setMetrics] = useState<DonorMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ engagement_level: 3, support_probability: 50, interests: "", last_contact_at: "", next_step: "", next_step_date: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${CRM_URL}?type=metrics&donor_type=${donorType}&donor_id=${donorId}`)
      .then(r => r.json()).then(d => {
        setMetrics(d.metrics);
        if (d.metrics) {
          setForm({
            engagement_level: d.metrics.engagement_level,
            support_probability: d.metrics.support_probability,
            interests: d.metrics.interests || "",
            last_contact_at: d.metrics.last_contact_at || "",
            next_step: d.metrics.next_step || "",
            next_step_date: d.metrics.next_step_date || "",
          });
        }
      }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [donorId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`${CRM_URL}?type=metrics`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donor_type: donorType, donor_id: donorId, ...form }),
    });
    setSaving(false); setEditing(false); load();
  };

  const LEVELS = ["", "Холодный", "Тёплый", "Лояльный", "Активный", "Чемпион"];
  const engColor = (l: number) => ["", "text-slate-500", "text-blue-500", "text-amber-500", "text-green-600", "text-violet-600"][l] || "text-slate-800";

  if (loading) return <div className="text-center py-4 text-slate-300 text-xs">Загружаем...</div>;

  return (
    <div className="space-y-3">
      {!editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-400 mb-1">Вовлечённость</p>
              <p className={`text-lg font-bold ${engColor(metrics?.engagement_level || 0)}`}>
                {"★".repeat(metrics?.engagement_level || 0)}{"☆".repeat(5 - (metrics?.engagement_level || 0))}
              </p>
              <p className="text-xs text-slate-500">{LEVELS[metrics?.engagement_level || 0] || "Не указано"}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-400 mb-1">Вероятность поддержки</p>
              <p className="text-2xl font-bold text-slate-800">{metrics?.support_probability ?? "—"}%</p>
              <div className="h-1.5 bg-slate-50 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${metrics?.support_probability || 0}%` }} />
              </div>
            </div>
          </div>
          {metrics?.interests && (
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-400 mb-1">Направления интереса</p>
              <p className="text-sm text-slate-800">{metrics.interests}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-400 mb-1">Последний контакт</p>
              <p className="text-sm text-slate-800 font-medium">{fmtDate(metrics?.last_contact_at || null)}</p>
            </div>
            <div className={`bg-white rounded-xl border p-3 ${isOverdue(metrics?.next_step_date || null) ? "border-red-200 bg-red-50" : "border-slate-200"}`}>
              <p className="text-xs text-slate-400 mb-1">Следующий шаг</p>
              <p className={`text-sm font-medium ${isOverdue(metrics?.next_step_date || null) ? "text-red-600" : "text-slate-800"}`}>
                {metrics?.next_step || "—"}
              </p>
              {metrics?.next_step_date && <p className="text-xs text-slate-400 mt-0.5">{fmtDate(metrics.next_step_date)}</p>}
            </div>
          </div>
          <button onClick={() => setEditing(true)} className="text-xs text-slate-400 hover:text-slate-800 flex items-center gap-1">
            <Icon name="Pencil" size={11} /> Редактировать метрики
          </button>
        </div>
      ) : (
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Вовлечённость (1–5)</label>
              <input type="range" min="1" max="5" value={form.engagement_level} onChange={e => setForm(f => ({ ...f, engagement_level: parseInt(e.target.value) }))} className="w-full" />
              <p className="text-xs text-center font-medium mt-1 text-slate-500">{LEVELS[form.engagement_level]}</p>
            </div>
            <div>
              <label className={lbl}>Вероятность поддержки (%)</label>
              <input type="range" min="0" max="100" step="5" value={form.support_probability} onChange={e => setForm(f => ({ ...f, support_probability: parseInt(e.target.value) }))} className="w-full" />
              <p className="text-xs text-center font-medium mt-1 text-slate-500">{form.support_probability}%</p>
            </div>
          </div>
          <div><label className={lbl}>Интересующие направления</label><input value={form.interests} onChange={e => setForm(f => ({ ...f, interests: e.target.value }))} placeholder="Помощь детям, юридическая помощь..." className={inp} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>Дата последнего контакта</label><input type="date" value={form.last_contact_at} onChange={e => setForm(f => ({ ...f, last_contact_at: e.target.value }))} className={inp} /></div>
            <div><label className={lbl}>Дата следующего шага</label><input type="date" value={form.next_step_date} onChange={e => setForm(f => ({ ...f, next_step_date: e.target.value }))} className={inp} /></div>
          </div>
          <div><label className={lbl}>Следующий шаг</label><input value={form.next_step} onChange={e => setForm(f => ({ ...f, next_step: e.target.value }))} placeholder="Отправить отчёт, позвонить..." className={inp} /></div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">{saving ? "..." : "Сохранить"}</button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-slate-400 hover:text-slate-800">Отмена</button>
          </div>
        </form>
      )}
    </div>
  );
}
