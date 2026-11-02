import { FamilyOption, PsychoSession } from "./psychoApi";

const inp = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50";
const lbl = "block text-xs uppercase tracking-widest text-slate-400 mb-1";

const TEXT_FIELDS: { key: keyof PsychoSession; label: string; hint?: string }[] = [
  { key: "request", label: "Запрос" },
  { key: "phenomenology", label: "Феноменология клиента", hint: "Клинические особенности" },
  { key: "contactInterruptions", label: "Формы прерывания контакта" },
  { key: "clientFeelings", label: "Чувства клиента" },
  { key: "clientBackground", label: "Фон клиента" },
  { key: "clientFigure", label: "Фигура (потребность)" },
  { key: "therapistFeelings", label: "Чувства терапевта", hint: "Остаётся только у вас и попадает только в супервизию" },
];

interface Props {
  value: PsychoSession;
  families: FamilyOption[];
  patients: FamilyOption[];
  onChange: (v: PsychoSession) => void;
  disabled?: boolean;
}

export default function PsychoSessionForm({ value, families, patients, onChange, disabled }: Props) {
  const set = <K extends keyof PsychoSession>(k: K, v: PsychoSession[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Дата сессии</label>
          <input type="date" className={inp} value={value.date} onChange={e => set("date", e.target.value)} disabled={disabled} />
        </div>
        <div>
          <label className={lbl}>Карточка (для прикрепления рекомендаций)</label>
          <select className={inp} value={value.patientId ? `p:${value.patientId}` : value.clientId ? `f:${value.clientId}` : ""} onChange={e => {
            const v = e.target.value;
            if (!v) { onChange({ ...value, patientId: "", clientId: "" }); return; }
            const isPatient = v.startsWith("p:");
            const id = v.slice(2);
            const found = (isPatient ? patients : families).find(x => String(x.id) === id);
            onChange({ ...value, patientId: isPatient ? id : "", clientId: isPatient ? "" : id, clientName: value.clientName || found?.name || "" });
          }} disabled={disabled}>
            <option value="">Не выбрана</option>
            {patients.length > 0 && (
              <optgroup label="Сейчас в стационаре">
                {patients.map(f => <option key={`p${f.id}`} value={`p:${f.id}`}>{f.name}</option>)}
              </optgroup>
            )}
            {families.length > 0 && (
              <optgroup label="Семьи на сопровождении (СОП)">
                {families.map(f => <option key={`f${f.id}`} value={`f:${f.id}`}>{f.name}</option>)}
              </optgroup>
            )}
          </select>
        </div>
      </div>
      <div>
        <label className={lbl}>ФИО клиента</label>
        <input className={inp} value={value.clientName} onChange={e => set("clientName", e.target.value)} disabled={disabled} />
        <p className="text-xs text-slate-400 mt-1">Хранится только в защищённой базе и никогда не передаётся нейросети.</p>
      </div>
      {TEXT_FIELDS.map(f => (
        <div key={f.key}>
          <label className={lbl}>{f.label}</label>
          <textarea className={`${inp} min-h-[88px]`} maxLength={4000} value={String(value[f.key] ?? "")} onChange={e => set(f.key, e.target.value as never)} disabled={disabled} />
          {f.hint && <p className="text-xs text-slate-400 mt-1">{f.hint}</p>}
        </div>
      ))}
    </div>
  );
}
