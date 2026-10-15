import SectionSwitch, { type CrmSection } from "@/components/admin/crm/SectionSwitch";
import Icon from "@/components/ui/icon";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Patient, EMPTY_FORM, RiskBadge, fmt, stayDuration, plural, CareStage } from "@/components/admin/crm/crmShared";
import { PatientForm } from "@/components/admin/crm/PatientFormParts";
import PsychologistDayReport from "@/components/admin/crm/PsychologistDayReport";
import PatientNamesHint from "@/components/admin/crm/PatientNamesHint";
import StateSparkline from "@/components/admin/crm/StateSparkline";

export default function PatientList({
  allPatients, patients, loading, search, setSearch, adding, setAdding, saving,
  careStage, setCareStage, postTreatmentCount, onCreatePatient, onSelect, section, setSection,
}: {
  section: CrmSection;
  setSection: (v: CrmSection) => void;
  allPatients: Patient[];
  patients: Patient[];
  loading: boolean;
  search: string;
  setSearch: (v: string) => void;
  adding: boolean;
  setAdding: (v: boolean) => void;
  saving: boolean;
  careStage: CareStage;
  setCareStage: (v: CareStage) => void;
  postTreatmentCount: number;
  onCreatePatient: (form: typeof EMPTY_FORM) => void;
  onSelect: (id: number) => void;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const inCenter = allPatients.filter(p => !p.discharge_date);
  const totalChildren = inCenter.reduce((s, p) => s + (Number(p.children_count) || 0), 0);
  const highRiskCount = inCenter.filter(p => p.risk_level === "high").length;

  const stageCards = [
    { id: "inpatient" as CareStage, value: inCenter.length, label: "В центре", color: "text-green-600", border: "border-green-100", hover: "hover:bg-green-50", clickable: true },
    { id: "posttreatment" as CareStage, value: postTreatmentCount, label: "Амбулаторная программа", color: "text-blue-600", border: "border-blue-100", hover: "hover:bg-blue-50", clickable: true },
  ];

  return (
    <div className="space-y-6 font-inter">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">База семей</h1>
          <p className="text-sm text-slate-500 mt-1">Управление подопечными в стационаре и на сопровождении</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setReportOpen(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-sm font-medium flex items-center gap-2 shadow-sm">
            <Icon name="FileText" size={16} className="text-brand-500" /> <span className="hidden sm:inline">Отчёт психолога</span>
          </button>
          <div className="w-px h-8 bg-slate-200 mx-1" />
          <button onClick={() => setHintOpen(true)} title="Как писать имена для бота" className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-slate-600 hover:bg-slate-50 transition flex items-center justify-center shadow-sm">
            <Icon name="CircleHelp" size={18} />
          </button>
          <button onClick={() => setAdding(true)} className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium flex items-center gap-2 shadow-sm">
            <Icon name="Plus" size={16} /> Добавить
          </button>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Отчёт психолога по всем пациентам</DialogTitle></DialogHeader>
          <PsychologistDayReport embedded />
        </DialogContent>
      </Dialog>

      <Dialog open={hintOpen} onOpenChange={setHintOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Как писать имена в отчёте для бота</DialogTitle></DialogHeader>
          <PatientNamesHint patients={allPatients} embedded />
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stageCards.map(c => (
          <button key={c.id} onClick={() => setCareStage(c.id)} className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center transition ${c.border} ${c.hover} ${careStage === c.id ? "ring-2 ring-offset-1 ring-brand-500" : ""}`}>
            <span className={`text-2xl font-bold ${c.color}`}>{c.value}</span>
            <span className="text-xs text-slate-500 font-medium mt-1">{c.label}</span>
          </button>
        ))}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-700">{totalChildren}</span>
          <span className="text-xs text-slate-500 font-medium mt-1">{plural(totalChildren, "Ребёнок", "Ребёнка", "Детей")} с ними</span>
        </div>
        <div className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center ${highRiskCount > 0 ? "border-red-100" : "border-slate-100"}`}>
          <span className={`text-2xl font-bold ${highRiskCount > 0 ? "text-red-500" : "text-slate-700"}`}>{highRiskCount}</span>
          <span className="text-xs text-slate-500 font-medium mt-1">Высокий риск</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center col-span-2 md:col-span-1">
          <span className="text-2xl font-bold text-slate-800">{allPatients.length}</span>
          <span className="text-xs text-slate-500 font-medium mt-1">Всего в базе</span>
        </div>
      </div>

      {adding && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Новый пациент</h3>
          <PatientForm onSave={onCreatePatient} onCancel={() => setAdding(false)} loading={saving} />
        </div>
      )}

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center flex-1 min-w-[220px] bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:border-indigo-300 transition">
          <Icon name="Search" size={15} className="text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по фамилии, имени, отчеству..." className="bg-transparent border-none outline-none text-sm text-slate-700 w-full ml-3 placeholder:text-slate-400" />
        </div>
        <SectionSwitch section={section} setSection={setSection} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : patients.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Icon name="Users" size={40} className="mx-auto mb-3 opacity-30" />
          <p>{search ? "Ничего не найдено" : "Пациентов пока нет"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map(p => {
            const initials = `${(p.last_name || "")[0] ?? ""}${(p.first_name || "")[0] ?? ""}`.toUpperCase();
            return (
              <div key={p.id} onClick={() => onSelect(p.id)} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center text-slate-500 font-bold text-lg flex-shrink-0">
                    {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{p.last_name} {p.first_name} {p.middle_name ?? ""}{p.alias && <span className="text-slate-400 font-normal"> ({p.alias})</span>}</h3>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${p.discharge_date ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-green-50 text-green-600 border-green-100"}`}>
                        {p.discharge_date ? "Выписана" : "В центре"}
                      </span>
                      <RiskBadge level={p.risk_level} />
                      {!p.discharge_date && stayDuration(p.admission_date) && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs font-medium rounded-full border border-slate-200">{stayDuration(p.admission_date)}</span>
                      )}
                      {p.discharge_date && stayDuration(p.admission_date, p.discharge_date) && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-xs font-medium rounded-full border border-slate-200">{stayDuration(p.admission_date, p.discharge_date)}</span>
                      )}
                      {p.care_stage === "posttreatment" && stayDuration(p.care_stage_since) && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full border border-blue-100">амб.: {stayDuration(p.care_stage_since)}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {[
                        p.birth_date && `Р. ${fmt(p.birth_date)}`,
                        p.admission_date && `Поступила: ${fmt(p.admission_date)}`,
                        p.discharge_date && `Выписана: ${fmt(p.discharge_date)}`,
                        (p.children_count ?? 0) > 0 && `${p.children_count} ${plural(Number(p.children_count), "ребёнок", "ребёнка", "детей")}`,
                      ].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                </div>
                <StateSparkline history={p.state_history} />
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
