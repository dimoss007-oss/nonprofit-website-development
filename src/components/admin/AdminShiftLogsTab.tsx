import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/c324d1ab-fd21-4060-9ed0-584dad81416f";

type ShiftLog = { id: number; report_date: string; log_text: string; created_at: string };

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}
function fmtDateTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminShiftLogsTab() {
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

  const filtered = logs.filter(l => !search.trim() || l.log_text.toLowerCase().includes(search.trim().toLowerCase()));

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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
