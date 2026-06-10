import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { API, UPLOAD_API, EMPTY_FORM, Child, Document, PatientFull, fmt, fmtSize } from "./crmTypes";

// ── Row ─────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-ink/40 uppercase tracking-wide">{label}</span>
      <p className="text-sm text-ink mt-0.5">{value}</p>
    </div>
  );
}

// ── PatientForm ─────────────────────────────────────────
export function PatientForm({ initial, onSave, onCancel, loading }: {
  initial?: Partial<typeof EMPTY_FORM>;
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Фамилия *</label>
          <input value={form.last_name} onChange={set("last_name")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Имя *</label>
          <input value={form.first_name} onChange={set("first_name")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Отчество</label>
          <input value={form.middle_name} onChange={set("middle_name")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Дата рождения</label>
          <input type="date" value={form.birth_date} onChange={set("birth_date")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Дата поступления</label>
          <input type="date" value={form.admission_date} onChange={set("admission_date")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
      </div>
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Прописка</label>
        <input value={form.address} onChange={set("address")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
      </div>
      <div className="pt-1">
        <p className="text-xs font-semibold text-ink/40 uppercase tracking-wide mb-2">Паспорт</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Серия</label>
            <input value={form.passport_series} onChange={set("passport_series")} placeholder="1234" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
          </div>
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Номер</label>
            <input value={form.passport_number} onChange={set("passport_number")} placeholder="567890" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-ink/50 mb-1 block">Дата выдачи</label>
            <input type="date" value={form.passport_issued_date} onChange={set("passport_issued_date")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs text-ink/50 mb-1 block">Кем выдан</label>
          <input value={form.passport_issued_by} onChange={set("passport_issued_by")} placeholder="Отделом УФМС России..." className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
      </div>
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Описание случая</label>
        <textarea value={form.case_description} onChange={set("case_description")} rows={4} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отмена</button>
        <button onClick={() => onSave(form)} disabled={loading || !form.last_name || !form.first_name} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60">
          {loading ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
}

// ── ChildForm ───────────────────────────────────────────
function ChildForm({ onAdd, onCancel }: { onAdd: (c: Omit<Child, "id">) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ last_name: "", first_name: "", middle_name: "", birth_date: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="bg-beige-mid rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-ink">Добавить ребёнка</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input placeholder="Фамилия" value={form.last_name} onChange={set("last_name")} className="border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        <input placeholder="Имя *" value={form.first_name} onChange={set("first_name")} className="border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        <input placeholder="Отчество" value={form.middle_name} onChange={set("middle_name")} className="border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
      </div>
      <div className="flex items-center gap-3">
        <input type="date" value={form.birth_date} onChange={set("birth_date")} className="border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        <button onClick={() => form.first_name && onAdd(form)} disabled={!form.first_name} className="px-4 py-2 bg-ink text-beige text-sm rounded-lg hover:bg-ink/90 disabled:opacity-60">Добавить</button>
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink">Отмена</button>
      </div>
    </div>
  );
}

// ── ChildRow ────────────────────────────────────────────
function ChildRow({ child, onUpdate, onDelete }: {
  child: Child;
  onUpdate: (id: number, data: Omit<Child, "id">) => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ last_name: child.last_name ?? "", first_name: child.first_name, middle_name: child.middle_name ?? "", birth_date: child.birth_date?.slice(0, 10) ?? "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = () => { onUpdate(child.id, form); setEditing(false); };

  if (editing) return (
    <div className="bg-beige-mid rounded-xl p-3 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input placeholder="Фамилия" value={form.last_name} onChange={set("last_name")} className="border border-beige-dark bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-ink" />
        <input placeholder="Имя *" value={form.first_name} onChange={set("first_name")} className="border border-beige-dark bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-ink" />
        <input placeholder="Отчество" value={form.middle_name} onChange={set("middle_name")} className="border border-beige-dark bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-ink" />
      </div>
      <div className="flex items-center gap-2">
        <input type="date" value={form.birth_date} onChange={set("birth_date")} className="border border-beige-dark bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-ink" />
        <button onClick={save} disabled={!form.first_name} className="px-3 py-1.5 bg-ink text-beige text-sm rounded-lg hover:bg-ink/90 disabled:opacity-60">Сохранить</button>
        <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm rounded-lg border border-beige-dark hover:border-ink">Отмена</button>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-between py-2 border-b border-beige-mid last:border-0 group">
      <div>
        <span className="text-sm text-ink">{[child.last_name, child.first_name, child.middle_name].filter(Boolean).join(" ")}</span>
        {child.birth_date && <span className="text-xs text-ink/40 ml-2">{fmt(child.birth_date)}</span>}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1 text-ink/40 hover:text-ink transition-colors">
          <Icon name="Pencil" size={13} />
        </button>
        <button onClick={() => onDelete(child.id)} className="p-1 text-ink/30 hover:text-red-400 transition-colors">
          <Icon name="X" size={14} />
        </button>
      </div>
    </div>
  );
}

// ── PatientCard ─────────────────────────────────────────
export default function PatientCard({ patientId, onBack, onDeleted }: { patientId: number; onBack: () => void; onDeleted: () => void }) {
  const [data, setData] = useState<PatientFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const r = await fetch(`${API}?id=${patientId}`);
    const d = await r.json();
    setData(d);
    setLoading(false);
  };

  useEffect(() => { load(); }, [patientId]);

  const save = async (form: typeof EMPTY_FORM) => {
    setSaving(true);
    await fetch(`${API}?id=${patientId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setEditing(false);
    load();
  };

  const deletePatient = async () => {
    if (!confirm("Удалить пациента и все его данные?")) return;
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_patient", patient_id: patientId }) });
    onDeleted();
  };

  const addChild = async (c: Omit<Child, "id">) => {
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_child", patient_id: patientId, ...c }) });
    setAddingChild(false);
    load();
  };

  const deleteChild = async (childId: number) => {
    if (!confirm("Удалить запись о ребёнке?")) return;
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_child", child_id: childId }) });
    load();
  };

  const updateChild = async (childId: number, data: Omit<Child, "id">) => {
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_child", child_id: childId, ...data }) });
    load();
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      await fetch(UPLOAD_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient_id: patientId, file_name: file.name, file_data: base64, file_type: file.type }) });
      setUploading(false);
      load();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const deleteDoc = async (docId: number) => {
    if (!confirm("Удалить документ?")) return;
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_document", document_id: docId }) });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return null;

  const { patient, children, documents } = data;
  const fullName = [patient.last_name, patient.first_name, patient.middle_name].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-beige-mid transition-colors">
          <Icon name="ArrowLeft" size={18} />
        </button>
        <div className="flex-1">
          <h2 className="font-cormorant text-ink text-2xl font-semibold">{fullName}</h2>
          <p className="text-ink/50 text-sm">Поступила: {fmt(patient.admission_date)}</p>
        </div>
        <button onClick={() => setEditing(e => !e)} className="px-3 py-1.5 text-sm border border-beige-dark rounded-lg hover:border-ink transition-colors flex items-center gap-1.5">
          <Icon name="Pencil" size={14} /> Редактировать
        </button>
        <button onClick={deletePatient} className="px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5">
          <Icon name="Trash2" size={14} /> Удалить
        </button>
      </div>

      {editing && (
        <div className="bg-white border border-beige-dark rounded-2xl p-6">
          <h3 className="font-semibold text-ink mb-4">Редактирование</h3>
          <PatientForm
            initial={{ last_name: patient.last_name, first_name: patient.first_name, middle_name: patient.middle_name ?? "", birth_date: patient.birth_date?.slice(0, 10) ?? "", address: patient.address ?? "", admission_date: patient.admission_date?.slice(0, 10) ?? "", case_description: patient.case_description ?? "", passport_series: patient.passport_series ?? "", passport_number: patient.passport_number ?? "", passport_issued_date: patient.passport_issued_date?.slice(0, 10) ?? "", passport_issued_by: patient.passport_issued_by ?? "" }}
            onSave={save} onCancel={() => setEditing(false)} loading={saving}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-3">
          <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Личные данные</h3>
          <Row label="Дата рождения" value={fmt(patient.birth_date)} />
          <Row label="Прописка" value={patient.address || "—"} />
          <Row label="Дата поступления" value={fmt(patient.admission_date)} />
        </div>
        <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-3">
          <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Паспорт</h3>
          <Row label="Серия и номер" value={[patient.passport_series, patient.passport_number].filter(Boolean).join(" ") || "—"} />
          <Row label="Дата выдачи" value={fmt(patient.passport_issued_date)} />
          <Row label="Кем выдан" value={patient.passport_issued_by || "—"} />
        </div>
      </div>
      <div className="bg-white border border-beige-dark rounded-2xl p-5">
        <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-3">Описание случая</h3>
        <p className="text-sm text-ink/70 whitespace-pre-wrap">{patient.case_description || "Не заполнено"}</p>
      </div>

      <div className="bg-white border border-beige-dark rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Дети ({children.length})</h3>
          <button onClick={() => setAddingChild(true)} className="text-sm flex items-center gap-1 text-ink/60 hover:text-ink transition-colors">
            <Icon name="Plus" size={14} /> Добавить
          </button>
        </div>
        {addingChild && <div className="mb-4"><ChildForm onAdd={addChild} onCancel={() => setAddingChild(false)} /></div>}
        {children.length === 0 && !addingChild && <p className="text-ink/40 text-sm">Нет данных о детях</p>}
        <div className="space-y-1">
          {children.map(c => (
            <ChildRow key={c.id} child={c} onUpdate={updateChild} onDelete={deleteChild} />
          ))}
        </div>
      </div>

      <div className="bg-white border border-beige-dark rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Документы ({documents.length})</h3>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="text-sm flex items-center gap-1 text-ink/60 hover:text-ink transition-colors disabled:opacity-50">
            <Icon name={uploading ? "Loader" : "Upload"} size={14} className={uploading ? "animate-spin" : ""} />
            {uploading ? "Загрузка..." : "Прикрепить"}
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={uploadFile} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
        </div>
        {documents.length === 0 && <p className="text-ink/40 text-sm">Нет прикреплённых документов</p>}
        <div className="space-y-2">
          {documents.map(d => {
            const isImage = d.file_type?.startsWith("image/");
            return (
              <div key={d.id} className="flex items-center gap-3 py-2 border-b border-beige-mid last:border-0">
                <div className="w-8 h-8 bg-beige-mid rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name={isImage ? "Image" : "FileText"} size={14} className="text-ink/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-ink hover:underline truncate block">{d.file_name}</a>
                  <span className="text-xs text-ink/40">{fmtSize(d.file_size)} · {fmt(d.uploaded_at)}</span>
                </div>
                <button onClick={() => deleteDoc(d.id)} className="p-1 text-ink/30 hover:text-red-400 transition-colors flex-shrink-0">
                  <Icon name="X" size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
