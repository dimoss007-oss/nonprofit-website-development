import Icon from "@/components/ui/icon";
import { ChildWithPatient, fmt, plural } from "@/components/admin/crm/crmShared";

export default function ChildrenList({
  children, loading, search, setSearch, onSelect,
}: {
  children: ChildWithPatient[];
  loading: boolean;
  search: string;
  setSearch: (v: string) => void;
  onSelect: (id: number) => void;
}) {
  const scoreBadge = (score?: number) => {
    if (typeof score !== "number") return null;
    const cls = score >= 8 ? "bg-green-100 text-green-700" : score >= 5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cls}`}>{score}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cormorant text-ink text-2xl font-semibold">Дети пациенток</h2>
      </div>

      {children.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-beige-dark rounded-2xl px-4 py-3.5 text-center">
            <p className="font-cormorant text-3xl font-semibold text-ink">{children.length}</p>
            <p className="text-xs text-ink/50 mt-0.5">{plural(children.length, "ребёнок", "ребёнка", "детей")} всего</p>
          </div>
          <div className="bg-white border border-green-200 rounded-2xl px-4 py-3.5 text-center">
            <p className="font-cormorant text-3xl font-semibold text-green-700">{children.filter(c => !c.patient_discharge_date).length}</p>
            <p className="text-xs text-ink/50 mt-0.5">мамы в центре</p>
          </div>
          <div className="bg-white border border-red-200 rounded-2xl px-4 py-3.5 text-center">
            <p className="font-cormorant text-3xl font-semibold text-red-600">{children.filter(c => typeof c.latest_avg_score === "number" && c.latest_avg_score < 5).length}</p>
            <p className="text-xs text-ink/50 mt-0.5">требуют внимания</p>
          </div>
        </div>
      )}

      <div className="relative">
        <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по фамилии, имени, отчеству ребёнка..." className="w-full bg-white border border-beige-dark rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-ink" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>
      ) : children.length === 0 ? (
        <div className="text-center py-16 text-ink/40">
          <Icon name="Baby" size={40} className="mx-auto mb-3 opacity-30" />
          <p>{search ? "Ничего не найдено" : "Детей пока нет"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {children.map(c => (
            <button key={c.id} onClick={() => onSelect(c.id)} className="w-full bg-white border border-beige-dark rounded-2xl px-5 py-4 text-left hover:border-ink transition-colors group">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-beige-mid flex items-center justify-center flex-shrink-0 border border-beige-dark">
                    {c.photo_url ? <img src={c.photo_url} alt="" className="w-full h-full object-cover" /> : <Icon name="Baby" size={16} className="text-ink/30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-ink">{[c.last_name, c.first_name, c.middle_name].filter(Boolean).join(" ")}</p>
                      {typeof c.current_age === "number" && <span className="text-xs text-ink/40 flex-shrink-0">{c.current_age} лет</span>}
                      {scoreBadge(c.latest_avg_score)}
                    </div>
                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                      {c.birth_date && <span className="text-xs text-ink/40">Р. {fmt(c.birth_date)}</span>}
                      <span className="text-xs text-ink/40">
                        Мама: {[c.patient_last_name, c.patient_first_name, c.patient_middle_name].filter(Boolean).join(" ")}
                        {c.patient_alias && ` (${c.patient_alias})`}
                      </span>
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
