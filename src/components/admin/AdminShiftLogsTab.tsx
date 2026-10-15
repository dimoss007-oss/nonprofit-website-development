import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const API = "https://functions.poehali.dev/c324d1ab-fd21-4060-9ed0-584dad81416f";

type ShiftPatient = {
  id: number;
  last_name: string;
  first_name: string;
  alias?: string;
  overall_state: number | null;
  identified_problems: string;
  actions_taken?: string | null;
  results?: string | null;
  notes?: string | null;
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
  if (state == null) return "bg-slate-50 text-slate-400 border-slate-200";
  if (state <= 4) return "bg-red-50 text-red-600 border-red-200";
  if (state <= 6) return "bg-amber-50 text-amber-600 border-amber-200";
  return "bg-green-50 text-green-600 border-green-200";
}

export default function AdminShiftLogsTab({ onSelectPatient, filterPatientId, onClearFilter }: { onSelectPatient?: (id: number) => void; filterPatientId?: number | null; onClearFilter?: () => void }) {
  const [logs, setLogs] = useState<ShiftLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openLog, setOpenLog] = useState<ShiftLog | null>(null);

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
    <div className="space-y-6 font-inter">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Журнал</h1>
          <p className="text-slate-400 text-sm">Вступительные сводки, полученные из бота Max</p>
        </div>
        <button onClick={load} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-sm font-medium flex items-center gap-2 shadow-sm">
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

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:border-indigo-300 transition">
          <Icon name="Search" size={15} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по тексту сводки..."
            className="bg-transparent border-none outline-none text-sm text-slate-700 w-full ml-3 placeholder:text-slate-400"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Icon name="ClipboardList" size={40} className="mx-auto mb-3 opacity-30" />
          <p>{logs.length === 0 ? "Отчётов смены пока нет" : "Ничего не найдено"}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((log) => (
            <div key={log.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Icon name="Calendar" size={12} /> {fmt(log.report_date)}
                </span>
                <span className="text-xs text-slate-400">Получено: {fmtDateTime(log.created_at)}</span>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap break-words line-clamp-4">{log.log_text || "—"}</p>
              <button onClick={() => setOpenLog(log)} className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors">
                <Icon name="Maximize2" size={14} /> Открыть отчёт полностью
              </button>

              {log.patients.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  {(() => {
                    const visiblePatients = filterPatientId ? log.patients.filter(p => p.id === filterPatientId) : log.patients;
                    return (
                      <>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                          Распознанные отчёты по пациентам ({visiblePatients.length})
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {visiblePatients.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => onSelectPatient?.(p.id)}
                              className="text-left bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl px-3.5 py-3 transition-colors group"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-sm font-semibold text-slate-800 group-hover:underline flex items-center gap-1.5">
                                  <Icon name="User" size={13} className="text-slate-400" />
                                  {p.alias || `${p.last_name} ${p.first_name}`}
                                </span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${stateColor(p.overall_state)}`}>
                                  {p.overall_state ?? "—"}
                                </span>
                              </div>
                              {p.identified_problems && (
                                <p className="text-xs text-slate-500 line-clamp-2">{p.identified_problems}</p>
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

      <Dialog open={!!openLog} onOpenChange={(o) => !o && setOpenLog(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {openLog && (
            <>
              <DialogHeader>
                <DialogTitle>Отчёт смены за {fmt(openLog.report_date)}</DialogTitle>
                <p className="text-xs text-slate-400">Получено: {fmtDateTime(openLog.created_at)}</p>
              </DialogHeader>
              <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">{openLog.log_text || "—"}</p>
              {openLog.patients.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Отчёты по пациентам ({openLog.patients.length})</p>
                  {openLog.patients.map((p) => (
                    <div key={p.id} className="border border-slate-200 rounded-xl px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <button onClick={() => { setOpenLog(null); onSelectPatient?.(p.id); }} className="text-sm font-semibold text-slate-800 hover:underline flex items-center gap-1.5">
                          <Icon name="User" size={13} className="text-slate-400" />
                          {p.alias || `${p.last_name} ${p.first_name}`}
                        </button>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${stateColor(p.overall_state)}`}>{p.overall_state ?? "—"}</span>
                      </div>
                      {[["Выявленные проблемы", p.identified_problems], ["Что сделано", p.actions_taken], ["Результат", p.results], ["Заметки", p.notes]].map(([label, text]) =>
                        text ? (
                          <div key={label}>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">{text}</p>
                          </div>
                        ) : null
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}