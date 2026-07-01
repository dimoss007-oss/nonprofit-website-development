import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/afaf030c-c06d-4ad0-a892-c452595fa437";

const inp = "w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40";
const lbl = "block text-xs uppercase tracking-widest text-ink/50 mb-1";

interface Agency {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  service_phone: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
}

interface GovDocument {
  id: number;
  agency_id: number;
  title: string;
  url: string | null;
  notes: string | null;
  doc_date: string | null;
  created_at: string;
}

const emptyForm = (): Partial<Agency> => ({
  name: "", phone: "", address: "", service_phone: "",
  contact_person: "", contact_phone: "", notes: "",
});

// ─── Документы конкретного органа ──────────────────────────────────────────
function AgencyDocs({ agency }: { agency: Agency }) {
  const [docs, setDocs] = useState<GovDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", url: "", notes: "", doc_date: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${API}?type=documents&agency_id=${agency.id}`)
      .then(r => r.json())
      .then(d => setDocs(d.documents || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [agency.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, agency_id: agency.id, type: "document" }),
    });
    setSaving(false);
    setOpen(false);
    setForm({ title: "", url: "", notes: "", doc_date: "" });
    load();
  };

  const archive = async (id: number) => {
    if (!confirm("Удалить документ?")) return;
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: "archive_document" }),
    });
    load();
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("ru-RU") : "—";

  return (
    <div className="mt-4 pt-4 border-t border-beige-dark/50">
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

// ─── Карточка госоргана ────────────────────────────────────────────────────
function AgencyCard({ agency, onEdit, onArchive }: {
  agency: Agency;
  onEdit: (a: Agency) => void;
  onArchive: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-beige-dark shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="Landmark" size={16} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink text-sm leading-tight">{agency.name}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-ink/50">
                {agency.phone && <span className="flex items-center gap-1"><Icon name="Phone" size={11} />{agency.phone}</span>}
                {agency.service_phone && <span className="flex items-center gap-1"><Icon name="PhoneCall" size={11} />{agency.service_phone}</span>}
                {agency.address && <span className="flex items-center gap-1"><Icon name="MapPin" size={11} />{agency.address}</span>}
              </div>
              {(agency.contact_person || agency.contact_phone) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-ink/50">
                  {agency.contact_person && <span className="flex items-center gap-1"><Icon name="User" size={11} />{agency.contact_person}</span>}
                  {agency.contact_phone && <span className="flex items-center gap-1"><Icon name="Smartphone" size={11} />{agency.contact_phone}</span>}
                </div>
              )}
              {agency.notes && <p className="mt-2 text-xs text-ink/40 italic">{agency.notes}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onEdit(agency)} className="p-2 rounded-lg text-ink/40 hover:text-ink hover:bg-beige-mid transition-colors" title="Редактировать">
              <Icon name="Pencil" size={14} />
            </button>
            <button onClick={() => onArchive(agency.id)} className="p-2 rounded-lg text-ink/30 hover:text-red-500 hover:bg-red-50 transition-colors" title="Удалить">
              <Icon name="Trash2" size={14} />
            </button>
          </div>
        </div>

        <button onClick={() => setExpanded(o => !o)} className="mt-3 flex items-center gap-1.5 text-xs text-ink/40 hover:text-ink transition-colors">
          <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={13} />
          {expanded ? "Скрыть документы" : "Показать документы"}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-5">
          <AgencyDocs agency={agency} />
        </div>
      )}
    </div>
  );
}

// ─── Форма создания / редактирования ──────────────────────────────────────
function AgencyForm({ initial, onSave, onCancel }: {
  initial?: Partial<Agency>;
  onSave: (data: Partial<Agency>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Agency>>({ ...emptyForm(), ...initial });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Agency, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={lbl}>Наименование органа *</label>
          <input required value={form.name || ""} onChange={e => set("name", e.target.value)} placeholder="Министерство здравоохранения..." className={inp} />
        </div>
        <div>
          <label className={lbl}>Телефон организации</label>
          <input value={form.phone || ""} onChange={e => set("phone", e.target.value)} placeholder="+7 (000) 000-00-00" className={inp} />
        </div>
        <div>
          <label className={lbl}>Служебный номер</label>
          <input value={form.service_phone || ""} onChange={e => set("service_phone", e.target.value)} placeholder="Доб. 123" className={inp} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Адрес</label>
          <input value={form.address || ""} onChange={e => set("address", e.target.value)} placeholder="г. Москва, ул. Примерная, д. 1" className={inp} />
        </div>
        <div>
          <label className={lbl}>Контактное лицо</label>
          <input value={form.contact_person || ""} onChange={e => set("contact_person", e.target.value)} placeholder="Иванов Иван Иванович" className={inp} />
        </div>
        <div>
          <label className={lbl}>Личный номер контакта</label>
          <input value={form.contact_phone || ""} onChange={e => set("contact_phone", e.target.value)} placeholder="+7 (000) 000-00-00" className={inp} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Заметки</label>
          <textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={3} className={`${inp} resize-none`} />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving} className="bg-ink text-beige px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50">
          {saving ? "Сохраняем..." : "Сохранить"}
        </button>
        <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-sm text-ink/60 hover:text-ink border border-beige-dark transition-colors">
          Отмена
        </button>
      </div>
    </form>
  );
}

// ─── Главная вкладка ────────────────────────────────────────────────────────
export default function AdminGovTab() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAgency, setEditAgency] = useState<Agency | null>(null);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    fetch(`${API}?type=agencies`)
      .then(r => r.json())
      .then(d => setAgencies(d.agencies || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async (data: Partial<Agency>) => {
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, type: "agency" }),
    });
    setShowForm(false);
    setEditAgency(null);
    load();
  };

  const archive = async (id: number) => {
    if (!confirm("Удалить госорган?")) return;
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: "archive_agency" }),
    });
    load();
  };

  const filtered = agencies.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.contact_person || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.address || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-ink">Госорганы</h2>
          <p className="text-xs text-ink/40 mt-0.5">{agencies.length} {agencies.length === 1 ? "орган" : agencies.length < 5 ? "органа" : "органов"}</p>
        </div>
        <button
          onClick={() => { setEditAgency(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-ink text-beige px-4 py-2 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors"
        >
          <Icon name="Plus" size={14} /> Добавить орган
        </button>
      </div>

      {/* Форма */}
      {(showForm || editAgency) && (
        <div className="bg-beige/60 rounded-2xl border border-beige-dark p-5">
          <h3 className="text-sm font-semibold text-ink mb-4">{editAgency ? "Редактировать орган" : "Новый госорган"}</h3>
          <AgencyForm
            initial={editAgency || undefined}
            onSave={save}
            onCancel={() => { setShowForm(false); setEditAgency(null); }}
          />
        </div>
      )}

      {/* Поиск */}
      {agencies.length > 0 && (
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию, контакту, адресу..."
            className="w-full border border-beige-dark rounded-xl pl-9 pr-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-white"
          />
        </div>
      )}

      {/* Список */}
      {loading ? (
        <div className="text-center py-16 text-ink/30">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-ink/30">
          {search ? "Ничего не найдено" : "Госорганов пока нет — добавьте первый"}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(a => (
            <AgencyCard
              key={a.id}
              agency={a}
              onEdit={ag => { setEditAgency(ag); setShowForm(false); }}
              onArchive={archive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
