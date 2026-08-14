import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PatientChat from "@/components/admin/PatientChat";
import PatientDynamics from "@/components/admin/PatientDynamics";

const API = "https://functions.poehali.dev/c30060e8-222e-48b5-823a-3f1a5b44fbd5";
const UPLOAD_API = "https://functions.poehali.dev/8a6d9ba2-3c66-4604-bccf-68b50295e021";

type Child = { id: number; last_name?: string; first_name: string; middle_name?: string; birth_date?: string; photo_url?: string };
type Document = { id: number; file_name: string; file_url: string; file_type?: string; file_size?: number; uploaded_at: string };
type RiskLevel = "none" | "attention" | "high" | null | undefined;
type Patient = {
  id: number; last_name: string; first_name: string; middle_name?: string;
  birth_date?: string; address?: string; admission_date?: string; discharge_date?: string;
  case_description?: string; created_at: string; children_count?: number;
  passport_series?: string; passport_number?: string;
  passport_issued_date?: string; passport_issued_by?: string;
  photo_url?: string; risk_level?: RiskLevel;
};
type PatientFull = { patient: Patient; children: Child[]; documents: Document[]; latest_risk_level?: RiskLevel };

const RISK_META: Record<string, { label: string; badge: string }> = {
  none: { label: "Норма", badge: "bg-green-100 text-green-700" },
  attention: { label: "Внимание", badge: "bg-amber-100 text-amber-700" },
  high: { label: "Высокий риск", badge: "bg-red-100 text-red-700" },
};

function RiskBadge({ level }: { level: RiskLevel }) {
  if (!level || !RISK_META[level]) return null;
  const m = RISK_META[level];
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${m.badge}`}>{m.label}</span>;
}

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}
function fmtSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function stayDuration(admission?: string, discharge?: string): string | null {
  if (!admission) return null;
  const from = new Date(admission);
  const to = discharge ? new Date(discharge) : new Date();
  if (isNaN(from.getTime())) return null;
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  if (days < 0) { months--; days += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "год" : years < 5 ? "года" : "лет"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "месяц" : months < 5 ? "месяца" : "месяцев"}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"}`);
  return parts.join(" ");
}

const EMPTY_FORM = { last_name: "", first_name: "", middle_name: "", birth_date: "", address: "", admission_date: "", discharge_date: "", case_description: "", passport_series: "", passport_number: "", passport_issued_date: "", passport_issued_by: "" };

