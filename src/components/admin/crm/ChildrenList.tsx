import SectionSwitch, { type CrmSection } from "@/components/admin/crm/SectionSwitch";
import Icon from "@/components/ui/icon";
import ChildrenWeeklyOverview from "@/components/admin/crm/ChildrenWeeklyOverview";
import ChildrenBulkReport from "@/components/admin/crm/ChildrenBulkReport";
import { ChildWithPatient, fmt, plural } from "@/components/admin/crm/crmShared";

export default function ChildrenList({
  children, loading, search, setSearch, onSelect, authorName = "", section, setSection,
}: {
  section: CrmSection;
  setSection: (v: CrmSection) => void;
  children: ChildWithPatient[];
  loading: boolean;
  search: string;
  setSearch: (v: string) => void;
  onSelect: (id: number) => void;
  authorName?: string;
}) {
  const scoreBadge = (score?: number) => {
    if (typeof score !== "number") return null;
    const cls = score >= 8 ? "bg-green-100 text-green-700" : score >= 5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cls}`}>{score}</span>;
  };

  return (
    <div className="space-y-6 font-inter">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">База семей</h1>
        <p className="text-sm text-slate-500 mt-1">Дети, которые живут в центре вместе с мамами</p>
      </div>

      <ChildrenBulkReport authorName={authorName} />

      <ChildrenWeeklyOverview />

      {children.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-green-600">{children.length}</span>
            <span className="text-xs text-slate-500 font-medium mt-1">{plural(children.length, "ребёнок", "ребёнка", "детей")} с мамами в центре</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-700">{children.filter(c => typeof c.latest_avg_score === "number").length}</span>
            <span className="text-xs text-slate-500 font-medium mt-1">есть отчёты</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-red-500">{children.filter(c => typeof c.latest_avg_score === "number" && c.latest_avg_score < 5).length}</span>
            <span className="text-xs text-slate-500 font-medium mt-1">требуют внимания</span>
          </div>
        </div>
      )}

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center flex-1 min-w-[220px] bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:border-indigo-300 transition">
          <Icon name="Search" size={15} className="text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по фамилии, имени, отчеству ребёнка..." className="bg-transparent border-none outline-none text-sm text-slate-700 w-full ml-3 placeholder:text-slate-400" />
        </div>
        <SectionSwitch section={section} setSection={setSection} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : children.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Icon name="Baby" size={40} className="mx-auto mb-3 opacity-30" />
          <p>{search ? "Ничего не найдено" : "Детей пока нет"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {children.map(c => {
            const initials = `${(c.last_name || "")[0] ?? ""}${(c.first_name || "")[0] ?? ""}`.toUpperCase();
            return (
              <div key={c.id} onClick={() => onSelect(c.id)} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center text-slate-500 font-bold text-lg flex-shrink-0">
                    {c.photo_url ? <img src={c.photo_url} alt="" className="w-full h-full object-cover" /> : initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{[c.last_name, c.first_name, c.middle_name].filter(Boolean).join(" ")}{c.alias && <span className="text-slate-400 font-normal"> ({c.alias})</span>}</h3>
                      {typeof c.current_age === "number" && <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs font-medium rounded-full border border-slate-200">{c.current_age} лет</span>}
                      {scoreBadge(c.latest_avg_score)}
                    </div>
                    <p className="text-xs text-slate-500">
                      {[
                        c.birth_date && `Р. ${fmt(c.birth_date)}`,
                        `Мама: ${[c.patient_last_name, c.patient_first_name, c.patient_middle_name].filter(Boolean).join(" ")}${c.patient_alias ? ` (${c.patient_alias})` : ""}`,
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
