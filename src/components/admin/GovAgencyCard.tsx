import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Agency, AgreementStatus, ContactStatus, inp, lbl, emptyForm, GOV_API } from "./govAgency.types";
import { AgencyContacts, AgencyDocs } from "./GovAgencySubsections";

const TASKS_API = "https://functions.poehali.dev/6036e39a-3369-4ec5-a7b3-a4393528188a";

// ─── Кнопка «Перезвонить» ─────────────────────────────────────────────────
function CallbackButton({ agency }: { agency: Agency }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("10:00");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const create = async () => {
    setSaving(true);
    await fetch(TASKS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        title: `Перезвонить: ${agency.name}`,
        description: [
          time ? `Время звонка: ${time}` : "",
          agency.phone ? `Телефон: ${agency.phone}` : "",
          agency.service_phone ? `Служебный: ${agency.service_phone}` : "",
          agency.contact_person ? `Контакт: ${agency.contact_person}` : "",
        ].filter(Boolean).join("\n") || undefined,
        priority: "medium",
        deadline: date,
        assignee_login: "Dmitry",
        assignee_name: "Администратор",
        created_by: "Dmitry",
        link_type: "gov_agency",
        link_id: agency.id,
      }),
    });
    setSaving(false);
    setDone(true);
    setOpen(false);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Запланировать звонок"
        className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
          done
            ? "bg-violet-100 text-violet-700"
            : "bg-beige-dark text-ink/30 hover:bg-orange-50 hover:text-orange-600"
        }`}
      >
        <Icon name={done ? "CalendarCheck" : "PhoneCall"} size={10} />
        {done ? "Добавлено!" : "Перезвонить"}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-beige-dark p-3 min-w-[210px]">
          <p className="text-xs font-medium text-ink mb-2">Запланировать звонок</p>
          <div className="flex gap-2 mb-2">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="flex-1 border border-beige-dark rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-ink"
            />
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-24 border border-beige-dark rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-ink"
            />
          </div>
          <button
            onClick={create}
            disabled={saving || !date}
            className="w-full bg-ink text-beige text-xs font-semibold py-1.5 rounded-lg hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Создаём..." : "Добавить в задачи"}
          </button>
        </div>
      )}
    </div>
  );
}

const CONTACT_OPTIONS: { value: ContactStatus; label: string; color: string; icon: string }[] = [
  { value: "has_contact", label: "Есть контакт", color: "bg-green-100 text-green-700", icon: "UserCheck" },
  { value: "no_answer",   label: "Нет ответа",   color: "bg-orange-100 text-orange-700", icon: "PhoneMissed" },
  { value: "no_contact",  label: "Нет контакта", color: "bg-beige-dark text-ink/50", icon: "UserX" },
];

function ContactStatusBadge({ agency, onChange }: { agency: Agency; onChange: (status: ContactStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = CONTACT_OPTIONS.find(o => o.value === agency.contact_status) || CONTACT_OPTIONS[2];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${current.color}`}
        title="Статус контакта"
      >
        <Icon name={current.icon} size={10} />
        {current.label}
        <Icon name="ChevronDown" size={9} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-beige-dark py-1 min-w-[150px]">
          {CONTACT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-beige/60 transition-colors ${
                agency.contact_status === opt.value ? "opacity-50" : ""
              }`}
            >
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${opt.color}`}>
                <Icon name={opt.icon} size={10} />{opt.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const AGREEMENT_OPTIONS: { value: AgreementStatus; label: string; color: string }[] = [
  { value: "sent",     label: "Отправлено", color: "bg-blue-100 text-blue-700" },
  { value: "signed",   label: "Подписано",  color: "bg-green-100 text-green-700" },
  { value: "rejected", label: "Отклонено",  color: "bg-red-100 text-red-700" },
];

function AgreementBadge({ agency, onChange }: { agency: Agency; onChange: (status: AgreementStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = AGREEMENT_OPTIONS.find(o => o.value === agency.agreement_status);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
          current ? current.color : "bg-beige-dark text-ink/30 hover:text-ink/60"
        }`}
        title="Статус соглашения"
      >
        <Icon name="FileText" size={10} />
        {current ? current.label : "Соглашение"}
        <Icon name="ChevronDown" size={9} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-beige-dark py-1 min-w-[140px]">
          {AGREEMENT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-beige/60 transition-colors ${
                agency.agreement_status === opt.value ? "opacity-50" : ""
              }`}
            >
              <span className={`inline-block px-2 py-0.5 rounded-full ${opt.color}`}>{opt.label}</span>
            </button>
          ))}
          {agency.agreement_status && (
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-ink/30 hover:text-ink/60 hover:bg-beige/60 transition-colors"
            >
              Снять пометку
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Инлайн-редактор примечания ───────────────────────────────────────────
function NotesEditor({ agency }: { agency: Agency }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(agency.notes || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`${GOV_API}?type=agency`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...agency, notes: value }),
    });
    setSaving(false);
    setEditing(false);
    agency.notes = value;
  };

  return (
    <div className="border-t border-beige-dark/50 pt-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-ink/50 uppercase tracking-wider">Примечание</p>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs text-ink/30 hover:text-ink flex items-center gap-1 transition-colors">
            <Icon name="Pencil" size={11} /> Изменить
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            rows={3}
            placeholder="Добавьте примечание..."
            className={`${inp} resize-none`}
          />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="bg-ink text-beige px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">
              {saving ? "..." : "Сохранить"}
            </button>
            <button onClick={() => { setEditing(false); setValue(agency.notes || ""); }} className="text-xs text-ink/50 hover:text-ink">
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <p
          onClick={() => setEditing(true)}
          className={`text-sm whitespace-pre-wrap cursor-text rounded-lg px-1 -mx-1 hover:bg-beige/60 transition-colors ${value ? "text-ink/70" : "text-ink/25 italic"}`}
        >
          {value || "Нажмите чтобы добавить примечание..."}
        </p>
      )}
    </div>
  );
}

