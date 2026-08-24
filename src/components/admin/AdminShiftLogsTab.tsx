import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/c324d1ab-fd21-4060-9ed0-584dad81416f";

type ShiftPatient = {
  id: number;
  last_name: string;
  first_name: string;
  alias?: string;
  overall_state: number | null;
  identified_problems: string;
};

type ShiftLog = { id: number; report_date: string; log_text: string; created_at: string; patients: ShiftPatient[] };

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}
function fmtDateTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function stateColor(state: number | null) {
  if (state == null) return "bg-beige-mid text-ink/50 border-beige-dark";
  if (state <= 4) return "bg-red-50 text-red-600 border-red-200";
  if (state <= 6) return "bg-amber-50 text-amber-600 border-amber-200";
  return "bg-green-50 text-green-600 border-green-200";
}

export default function AdminShiftLogsTab({ onSelectPatient, filterPatientId, onClearFilter }: { onSelectPatient?: (id: number) => void; filterPatientId?: number | null; onClearFilter?: () => void }) {
  const [logs, setLogs] = useState<ShiftLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(API);
      const d = await r.json();
      setLogs(d.logs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filterPatientName = filterPatientId
    ? logs.flatMap(l => l.patients).find(p => p.id === filterPatientId)
    : null;

  const filtered = logs
    .filter(l => !filterPatientId || l.patients.some(p => p.id === filterPatientId))
    .filter(l => !search.trim() || l.log_text.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-cormorant text-ink text-2xl font-semibold">Отчёты смены</h2>
          <p className="text-ink/50 text-sm">Вступительные сводки, полученные из бота Max</p>
        </div>
        <button onClick={load} className="px-3 py-1.5 text-sm border border-beige-dark rounded-lg hover:border-ink transition-colors flex items-center gap-1.5">
          <Icon name="RefreshCw" size={14} /> Обновить
        </button>
      </div>

      {filterPatientId && (
        <div className="flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-2.5 text-sm text-cyan-700">
          <Icon name="Filter" size={14} />
          <span>Показаны отчёты по пациенту: <strong>{filterPatientName?.alias || `${filterPatientName?.last_name ?? ""} ${filterPatientName?.first_name ?? ""}`.trim() || `#${filterPatientId}`}</strong></span>
          <button onClick={onClearFilter} className="ml-auto flex items-center gap-1 text-cyan-600 hover:text-cyan-800 transition-colors">
            <Icon name="X" size={14} /> Сбросить
          </button>
        </div>
      )}

      <div className="relative">
        <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по тексту сводки..."
          className="w-full bg-white border border-beige-dark rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-ink"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-ink/40">
          <Icon name="ClipboardList" size={40} className="mx-auto mb-3 opacity-30" />
          <p>{logs.length === 0 ? "Отчётов смены пока нет" : "Ничего не найдено"}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((log) => (
            <div key={log.id} className="bg-white border border-beige-dark rounded-2xl px-5 py-4">
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <span className="text-xs font-semibold text-ink bg-beige-mid px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <Icon name="Calendar" size={12} /> {fmt(log.report_date)}
                </span>
                <span className="text-xs text-ink/40">Получено: {fmtDateTime(log.created_at)}</span>
              </div>
              <p className="text-sm text-ink/80 whitespace-pre-wrap break-words">{log.log_text || "—"}</p>

              {log.patients.length > 0 && (
                <div className="mt-4 pt-4 border-t border-beige-dark/60">
                  {(() => {
                    const visiblePatients = filterPatientId ? log.patients.filter(p => p.id === filterPatientId) : log.patients;
                    return (
                      <>
                        <p className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2.5">
                          Распознанные отчёты по пациентам ({visiblePatients.length})
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {visiblePatients.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => onSelectPatient?.(p.id)}
                              className="text-left bg-beige/40 hover:bg-beige border border-beige-dark rounded-xl px-3.5 py-3 transition-colors group"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-sm font-semibold text-ink group-hover:underline flex items-center gap-1.5">
                                  <Icon name="User" size={13} className="text-ink/40" />
                                  {p.alias || `${p.last_name} ${p.first_name}`}
                                </span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${stateColor(p.overall_state)}`}>
                                  {p.overall_state ?? "—"}
                                </span>
                              </div>
                              {p.identified_problems && (
                                <p className="text-xs text-ink/60 line-clamp-2">{p.identified_problems}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}