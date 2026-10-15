import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { API, Patient, RiskBadge, fmt, stayDuration, plural } from "@/components/admin/crm/crmShared";
import PatientCard from "@/components/admin/crm/PatientCard";

interface Props {
  isAdmin?: boolean;
  authorName?: string;
  onViewShiftHistory?: (patientId: number) => void;
}

export default function AdminAlumniTab({ isAdmin = true, authorName = "Сотрудник", onViewShiftHistory }: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const r = await fetch(API);
    const d = await r.json();
    setPatients(d.patients || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (selectedId) return (
    <PatientCard patientId={selectedId} onBack={() => { setSelectedId(null); load(); }} onDeleted={() => { setSelectedId(null); load(); }} isAdmin={isAdmin} authorName={authorName} onViewShiftHistory={onViewShiftHistory} />
  );

  const alumni = patients
    .filter(p => !!p.discharge_date)
    .sort((a, b) => new Date(b.discharge_date!).getTime() - new Date(a.discharge_date!).getTime());

  const now = new Date();
  const thisYear = alumni.filter(p => new Date(p.discharge_date!).getFullYear() === now.getFullYear()).length;
  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
  const lastMonth = alumni.filter(p => new Date(p.discharge_date!) >= monthAgo).length;
  const totalChildren = alumni.reduce((s, p) => s + (Number(p.children_count) || 0), 0);

  const q = search.toLowerCase();
  const list = search
    ? alumni.filter(p => `${p.last_name} ${p.first_name} ${p.middle_name ?? ""} ${p.alias ?? ""}`.toLowerCase().includes(q))
    : alumni;

  const metrics = [
    { label: "Всего выпускников", value: alumni.length, color: "text-slate-800", border: "border-slate-100" },
    { label: "За этот год", value: thisYear, color: "text-green-600", border: "border-green-100" },
    { label: "За 30 дней", value: lastMonth, color: "text-blue-600", border: "border-blue-100" },
    { label: `${plural(totalChildren, "Ребёнок", "Ребёнка", "Детей")} с ними`, value: totalChildren, color: "text-slate-700", border: "border-slate-100" },
  ];

  return (
    <div className="space-y-6 font-inter">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Выпускники</h1>
        <p className="text-sm text-slate-500 mt-1">Семьи, которые прошли программу и были выписаны из центра</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label} className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center ${m.border}`}>
            <span className={`text-2xl font-bold ${m.color}`}>{m.value}</span>
            <span className="text-xs text-slate-500 font-medium mt-1 text-center">{m.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:border-indigo-300 transition">
          <Icon name="Search" size={15} className="text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по фамилии, имени, отчеству..." className="bg-transparent border-none outline-none text-sm text-slate-700 w-full ml-3 placeholder:text-slate-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Icon name="GraduationCap" size={40} className="mx-auto mb-3 opacity-30" />
          <p>{search ? "Ничего не найдено" : "Выписанных пока нет"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(p => {
            const initials = `${(p.last_name || "")[0] ?? ""}${(p.first_name || "")[0] ?? ""}`.toUpperCase();
            const stay = stayDuration(p.admission_date, p.discharge_date);
            return (
              <div key={p.id} onClick={() => setSelectedId(p.id)} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center text-slate-500 font-bold text-lg flex-shrink-0">
                    {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{p.last_name} {p.first_name} {p.middle_name ?? ""}{p.alias && <span className="text-slate-400 font-normal"> ({p.alias})</span>}</h3>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full border bg-indigo-50 text-indigo-600 border-indigo-100">Выпускница</span>
                      <RiskBadge level={p.risk_level} />
                      {stay && <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-xs font-medium rounded-full border border-slate-200">{stay}</span>}
                    </div>
                    <p className="text-xs text-slate-500">
                      {[
                        p.admission_date && `Поступила: ${fmt(p.admission_date)}`,
                        `Выписана: ${fmt(p.discharge_date)}`,
                        (p.children_count ?? 0) > 0 && `${p.children_count} ${plural(Number(p.children_count), "ребёнок", "ребёнка", "детей")}`,
                      ].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 flex items-center justify-center transition flex-shrink-0">
                  <Icon name="ChevronRight" size={14} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