// ─── Карточка госоргана ────────────────────────────────────────────────────
export function AgencyCard({ agency, onEdit, onArchive, onContactStatusChange, onAgreementChange, defaultExpanded }: {
  agency: Agency;
  onEdit: (a: Agency) => void;
  onArchive: (id: number) => void;
  onContactStatusChange: (id: number, status: ContactStatus) => void;
  onAgreementChange: (id: number, status: AgreementStatus) => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(!!defaultExpanded);

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
                <ContactStatusBadge
                  agency={agency}
                  onChange={(status) => onContactStatusChange(agency.id, status)}
                />
                <AgreementBadge
                  agency={agency}
                  onChange={(status) => onAgreementChange(agency.id, status)}
                />
                <CallbackButton agency={agency} />
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
          <NotesEditor agency={agency} />
          <AgencyContacts agency={agency} />
          <AgencyDocs agency={agency} />
        </div>
      )}
    </div>
  );
}

export interface ContactDraft { name: string; phone: string; role: string; }

// ─── Форма создания / редактирования ──────────────────────────────────────
export function AgencyForm({ initial, onSave, onCancel, isEdit }: {
  initial?: Partial<Agency>;
  onSave: (data: Partial<Agency>, contact: ContactDraft) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}) {
  const [form, setForm] = useState<Partial<Agency>>({ ...emptyForm(), ...initial });
  const [contact, setContact] = useState<ContactDraft>({ name: "", phone: "", role: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Agency, v: string) => setForm(f => ({ ...f, [k]: v }));
  const setC = (k: keyof ContactDraft, v: string) => setContact(c => ({ ...c, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form, contact);
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

      {!isEdit && (
        <div className="border-t border-beige-dark pt-4">
          <p className="text-xs font-medium text-ink/50 uppercase tracking-wider mb-3">Контактное лицо</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className={lbl}>ФИО</label>
              <input value={contact.name} onChange={e => setC("name", e.target.value)} placeholder="Иванов Иван Иванович" className={inp} />
            </div>
            <div>
              <label className={lbl}>Должность</label>
              <input value={contact.role} onChange={e => setC("role", e.target.value)} placeholder="Начальник отдела" className={inp} />
            </div>
            <div>
              <label className={lbl}>Телефон</label>
              <input value={contact.phone} onChange={e => setC("phone", e.target.value)} placeholder="+7 (000) 000-00-00" className={inp} />
            </div>
          </div>
        </div>
      )}

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