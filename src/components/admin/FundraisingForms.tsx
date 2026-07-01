import { useState } from "react";
import { Org, Person, Status, DonorCategory, SOURCE_OPTIONS, DONOR_CATEGORY_LABELS, STATUS_LABELS } from "./fundraising.types";

const inp = "w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40";
const lbl = "block text-xs uppercase tracking-widest text-ink/50 mb-1";

export function OrgForm({ initial, adminUsers, onSave, onCancel }: {
  initial?: Partial<Org>;
  adminUsers: string[];
  onSave: (data: Partial<Org>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Org>>({
    name: "", phone: "", email: "", website: "",
    manager: "", status: "active", donor_category: "donation",
    inn: "", contact_person: "", address: "", notes: "", ...initial,
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Org, v: string) => setForm(f => ({ ...f, [k]: v }));

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
          <label className={lbl}>Название *</label>
          <input required value={form.name || ""} onChange={e => set("name", e.target.value)} className={inp} />
        </div>

        <div>
          <label className={lbl}>Категория донора</label>
          <select value={form.donor_category || "donation"} onChange={e => set("donor_category", e.target.value as DonorCategory)} className={inp}>
            {(Object.entries(DONOR_CATEGORY_LABELS) as [DonorCategory, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={lbl}>Статус</label>
          <select value={form.status || "active"} onChange={e => set("status", e.target.value as Status)} className={inp}>
            {(Object.entries(STATUS_LABELS) as [Status, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={lbl}>Контактное лицо</label>
          <input value={form.contact_person || ""} onChange={e => set("contact_person", e.target.value)} className={inp} />
        </div>

        <div>
          <label className={lbl}>ИНН</label>
          <input value={form.inn || ""} onChange={e => set("inn", e.target.value)} placeholder="1234567890" className={inp} />
        </div>

        <div>
          <label className={lbl}>Телефон</label>
          <input value={form.phone || ""} onChange={e => set("phone", e.target.value)} className={inp} />
        </div>

        <div>
          <label className={lbl}>Email</label>
          <input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} className={inp} />
        </div>

        <div>
          <label className={lbl}>Сайт</label>
          <input value={form.website || ""} onChange={e => set("website", e.target.value)} placeholder="https://" className={inp} />
        </div>

        <div>
          <label className={lbl}>Куратор</label>
          <select value={form.manager || ""} onChange={e => set("manager", e.target.value)} className={inp}>
            <option value="">— не назначен —</option>
            {adminUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={lbl}>Адрес</label>
          <input value={form.address || ""} onChange={e => set("address", e.target.value)} placeholder="г. Москва, ул. Примерная, д. 1" className={inp} />
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

export function PersonForm({ initial, onSave, onCancel }: {
  initial?: Partial<Person>;
  onSave: (data: Partial<Person>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Person>>({
    full_name: "", phone: "", email: "", source: "",
    status: "active", donor_category: "donation", address: "", notes: "", ...initial,
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Person, v: string) => setForm(f => ({ ...f, [k]: v }));

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
          <label className={lbl}>ФИО *</label>
          <input required value={form.full_name || ""} onChange={e => set("full_name", e.target.value)} className={inp} />
        </div>

        <div>
          <label className={lbl}>Категория</label>
          <select value={form.donor_category || "donation"} onChange={e => set("donor_category", e.target.value as DonorCategory)} className={inp}>
            {(Object.entries(DONOR_CATEGORY_LABELS) as [DonorCategory, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={lbl}>Статус</label>
          <select value={form.status || "active"} onChange={e => set("status", e.target.value as Status)} className={inp}>
            {(Object.entries(STATUS_LABELS) as [Status, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={lbl}>Телефон</label>
          <input value={form.phone || ""} onChange={e => set("phone", e.target.value)} className={inp} />
        </div>

        <div>
          <label className={lbl}>Email</label>
          <input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} className={inp} />
        </div>

        <div className="sm:col-span-2">
          <label className={lbl}>Источник</label>
          <select value={form.source || ""} onChange={e => set("source", e.target.value)} className={inp}>
            <option value="">— не указан —</option>
            {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={lbl}>Адрес</label>
          <input value={form.address || ""} onChange={e => set("address", e.target.value)} placeholder="г. Москва, ул. Примерная, д. 1" className={inp} />
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