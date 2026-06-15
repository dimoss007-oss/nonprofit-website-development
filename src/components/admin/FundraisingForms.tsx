import { useState } from "react";
import { Org, Person, Status, SOURCE_OPTIONS } from "./fundraising.types";

// ─── Форма организации ───────────────────────────────────────────────────────
export function OrgForm({ initial, adminUsers, onSave, onCancel }: {
  initial?: Partial<Org>;
  adminUsers: string[];
  onSave: (data: Partial<Org>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Org>>({
    name: "", phone: "", email: "", website: "",
    manager: "", status: "active", notes: "", ...initial,
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
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Название *</label>
          <input required value={form.name || ""} onChange={e => set("name", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Телефон</label>
          <input value={form.phone || ""} onChange={e => set("phone", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Email</label>
          <input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Сайт</label>
          <input value={form.website || ""} onChange={e => set("website", e.target.value)}
            placeholder="https://"
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Менеджер</label>
          <select value={form.manager || ""} onChange={e => set("manager", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40">
            <option value="">— не назначен —</option>
            {adminUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Статус</label>
          <select value={form.status || "active"} onChange={e => set("status", e.target.value as Status)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40">
            <option value="active">Активный</option>
            <option value="inactive">Неактивный</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Заметки</label>
          <textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={3}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40 resize-none" />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving}
          className="bg-ink text-beige px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50">
          {saving ? "Сохраняем..." : "Сохранить"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-6 py-2.5 rounded-xl text-sm text-ink/60 hover:text-ink border border-beige-dark transition-colors">
          Отмена
        </button>
      </div>
    </form>
  );
}

// ─── Форма физлица ───────────────────────────────────────────────────────────
export function PersonForm({ initial, onSave, onCancel }: {
  initial?: Partial<Person>;
  onSave: (data: Partial<Person>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Person>>({
    full_name: "", phone: "", email: "", source: "",
    status: "active", notes: "", ...initial,
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
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">ФИО *</label>
          <input required value={form.full_name || ""} onChange={e => set("full_name", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Телефон</label>
          <input value={form.phone || ""} onChange={e => set("phone", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Email</label>
          <input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Источник</label>
          <select value={form.source || ""} onChange={e => set("source", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40">
            <option value="">— не указан —</option>
            {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Статус</label>
          <select value={form.status || "active"} onChange={e => set("status", e.target.value as Status)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40">
            <option value="active">Активный</option>
            <option value="inactive">Неактивный</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Заметки</label>
          <textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={3}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40 resize-none" />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving}
          className="bg-ink text-beige px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50">
          {saving ? "Сохраняем..." : "Сохранить"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-6 py-2.5 rounded-xl text-sm text-ink/60 hover:text-ink border border-beige-dark transition-colors">
          Отмена
        </button>
      </div>
    </form>
  );
}
