import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { API, EMPTY_FORM, Patient, fmt } from "./crmTypes";
import { PatientForm } from "./PatientCard";

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}

export default function PatientList({ onSelect }: { onSelect: (id: number) => void }) {
  const [all, setAll] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await fetch(API);
    const d = await r.json();
    setAll(d.patients || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createPatient = async (form: typeof EMPTY_FORM) => {
    setSaving(true);
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    setSaving(false);
    setAdding(false);
    await load();
    if (d.patient?.id) onSelect(d.patient.id);
  };

  const q = search.toLowerCase();
  const patients = search
    ? all.filter(p => `${p.last_name} ${p.first_name} ${p.middle_name ?? ""}`.toLowerCase().includes(q))
    : all;

  const totalPatients = all.length;
  const totalChildren = all.reduce((s, p) => s + (Number(p.children_count) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-cormorant text-ink text-3xl font-semibold">База пациентов</h1>
          <p className="text-ink/50 text-sm mt-0.5">Кризисный центр «Спасение надежды»</p>
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors">
          <Icon name="UserPlus" size={16} /> Добавить
        </button>
      </div>

      {totalPatients > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-beige-dark rounded-2xl px-4 py-3.5 text-center">
            <p className="font-cormorant text-3xl font-semibold text-ink">{totalPatients}</p>
            <p className="text-xs text-ink/50 mt-0.5">{plural(totalPatients, "пациентка", "пациентки", "пациенток")} в базе</p>
          </div>
          <div className="bg-white border border-beige-dark rounded-2xl px-4 py-3.5 text-center">
            <p className="font-cormorant text-3xl font-semibold text-ink">{totalChildren}</p>
            <p className="text-xs text-ink/50 mt-0.5">{plural(totalChildren, "ребёнок", "ребёнка", "детей")} всего</p>
          </div>
          <div className="bg-white border border-beige-dark rounded-2xl px-4 py-3.5 text-center">
            <p className="font-cormorant text-3xl font-semibold text-ink">{totalPatients + totalChildren}</p>
            <p className="text-xs text-ink/50 mt-0.5">{plural(totalPatients + totalChildren, "человек", "человека", "человек")} в центре</p>
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
            <button key={p.id} onClick={() => onSelect(p.id)} className="w-full bg-white border border-beige-dark rounded-2xl px-5 py-4 text-left hover:border-ink transition-colors group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink group-hover:text-ink">{p.last_name} {p.first_name} {p.middle_name ?? ""}</p>
                  <div className="flex items-center gap-4 mt-1">
                    {p.birth_date && <span className="text-xs text-ink/40">Р. {fmt(p.birth_date)}</span>}
                    {p.admission_date && <span className="text-xs text-ink/40">Поступила: {fmt(p.admission_date)}</span>}
                    {(p.children_count ?? 0) > 0 && <span className="text-xs text-ink/40">{p.children_count} {Number(p.children_count) === 1 ? "ребёнок" : Number(p.children_count) < 5 ? "ребёнка" : "детей"}</span>}
                  </div>
                </div>
                <Icon name="ChevronRight" size={16} className="text-ink/30 group-hover:text-ink transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
