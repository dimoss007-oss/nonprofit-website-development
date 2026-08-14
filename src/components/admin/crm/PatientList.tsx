import Icon from "@/components/ui/icon";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Patient, EMPTY_FORM, RiskBadge, fmt, stayDuration, plural, CareStage } from "@/components/admin/crm/crmShared";
import { PatientForm } from "@/components/admin/crm/PatientFormParts";

export default function PatientList({
  allPatients, patients, loading, search, setSearch, adding, setAdding, saving,
  careStage, setCareStage, postTreatmentCount, onCreatePatient, onSelect,
}: {
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
  const inCenter = allPatients.filter(p => !p.discharge_date);
  const totalChildren = inCenter.reduce((s, p) => s + (Number(p.children_count) || 0), 0);
  const highRiskCount = inCenter.filter(p => p.risk_level === "high").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cormorant text-ink text-2xl font-semibold">База пациентов</h2>
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors">
          <Icon name="UserPlus" size={16} /> Добавить
        </button>
      </div>

      <Tabs value={careStage} onValueChange={(v) => setCareStage(v as CareStage)}>
        <TabsList>
          <TabsTrigger value="inpatient">Стационар</TabsTrigger>
          <TabsTrigger value="posttreatment">Амбулаторная программа</TabsTrigger>
        </TabsList>
      </Tabs>

      {allPatients.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white border border-green-200 rounded-2xl px-4 py-3.5 text-center">
            <p className="font-cormorant text-3xl font-semibold text-green-700">{inCenter.length}</p>
            <p className="text-xs text-ink/50 mt-0.5">{plural(inCenter.length, "пациентка", "пациентки", "пациенток")} в центре</p>
          </div>
          <div className="bg-white border border-blue-200 rounded-2xl px-4 py-3.5 text-center">
            <p className="font-cormorant text-3xl font-semibold text-blue-700">{postTreatmentCount}</p>
            <p className="text-xs text-ink/50 mt-0.5">на амб. программе</p>
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
          <PatientForm onSave={onCreatePatient} onCancel={() => setAdding(false)} loading={saving} />
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
            <button key={p.id} onClick={() => onSelect(p.id)} className={`w-full bg-white border rounded-2xl px-5 py-4 text-left hover:border-ink transition-colors group ${p.discharge_date ? "border-beige-dark" : "border-green-200"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-beige-mid flex items-center justify-center flex-shrink-0 border border-beige-dark">
                    {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : <Icon name="User" size={16} className="text-ink/30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-ink">{p.last_name} {p.first_name} {p.middle_name ?? ""}{p.alias && <span className="font-normal text-ink/40"> ({p.alias})</span>}</p>
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
                      {p.care_stage === "posttreatment" && stayDuration(p.care_stage_since) && (
                        <span className="text-xs text-blue-600 flex-shrink-0">на амб. программе: {stayDuration(p.care_stage_since)}</span>
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