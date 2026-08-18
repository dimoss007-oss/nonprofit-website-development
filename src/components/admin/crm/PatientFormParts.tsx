import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Child, EMPTY_FORM, fmt } from "@/components/admin/crm/crmShared";
import ChildDailyReportsModal from "@/components/admin/crm/ChildDailyReportsModal";

export function PatientForm({ initial, onSave, onCancel, loading }: { initial?: Partial<typeof EMPTY_FORM>; onSave: (data: typeof EMPTY_FORM) => void; onCancel: () => void; loading: boolean }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><label className="text-xs text-ink/50 mb-1 block">Фамилия *</label><input value={form.last_name} onChange={set("last_name")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
        <div><label className="text-xs text-ink/50 mb-1 block">Имя *</label><input value={form.first_name} onChange={set("first_name")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
        <div><label className="text-xs text-ink/50 mb-1 block">Отчество</label><input value={form.middle_name} onChange={set("middle_name")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
      </div>
      <div><label className="text-xs text-ink/50 mb-1 block">Псевдоним</label><input value={form.alias} onChange={set("alias")} placeholder="Для внутреннего использования" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
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

const EMPTY_CHILD_FORM = { last_name: "", first_name: "", middle_name: "", birth_date: "", previous_education: "", current_education: "", extracurriculars: "" };

export function ChildForm({ onAdd, onCancel }: { onAdd: (c: Omit<Child, "id">) => void; onCancel: () => void }) {
  const [form, setForm] = useState(EMPTY_CHILD_FORM);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="bg-beige-mid rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-ink">Добавить ребёнка</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input placeholder="Фамилия" value={form.last_name} onChange={set("last_name")} className="border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        <input placeholder="Имя *" value={form.first_name} onChange={set("first_name")} className="border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        <input placeholder="Отчество" value={form.middle_name} onChange={set("middle_name")} className="border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
      </div>
      <div><label className="text-xs text-ink/50 mb-1 block">Дата рождения</label><input type="date" value={form.birth_date} onChange={set("birth_date")} className="border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div><label className="text-xs text-ink/50 mb-1 block">Школа/сад, откуда прибыл</label><input value={form.previous_education} onChange={set("previous_education")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
        <div><label className="text-xs text-ink/50 mb-1 block">Школа/сад на данный момент</label><input value={form.current_education} onChange={set("current_education")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
        <div><label className="text-xs text-ink/50 mb-1 block">Секция/кружок</label><input value={form.extracurriculars} onChange={set("extracurriculars")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => form.first_name && onAdd(form)} disabled={!form.first_name} className="px-4 py-2 bg-ink text-beige text-sm rounded-lg hover:bg-ink/90 disabled:opacity-60">Добавить</button>
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink">Отмена</button>
      </div>
    </div>
  );
}

export function ChildRow({ child, onUpdate, onDelete, onUploadPhoto, isAdmin, authorName }: { child: Child; onUpdate: (id: number, data: Omit<Child, "id">) => void; onDelete: (id: number) => void; onUploadPhoto: (childId: number, file: File) => void; isAdmin: boolean; authorName: string }) {
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [form, setForm] = useState({
    last_name: child.last_name ?? "", first_name: child.first_name, middle_name: child.middle_name ?? "", birth_date: child.birth_date?.slice(0, 10) ?? "",
    previous_education: child.previous_education ?? "", current_education: child.current_education ?? "", extracurriculars: child.extracurriculars ?? "",
  });
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
      <div><label className="text-xs text-ink/50 mb-1 block">Дата рождения</label><input type="date" value={form.birth_date} onChange={set("birth_date")} className="border border-beige-dark bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-ink" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div><label className="text-xs text-ink/50 mb-1 block">Школа/сад, откуда прибыл</label><input value={form.previous_education} onChange={set("previous_education")} className="w-full border border-beige-dark bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-ink" /></div>
        <div><label className="text-xs text-ink/50 mb-1 block">Школа/сад на данный момент</label><input value={form.current_education} onChange={set("current_education")} className="w-full border border-beige-dark bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-ink" /></div>
        <div><label className="text-xs text-ink/50 mb-1 block">Секция/кружок</label><input value={form.extracurriculars} onChange={set("extracurriculars")} className="w-full border border-beige-dark bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-ink" /></div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={save} disabled={!form.first_name} className="px-3 py-1.5 bg-ink text-beige text-sm rounded-lg hover:bg-ink/90 disabled:opacity-60">Сохранить</button>
        <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm rounded-lg border border-beige-dark hover:border-ink">Отмена</button>
      </div>
    </div>
  );
  return (
    <div className="py-3 border-b border-beige-mid last:border-0 group">
      <div className="flex items-center justify-between">
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
            <span className="inline-flex items-center gap-1.5">
              {typeof child.latest_avg_score === "number" && (
                <span
                  className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                    child.latest_avg_score >= 8 ? "bg-green-500" : child.latest_avg_score >= 5 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  title={`Средний балл последнего отчёта: ${child.latest_avg_score}`}
                />
              )}
              <span className="text-sm text-ink">{[child.last_name, child.first_name, child.middle_name].filter(Boolean).join(" ")}</span>
            </span>
            {typeof child.current_age === "number" && <span className="text-xs text-ink/40 ml-2">Возраст: {child.current_age} лет</span>}
            {child.birth_date && <span className="text-xs text-ink/40 ml-2">({fmt(child.birth_date)})</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="p-1 text-ink/40 hover:text-ink transition-colors"><Icon name="Pencil" size={13} /></button>
          {isAdmin && <button onClick={() => onDelete(child.id)} className="p-1 text-ink/30 hover:text-red-400 transition-colors"><Icon name="X" size={14} /></button>}
        </div>
      </div>
      {(child.previous_education || child.current_education || child.extracurriculars) && (
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 ml-12 text-xs text-ink/50">
          {child.previous_education && <span>Прибыл из: {child.previous_education}</span>}
          {child.current_education && <span>Сейчас: {child.current_education}</span>}
          {child.extracurriculars && <span>Кружок: {child.extracurriculars}</span>}
        </div>
      )}
      <div className="flex items-center gap-2 mt-2 ml-12">
        <button onClick={() => setReportsOpen(true)} className="text-xs px-2.5 py-1 rounded-lg border border-beige-dark text-ink/60 hover:text-ink hover:border-ink transition-colors flex items-center gap-1">
          <Icon name="ClipboardList" size={12} /> Ежедневные отчёты
          {typeof child.latest_avg_score === "number" && (
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              child.latest_avg_score >= 8 ? "bg-green-100 text-green-700" : child.latest_avg_score >= 5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
            }`}>{child.latest_avg_score}</span>
          )}
        </button>
        <button disabled className="text-xs px-2.5 py-1 rounded-lg border border-beige-dark text-ink/40 flex items-center gap-1 cursor-not-allowed" title="Скоро">
          <Icon name="ListChecks" size={12} /> Задачи
        </button>
        <button disabled className="text-xs px-2.5 py-1 rounded-lg border border-beige-dark text-ink/40 flex items-center gap-1 cursor-not-allowed" title="Скоро">
          <Icon name="TrendingUp" size={12} /> Динамика
        </button>
      </div>
      <ChildDailyReportsModal
        childId={child.id}
        childName={[child.last_name, child.first_name, child.middle_name].filter(Boolean).join(" ")}
        authorName={authorName}
        open={reportsOpen}
        onClose={() => setReportsOpen(false)}
      />
    </div>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div><span className="text-xs text-ink/40 uppercase tracking-wide">{label}</span><p className="text-sm text-ink mt-0.5">{value}</p></div>
  );
}