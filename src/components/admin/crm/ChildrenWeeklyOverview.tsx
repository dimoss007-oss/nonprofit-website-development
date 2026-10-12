import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { CHILD_WEEKLY_API } from "@/components/admin/crm/crmShared";

type WeekReport = { id: number; child_id: number; child_name: string; author?: string; report_text: string };

const mondayOf = (d: Date) => {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

const weekLabel = (start: string) => {
  const from = new Date(start + "T00:00:00");
  const to = new Date(from);
  to.setDate(to.getDate() + 6);
  const f = (d: Date) => d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  return `${f(from)} – ${f(to)}.${to.getFullYear()}`;
};

export default function ChildrenWeeklyOverview() {
  const [open, setOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [reports, setReports] = useState<WeekReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSummary("");
    setError("");
    fetch(`${CHILD_WEEKLY_API}?week_start=${weekStart}`)
      .then((r) => r.json())
      .then((d) => setReports(d.reports || []))
      .finally(() => setLoading(false));
  }, [open, weekStart]);

  const makeSummary = async () => {
    setSummaryBusy(true);
    setError("");
    try {
      const r = await fetch(CHILD_WEEKLY_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "summary", week_start: weekStart }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Не удалось составить выжимку"); return; }
      setSummary(d.summary_text);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setSummaryBusy(false);
    }
  };

  const [docBusy, setDocBusy] = useState(false);

  const downloadWord = async () => {
    setDocBusy(true);
    setError("");
    try {
      const r = await fetch(CHILD_WEEKLY_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "summary_docx", week_start: weekStart, summary_text: summary }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Не удалось сформировать документ"); return; }
      const bytes = Uint8Array.from(atob(d.file_base64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: d.content_type }));
      const a = document.createElement("a");
      a.href = url;
      a.download = d.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setDocBusy(false);
    }
  };

  const copy = () => navigator.clipboard.writeText(summary);

  return (
    <div className="bg-white border border-beige-dark rounded-2xl">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="flex items-center gap-2 font-semibold text-ink text-sm">
          <Icon name="FileText" size={16} /> Отчёты по детям и выжимка
        </span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={16} className="text-ink/40" />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-beige-dark pt-4">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="date"
              value={weekStart}
              onChange={(e) => e.target.value && setWeekStart(mondayOf(new Date(e.target.value + "T00:00:00")))}
              className="border border-beige-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink"
            />
            <span className="text-xs text-ink/50">Неделя {weekLabel(weekStart)}</span>
            <button
              onClick={makeSummary}
              disabled={summaryBusy || loading || reports.length === 0}
              className="ml-auto px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Icon name={summaryBusy ? "Loader" : "Sparkles"} size={14} className={summaryBusy ? "animate-spin" : ""} />
              {summaryBusy ? "Составляю..." : "Сделать выжимку"}
            </button>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {summary && (
            <div className="bg-beige-mid rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-ink uppercase tracking-wide">Выжимка за неделю</p>
                <div className="flex items-center gap-3">
                  <button onClick={copy} className="text-xs text-ink/60 hover:text-ink flex items-center gap-1"><Icon name="Copy" size={12} /> Копировать</button>
                  <button onClick={downloadWord} disabled={docBusy} className="text-xs text-ink/60 hover:text-ink flex items-center gap-1 disabled:opacity-50">
                    <Icon name={docBusy ? "Loader" : "Download"} size={12} className={docBusy ? "animate-spin" : ""} /> Скачать в Word
                  </button>
                </div>
              </div>
              <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">{summary}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-ink/50 mb-2">Загруженные отчёты: {reports.length}</p>
            {loading && <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>}
            {!loading && reports.length === 0 && <p className="text-sm text-ink/40 text-center py-4">За эту неделю отчётов нет</p>}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {reports.map((r) => (
                <button key={r.id} onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="w-full text-left bg-beige-mid rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{r.child_name}</span>
                    <span className="text-xs text-ink/40">{r.author}</span>
                  </div>
                  <p className={`text-sm text-ink/70 mt-1 whitespace-pre-line ${expanded === r.id ? "" : "line-clamp-2"}`}>{r.report_text}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
