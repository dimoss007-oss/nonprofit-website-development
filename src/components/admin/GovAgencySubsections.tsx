import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { GOV_API, inp, lbl, Agency, AgencyContact, GovDocument } from "./govAgency.types";

// ─── Строка контакта с инлайн-редактированием ───────────────────────────────
function ContactRow({ contact, onArchive, onUpdated }: {
  contact: AgencyContact;
  onArchive: (id: number) => void;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: contact.name, phone: contact.phone || "", role: contact.role || "" });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch(`${GOV_API}?type=contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contact.id, ...form }),
    });
    setSaving(false);
    setEditing(false);
    onUpdated();
  };

  if (editing) {
    return (
      <form onSubmit={save} className="bg-beige/60 rounded-xl p-3 space-y-2 border border-beige-dark">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className={lbl}>ФИО *</label>
            <input required autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inp} />
          </div>
          <div>
            <label className={lbl}>Телефон</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+7 (000) 000-00-00" className={inp} />
          </div>
          <div>
            <label className={lbl}>Должность</label>
            <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Начальник отдела" className={inp} />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="bg-ink text-beige px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">{saving ? "..." : "Сохранить"}</button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-ink/50 hover:text-ink">Отмена</button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-beige-dark bg-white group">
      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Icon name="User" size={12} className="text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink">{contact.name}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-ink/40">
          {contact.role && <span>{contact.role}</span>}
          {contact.phone && <span className="flex items-center gap-1"><Icon name="Smartphone" size={10} />{contact.phone}</span>}
        </div>
      </div>
      <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/30 hover:text-ink transition-all flex-shrink-0" title="Редактировать">
        <Icon name="Pencil" size={12} />
      </button>
      <button onClick={() => onArchive(contact.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/30 hover:text-red-500 transition-all flex-shrink-0" title="Удалить">
        <Icon name="Trash2" size={12} />
      </button>
    </div>
  );
}

// ─── Контактные лица ────────────────────────────────────────────────────────
export function AgencyContacts({ agency }: { agency: Agency }) {
  const [contacts, setContacts] = useState<AgencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", role: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${GOV_API}?type=contacts&agency_id=${agency.id}`)
      .then(r => r.json())
      .then(d => setContacts(d.contacts || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [agency.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch(`${GOV_API}?type=contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, agency_id: agency.id }),
    });
    setSaving(false);
    setOpen(false);
    setForm({ name: "", phone: "", role: "" });
    load();
  };

  const archive = async (id: number) => {
    await fetch(`${GOV_API}?type=archive_contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="border-t border-beige-dark/50 pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-ink/50 uppercase tracking-wider">Контактные лица</p>
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5 text-xs bg-ink text-beige px-3 py-1.5 rounded-lg hover:bg-ink/90 transition-colors">
          <Icon name="Plus" size={11} /> Добавить
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="bg-beige/60 rounded-xl p-3 space-y-2 border border-beige-dark mb-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className={lbl}>ФИО *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Иванов Иван Иванович" className={inp} />
            </div>
            <div>
              <label className={lbl}>Телефон</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+7 (000) 000-00-00" className={inp} />
            </div>
            <div>
              <label className={lbl}>Должность</label>
              <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Начальник отдела" className={inp} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-ink text-beige px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">{saving ? "..." : "Сохранить"}</button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink/50 hover:text-ink">Отмена</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-xs text-ink/30 py-2">Загружаем...</div>
      ) : contacts.length === 0 ? (
        <div className="text-xs text-ink/30 italic py-1">Контактов нет</div>
      ) : (
        <div className="space-y-1.5">
          {contacts.map(c => (
            <ContactRow key={c.id} contact={c} onArchive={archive} onUpdated={load} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Документы конкретного органа ──────────────────────────────────────────
export function AgencyDocs({ agency }: { agency: Agency }) {
  const [docs, setDocs] = useState<GovDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", url: "", notes: "", doc_date: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${GOV_API}?type=documents&agency_id=${agency.id}`)
      .then(r => r.json())
      .then(d => setDocs(d.documents || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [agency.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch(`${GOV_API}?type=document`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, agency_id: agency.id }),
    });
    setSaving(false);
    setOpen(false);
    setForm({ title: "", url: "", notes: "", doc_date: "" });
    load();
  };

  const archive = async (id: number) => {
    if (!confirm("Удалить документ?")) return;
    await fetch(`${GOV_API}?type=archive_document`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("ru-RU") : "—";

  return (
    <div className="border-t border-beige-dark/50 pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-ink/50 uppercase tracking-wider">Документы</p>
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5 text-xs bg-ink text-beige px-3 py-1.5 rounded-lg hover:bg-ink/90 transition-colors">
          <Icon name="Plus" size={11} /> Добавить
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="bg-beige/60 rounded-xl p-3 space-y-2 border border-beige-dark mb-3">
          <div>
            <label className={lbl}>Название *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Ссылка (URL)</label>
              <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." className={inp} />
            </div>
            <div>
              <label className={lbl}>Дата документа</label>
              <input type="date" value={form.doc_date} onChange={e => setForm(f => ({ ...f, doc_date: e.target.value }))} className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Заметки</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inp} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-ink text-beige px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">{saving ? "..." : "Сохранить"}</button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink/50 hover:text-ink">Отмена</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-xs text-ink/30 py-2">Загружаем...</div>
      ) : docs.length === 0 ? (
        <div className="text-xs text-ink/30 italic py-1">Документов нет</div>
      ) : (
        <div className="space-y-1.5">
          {docs.map(d => (
            <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-beige-dark bg-white group">
              <div className="w-6 h-6 rounded-lg bg-beige-mid flex items-center justify-center flex-shrink-0">
                <Icon name="FileText" size={12} className="text-ink/50" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{d.title}</p>
                <p className="text-xs text-ink/40">{fmtDate(d.doc_date)}{d.notes ? ` · ${d.notes}` : ""}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {d.url && (
                  <a href={d.url} target="_blank" rel="noreferrer" className="p-1 text-ink/40 hover:text-ink" title="Открыть">
                    <Icon name="ExternalLink" size={12} />
                  </a>
                )}
                <button onClick={() => archive(d.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/30 hover:text-red-500 transition-all">
                  <Icon name="Trash2" size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}