import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Agency, inp, lbl, emptyForm } from "./govAgency.types";
import { AgencyContacts, AgencyDocs } from "./GovAgencySubsections";

// ─── Карточка госоргана ────────────────────────────────────────────────────
export function AgencyCard({ agency, onEdit, onArchive, onToggleContact }: {
  agency: Agency;
  onEdit: (a: Agency) => void;
  onArchive: (id: number) => void;
  onToggleContact: (id: number, value: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggleContact(agency.id, !agency.has_contact);
    setToggling(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-beige-dark shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="Landmark" size={16} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-ink text-sm leading-tight">{agency.name}</p>
                <button
                  onClick={handleToggle}
                  disabled={toggling}
                  title={agency.has_contact ? "Снять пометку" : "Отметить как «Есть контакт»"}
                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium transition-all disabled:opacity-50 ${
                    agency.has_contact
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-beige-dark text-ink/30 hover:bg-beige-dark hover:text-ink/60"
                  }`}
                >
                  <Icon name={agency.has_contact ? "UserCheck" : "UserX"} size={10} />
                  {agency.has_contact ? "Есть контакт" : "Нет контакта"}
                </button>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-ink/50">
                {agency.phone && <span className="flex items-center gap-1"><Icon name="Phone" size={11} />{agency.phone}</span>}
                {agency.service_phone && <span className="flex items-center gap-1"><Icon name="PhoneCall" size={11} />{agency.service_phone}</span>}
                {agency.email && <a href={`mailto:${agency.email}`} className="flex items-center gap-1 hover:text-ink transition-colors"><Icon name="Mail" size={11} />{agency.email}</a>}
                {agency.address && <span className="flex items-center gap-1"><Icon name="MapPin" size={11} />{agency.address}</span>}
                {agency.working_hours && <span className="flex items-center gap-1"><Icon name="Clock" size={11} />{agency.working_hours}</span>}
              </div>
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
          {expanded ? "Скрыть детали" : "Контакты и документы"}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-5">
          <AgencyContacts agency={agency} />
          <AgencyDocs agency={agency} />
        </div>
      )}
    </div>
  );
}

// ─── Форма создания / редактирования ──────────────────────────────────────
export function AgencyForm({ initial, onSave, onCancel }: {
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
          <label className={lbl}>Email</label>
          <input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} placeholder="info@example.gov.ru" className={inp} />
        </div>
        <div>
          <label className={lbl}>Время работы</label>
          <input value={form.working_hours || ""} onChange={e => set("working_hours", e.target.value)} placeholder="Пн–Пт 9:00–18:00" className={inp} />
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
