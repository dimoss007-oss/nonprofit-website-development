import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { CRM_URL, DonorDocument, DocType, DOC_TYPE_LABELS } from "./fundraising.types";

const inp = "w-full border border-beige-dark rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40";
const lbl = "block text-xs uppercase tracking-widest text-ink/50 mb-1";

const DOC_ICONS: Record<DocType, string> = {
  contract: "FileSignature", support_letter: "Mail", report: "BarChart2",
  presentation: "Presentation", template: "Copy", other: "File",
};
const DOC_COLORS: Record<DocType, string> = {
  contract: "bg-violet-100 text-violet-700",
  support_letter: "bg-blue-100 text-blue-700",
  report: "bg-green-100 text-green-700",
  presentation: "bg-amber-100 text-amber-700",
  template: "bg-teal-100 text-teal-700",
  other: "bg-beige-dark text-ink/60",
};

export default function FundraisingDocsTab() {
  const [docs, setDocs] = useState<DonorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ doc_type: "contract" as DocType, title: "", url: "", notes: "", doc_date: "" });
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<DocType | "all">("all");

  const load = () => {
    setLoading(true);
    fetch(`${CRM_URL}?type=documents&all=1`).then(r => r.json()).then(d => setDocs(d.documents || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await fetch(`${CRM_URL}?type=document`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
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

  const filtered = filterType === "all" ? docs : docs.filter(d => d.doc_type === filterType);
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("ru-RU") : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cormorant text-ink text-2xl font-semibold">Документы</h2>
          <p className="text-xs text-ink/40 mt-0.5">{docs.length} документов</p>
        </div>
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90">
          <Icon name="Plus" size={15} /> Добавить
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="bg-white border border-beige-dark rounded-2xl p-5 space-y-3">
          <h3 className="font-semibold text-ink text-sm">Новый документ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Тип</label>
              <select value={form.doc_type} onChange={e => setForm(f => ({ ...f, doc_type: e.target.value as DocType }))} className={inp}>
                {(Object.entries(DOC_TYPE_LABELS) as [DocType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Дата документа</label>
              <input type="date" value={form.doc_date} onChange={e => setForm(f => ({ ...f, doc_date: e.target.value }))} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Название *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Ссылка (Google Drive, Яндекс Диск…)</label>
              <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Заметки</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inp} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-ink text-beige px-5 py-2 rounded-xl text-sm font-semibold hover:bg-ink/90 disabled:opacity-50">{saving ? "Сохраняем..." : "Сохранить"}</button>
            <button type="button" onClick={() => setOpen(false)} className="px-5 py-2 rounded-xl text-sm border border-beige-dark text-ink/60 hover:text-ink">Отмена</button>
          </div>
        </form>
      )}

      {/* Фильтр по типу */}
      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={() => setFilterType("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === "all" ? "bg-ink text-beige" : "bg-beige-mid text-ink/50 hover:text-ink"}`}>
          Все ({docs.length})
        </button>
        {(Object.keys(DOC_TYPE_LABELS) as DocType[]).filter(k => docs.some(d => d.doc_type === k)).map(k => (
          <button key={k} onClick={() => setFilterType(k)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === k ? "bg-ink text-beige" : "bg-beige-mid text-ink/50 hover:text-ink"}`}>
            {DOC_TYPE_LABELS[k]} ({docs.filter(d => d.doc_type === k).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-ink/40"><Icon name="FolderOpen" size={36} className="mx-auto mb-3 opacity-30" /><p>Документов нет</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(d => (
            <div key={d.id} className="bg-white rounded-2xl border border-beige-dark p-4 flex items-start gap-3 group hover:shadow-sm transition-shadow">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${DOC_COLORS[d.doc_type]}`}>
                <Icon name={DOC_ICONS[d.doc_type] || "File"} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink leading-tight">{d.title}</p>
                <p className="text-xs text-ink/40 mt-0.5">
                  {DOC_TYPE_LABELS[d.doc_type]}
                  {d.doc_date ? ` · ${fmtDate(d.doc_date)}` : ""}
                </p>
                {d.notes && <p className="text-xs text-ink/50 mt-0.5 truncate">{d.notes}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {d.url && (
                  <a href={d.url} target="_blank" rel="noreferrer" className="p-1.5 text-ink/40 hover:text-ink rounded-lg hover:bg-beige-mid transition-colors">
                    <Icon name="ExternalLink" size={13} />
                  </a>
                )}
                <button onClick={() => del(d.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-ink/30 hover:text-red-500 rounded-lg transition-all">
                  <Icon name="Trash2" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