function PatientForm({ initial, onSave, onCancel, loading }: { initial?: Partial<typeof EMPTY_FORM>; onSave: (data: typeof EMPTY_FORM) => void; onCancel: () => void; loading: boolean }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><label className="text-xs text-ink/50 mb-1 block">Фамилия *</label><input value={form.last_name} onChange={set("last_name")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
        <div><label className="text-xs text-ink/50 mb-1 block">Имя *</label><input value={form.first_name} onChange={set("first_name")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
        <div><label className="text-xs text-ink/50 mb-1 block">Отчество</label><input value={form.middle_name} onChange={set("middle_name")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><label className="text-xs text-ink/50 mb-1 block">Дата рождения</label><input type="date" value={form.birth_date} onChange={set("birth_date")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
        <div><label className="text-xs text-ink/50 mb-1 block">Дата поступления</label><input type="date" value={form.admission_date} onChange={set("admission_date")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
        <div><label className="text-xs text-ink/50 mb-1 block">Дата выписки</label><input type="date" value={form.discharge_date} onChange={set("discharge_date")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
      </div>
      <div><label className="text-xs text-ink/50 mb-1 block">Прописка</label><input value={form.address} onChange={set("address")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
      <div className="pt-1">
        <p className="text-xs font-semibold text-ink/40 uppercase tracking-wide mb-2">Паспорт</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><label className="text-xs text-ink/50 mb-1 block">Серия</label><input value={form.passport_series} onChange={set("passport_series")} placeholder="1234" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
          <div><label className="text-xs text-ink/50 mb-1 block">Номер</label><input value={form.passport_number} onChange={set("passport_number")} placeholder="567890" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
          <div className="col-span-2"><label className="text-xs text-ink/50 mb-1 block">Дата выдачи</label><input type="date" value={form.passport_issued_date} onChange={set("passport_issued_date")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
        </div>
        <div className="mt-3"><label className="text-xs text-ink/50 mb-1 block">Кем выдан</label><input value={form.passport_issued_by} onChange={set("passport_issued_by")} placeholder="Отделом УФМС России..." className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
      </div>
      <div><label className="text-xs text-ink/50 mb-1 block">Описание случая</label><textarea value={form.case_description} onChange={set("case_description")} rows={4} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none" /></div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отмена</button>
        <button onClick={() => onSave(form)} disabled={loading || !form.last_name || !form.first_name} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60">{loading ? "Сохранение..." : "Сохранить"}</button>
      </div>
    </div>
  );
}

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

function ChildRow({ child, onUpdate, onDelete, onUploadPhoto, isAdmin }: { child: Child; onUpdate: (id: number, data: Omit<Child, "id">) => void; onDelete: (id: number) => void; onUploadPhoto: (childId: number, file: File) => void; isAdmin: boolean }) {
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [form, setForm] = useState({ last_name: child.last_name ?? "", first_name: child.first_name, middle_name: child.middle_name ?? "", birth_date: child.birth_date?.slice(0, 10) ?? "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const photoRef = useRef<HTMLInputElement>(null);
  const save = () => { onUpdate(child.id, form); setEditing(false); };
  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingPhoto(true);
    try { await onUploadPhoto(child.id, file); } finally { setUploadingPhoto(false); }
  };
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
      <div className="flex items-center gap-3">
        <button onClick={() => photoRef.current?.click()} className="relative w-9 h-9 rounded-full overflow-hidden bg-beige-mid flex items-center justify-center flex-shrink-0 border border-beige-dark hover:border-ink transition-colors">
          {child.photo_url ? (
            <img src={child.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icon name="User" size={14} className="text-ink/30" />
          )}
          {uploadingPhoto && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Icon name="Loader" size={12} className="animate-spin text-white" /></div>}
        </button>
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        <div>
          <span className="text-sm text-ink">{[child.last_name, child.first_name, child.middle_name].filter(Boolean).join(" ")}</span>
          {child.birth_date && <span className="text-xs text-ink/40 ml-2">{fmt(child.birth_date)}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1 text-ink/40 hover:text-ink transition-colors"><Icon name="Pencil" size={13} /></button>
        {isAdmin && <button onClick={() => onDelete(child.id)} className="p-1 text-ink/30 hover:text-red-400 transition-colors"><Icon name="X" size={14} /></button>}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div><span className="text-xs text-ink/40 uppercase tracking-wide">{label}</span><p className="text-sm text-ink mt-0.5">{value}</p></div>
  );
}

function PatientCard({ patientId, onBack, onDeleted, isAdmin, authorName }: { patientId: number; onBack: () => void; onDeleted: () => void; isAdmin: boolean; authorName: string }) {
  const [data, setData] = useState<PatientFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const readAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    const r = await fetch(`${API}?id=${patientId}`);
    setData(await r.json());
    if (showSpinner) setLoading(false);
  };

  useEffect(() => { load(true); }, [patientId]);

  const save = async (form: typeof EMPTY_FORM) => {
    setSaving(true);
    await fetch(`${API}?id=${patientId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setEditing(false); load();
  };

  const deletePatient = async () => {
    if (!confirm("Удалить пациента и все его данные?")) return;
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_patient", patient_id: patientId }) });
    onDeleted();
  };

  const addChild = async (c: Omit<Child, "id">) => {
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_child", patient_id: patientId, ...c }) });
    setAddingChild(false); load();
  };

  const deleteChild = async (childId: number) => {
    if (!confirm("Удалить запись о ребёнке?")) return;
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_child", child_id: childId }) });
    load();
  };

  const updateChild = async (childId: number, d: Omit<Child, "id">) => {
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_child", child_id: childId, ...d }) });
    load();
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const input = e.target;
    if (!files.length) return;
    setUploading(true);
    await Promise.all(files.map(async (file) => {
      const base64 = await readAsBase64(file);
      await fetch(UPLOAD_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient_id: patientId, file_name: file.name, file_data: base64, file_type: file.type }) });
    }));
    input.value = "";
    setUploading(false);
    load();
  };

  const uploadPatientPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const base64 = await readAsBase64(file);
      await fetch(UPLOAD_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient_id: patientId, file_name: file.name, file_data: base64, file_type: file.type, target: "patient_photo" }) });
      await load();
    } finally {
      setUploadingPhoto(false);
    }
  };

  const uploadChildPhoto = async (childId: number, file: File) => {
    const base64 = await readAsBase64(file);
    await fetch(UPLOAD_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient_id: patientId, child_id: childId, file_name: file.name, file_data: base64, file_type: file.type, target: "child_photo" }) });
    await load();
  };

  const discharge = async () => {
    const today = new Date().toISOString().slice(0, 10);
    await fetch(`${API}?id=${patientId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data!.patient, birth_date: data!.patient.birth_date?.slice(0, 10) ?? "", admission_date: data!.patient.admission_date?.slice(0, 10) ?? "", passport_issued_date: data!.patient.passport_issued_date?.slice(0, 10) ?? "", discharge_date: today }) });
    load();
  };

  const readmit = async () => {
    await fetch(`${API}?id=${patientId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data!.patient, birth_date: data!.patient.birth_date?.slice(0, 10) ?? "", admission_date: data!.patient.admission_date?.slice(0, 10) ?? "", passport_issued_date: data!.patient.passport_issued_date?.slice(0, 10) ?? "", discharge_date: "" }) });
    load();
  };

  const deleteDoc = async (docId: number) => {
    if (!confirm("Удалить документ?")) return;
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_document", document_id: docId }) });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return null;

  const { patient, children, documents, latest_risk_level } = data;
  const fullName = [patient.last_name, patient.first_name, patient.middle_name].filter(Boolean).join(" ");
  const duration = stayDuration(patient.admission_date, patient.discharge_date);
  const isActive = !patient.discharge_date;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-beige-mid transition-colors"><Icon name="ArrowLeft" size={18} /></button>
        <button onClick={() => photoRef.current?.click()} className="relative w-12 h-12 rounded-full overflow-hidden bg-beige-mid flex items-center justify-center flex-shrink-0 border border-beige-dark hover:border-ink transition-colors">
          {patient.photo_url ? (
            <img src={patient.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icon name="User" size={18} className="text-ink/30" />
          )}
          {uploadingPhoto && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Icon name="Loader" size={14} className="animate-spin text-white" /></div>}
        </button>
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={uploadPatientPhoto} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-cormorant text-ink text-2xl font-semibold">{fullName}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-beige-dark text-ink/50"}`}>
              {isActive ? "В центре" : "Выписана"}
            </span>
            <RiskBadge level={latest_risk_level} />
          </div>
          <p className="text-ink/50 text-sm">Поступила: {fmt(patient.admission_date)}</p>
        </div>
        <button onClick={() => setEditing(e => !e)} className="px-3 py-1.5 text-sm border border-beige-dark rounded-lg hover:border-ink transition-colors flex items-center gap-1.5">
          <Icon name="Pencil" size={14} /> Редактировать
        </button>
        {isActive ? (
          <button onClick={() => confirm("Выписать пациента? Будет установлена сегодняшняя дата.") && discharge()} className="px-3 py-1.5 text-sm border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-1.5">
            <Icon name="LogOut" size={14} /> Выписать
          </button>
        ) : (
          <button onClick={readmit} className="px-3 py-1.5 text-sm border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1.5">
            <Icon name="LogIn" size={14} /> Вернуть в центр
          </button>
        )}
        {isAdmin && (
          <button onClick={deletePatient} className="px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5">
            <Icon name="Trash2" size={14} /> Удалить
          </button>
        )}
      </div>

      {editing && (
        <div className="bg-white border border-beige-dark rounded-2xl p-6">
          <h3 className="font-semibold text-ink mb-4">Редактирование</h3>
          <PatientForm initial={{ last_name: patient.last_name, first_name: patient.first_name, middle_name: patient.middle_name ?? "", birth_date: patient.birth_date?.slice(0, 10) ?? "", address: patient.address ?? "", admission_date: patient.admission_date?.slice(0, 10) ?? "", discharge_date: patient.discharge_date?.slice(0, 10) ?? "", case_description: patient.case_description ?? "", passport_series: patient.passport_series ?? "", passport_number: patient.passport_number ?? "", passport_issued_date: patient.passport_issued_date?.slice(0, 10) ?? "", passport_issued_by: patient.passport_issued_by ?? "" }} onSave={save} onCancel={() => setEditing(false)} loading={saving} />
        </div>
      )}

      <Tabs defaultValue="data" className="w-full">
        <TabsList>
          <TabsTrigger value="data">Данные</TabsTrigger>
          <TabsTrigger value="dynamics">Динамика</TabsTrigger>
          <TabsTrigger value="chat">Отчёты / AI-чат</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-6 mt-4">
          {duration && (
            <div className={`rounded-2xl p-5 flex items-center gap-4 ${isActive ? "bg-green-50 border border-green-200" : "bg-beige border border-beige-dark"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-green-100" : "bg-beige-dark"}`}>
                <Icon name="Timer" size={18} className={isActive ? "text-green-600" : "text-ink/40"} />
              </div>
              <div>
                <p className="text-xs text-ink/40 uppercase tracking-wide mb-0.5">{isActive ? "Находится в центре" : "Находилась в центре"}</p>
                <p className="font-semibold text-ink text-lg leading-tight">{duration}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Личные данные</h3>
              <Row label="Дата рождения" value={fmt(patient.birth_date)} />
              <Row label="Прописка" value={patient.address || "—"} />
              <Row label="Дата поступления" value={fmt(patient.admission_date)} />
              <Row label="Дата выписки" value={fmt(patient.discharge_date)} />
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
              <button onClick={() => setAddingChild(true)} className="text-sm flex items-center gap-1 text-ink/60 hover:text-ink transition-colors"><Icon name="Plus" size={14} /> Добавить</button>
            </div>
            {addingChild && <div className="mb-4"><ChildForm onAdd={addChild} onCancel={() => setAddingChild(false)} /></div>}
            {children.length === 0 && !addingChild && <p className="text-ink/40 text-sm">Нет данных о детях</p>}
            <div className="space-y-1">{children.map(c => <ChildRow key={c.id} child={c} onUpdate={updateChild} onDelete={deleteChild} onUploadPhoto={uploadChildPhoto} isAdmin={isAdmin} />)}</div>
          </div>

          <div className="bg-white border border-beige-dark rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Документы ({documents.length})</h3>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="text-sm flex items-center gap-1 text-ink/60 hover:text-ink transition-colors disabled:opacity-50">
                <Icon name={uploading ? "Loader" : "Upload"} size={14} className={uploading ? "animate-spin" : ""} />
                {uploading ? "Загрузка..." : "Прикрепить"}
              </button>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={uploadFile} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
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
                    {isAdmin && <button onClick={() => deleteDoc(d.id)} className="p-1 text-ink/30 hover:text-red-400 transition-colors flex-shrink-0"><Icon name="X" size={14} /></button>}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dynamics" className="mt-4">
          <PatientDynamics patientId={patientId} authorName={authorName} />
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <PatientChat patientId={patientId} authorName={authorName} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}

export default function AdminCrmTab({ isAdmin = true, authorName = "Сотрудник" }: { isAdmin?: boolean; authorName?: string }) {
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    const r = await fetch(API);
    const d = await r.json();
    setAllPatients(d.patients || []);
    setLoading(false);
  };

  useEffect(() => { loadPatients(); }, []);

  const q = search.toLowerCase();
  const patients = search
    ? allPatients.filter(p => `${p.last_name} ${p.first_name} ${p.middle_name ?? ""}`.toLowerCase().includes(q))
    : allPatients;

  const inCenter = allPatients.filter(p => !p.discharge_date);
  const totalChildren = inCenter.reduce((s, p) => s + (Number(p.children_count) || 0), 0);
  const highRiskCount = inCenter.filter(p => p.risk_level === "high").length;

  const createPatient = async (form: typeof EMPTY_FORM) => {
    setSaving(true);
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    setSaving(false); setAdding(false);
    setSelectedId(d.patient?.id);
    loadPatients();
  };

  if (selectedId) return (
    <PatientCard patientId={selectedId} onBack={() => setSelectedId(null)} onDeleted={() => { setSelectedId(null); loadPatients(); }} isAdmin={isAdmin} authorName={authorName} />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cormorant text-ink text-2xl font-semibold">База пациентов</h2>
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors">
          <Icon name="UserPlus" size={16} /> Добавить
        </button>
      </div>

      {allPatients.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-green-200 rounded-2xl px-4 py-3.5 text-center">
            <p className="font-cormorant text-3xl font-semibold text-green-700">{inCenter.length}</p>
            <p className="text-xs text-ink/50 mt-0.5">{plural(inCenter.length, "пациентка", "пациентки", "пациенток")} в центре</p>
          </div>
          <div className="bg-white border border-beige-dark rounded-2xl px-4 py-3.5 text-center">
            <p className="font-cormorant text-3xl font-semibold text-ink">{totalChildren}</p>
            <p className="text-xs text-ink/50 mt-0.5">{plural(totalChildren, "ребёнок", "ребёнка", "детей")} с ними</p>
          </div>
          <div className={`bg-white border rounded-2xl px-4 py-3.5 text-center ${highRiskCount > 0 ? "border-red-200" : "border-beige-dark"}`}>
            <p className={`font-cormorant text-3xl font-semibold ${highRiskCount > 0 ? "text-red-600" : "text-ink"}`}>{highRiskCount}</p>
            <p className="text-xs text-ink/50 mt-0.5">высокий риск</p>
          </div>
          <div className="bg-white border border-beige-dark rounded-2xl px-4 py-3.5 text-center">
            <p className="font-cormorant text-3xl font-semibold text-ink">{allPatients.length}</p>
            <p className="text-xs text-ink/50 mt-0.5">всего в базе</p>
          </div>
        </div>
      )}

      {adding && (
        <div className="bg-white border border-beige-dark rounded-2xl p-6">
          <h3 className="font-semibold text-ink mb-4">Новый пациент</h3>
          <PatientForm onSave={createPatient} onCancel={() => setAdding(false)} loading={saving} />
        </div>
      )}

      <div className="relative">
        <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по фамилии, имени, отчеству..." className="w-full bg-white border border-beige-dark rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-ink" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>
      ) : patients.length === 0 ? (
        <div className="text-center py-16 text-ink/40">
          <Icon name="Users" size={40} className="mx-auto mb-3 opacity-30" />
          <p>{search ? "Ничего не найдено" : "Пациентов пока нет"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {patients.map(p => (
            <button key={p.id} onClick={() => setSelectedId(p.id)} className={`w-full bg-white border rounded-2xl px-5 py-4 text-left hover:border-ink transition-colors group ${p.discharge_date ? "border-beige-dark" : "border-green-200"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-beige-mid flex items-center justify-center flex-shrink-0 border border-beige-dark">
                    {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : <Icon name="User" size={16} className="text-ink/30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-ink">{p.last_name} {p.first_name} {p.middle_name ?? ""}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${p.discharge_date ? "bg-beige-dark text-ink/40" : "bg-green-100 text-green-700"}`}>
                        {p.discharge_date ? "Выписана" : "В центре"}
                      </span>
                      <RiskBadge level={p.risk_level} />
                      {!p.discharge_date && stayDuration(p.admission_date) && (
                        <span className="text-xs text-green-600 flex-shrink-0">{stayDuration(p.admission_date)}</span>
                      )}
                      {p.discharge_date && stayDuration(p.admission_date, p.discharge_date) && (
                        <span className="text-xs text-ink/40 flex-shrink-0">{stayDuration(p.admission_date, p.discharge_date)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                      {p.birth_date && <span className="text-xs text-ink/40">Р. {fmt(p.birth_date)}</span>}
                      {p.admission_date && <span className="text-xs text-ink/40">Поступила: {fmt(p.admission_date)}</span>}
                      {p.discharge_date && <span className="text-xs text-ink/40">Выписана: {fmt(p.discharge_date)}</span>}
                      {(p.children_count ?? 0) > 0 && <span className="text-xs text-ink/40">{p.children_count} {Number(p.children_count) === 1 ? "ребёнок" : Number(p.children_count) < 5 ? "ребёнка" : "детей"}</span>}
                    </div>
                  </div>
                </div>
                <Icon name="ChevronRight" size={16} className="text-ink/30 group-hover:text-ink transition-colors flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}