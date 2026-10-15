import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { API } from "@/components/admin/crm/crmShared";

type DayReport = { id: number; patient_id: number; patient_name: string; author: string | null; report_text: string };

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function PsychologistDayReport({ embedded = false }: { embedded?: boolean }) {
  const [openState, setOpen] = useState(false);
  const open = embedded || openState;
  const [date, setDate] = useState(today);
  const [reports, setReports] = useState<DayReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [docBusy, setDocBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    fetch(`${API}?view=psychologist_day&date=${date}`)
      .then((r) => r.json())
      .then((d) => setReports(d.reports || []))
      .finally(() => setLoading(false));
  }, [open, date]);

  const downloadWord = async () => {
    setDocBusy(true);
    setError("");
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "psychologist_day_docx", date }),
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

  return (
    <div className={embedded ? "" : "bg-white border border-beige-dark rounded-2xl"}>
      {!embedded && <button onClick={() => setOpen(!openState)} className="w-full flex items-center justify-between px-5 py-3.5 text-left">
        <span className="flex items-center gap-2 font-semibold text-ink text-sm">
          <Icon name="Brain" size={16} /> Отчёт психолога по всем пациентам
        </span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={16} className="text-ink/40" />
      </button>}
      {open && (
        <div className={`${embedded ? "" : "px-5 pb-5 pt-4 border-t border-beige-dark"} space-y-4`}>
          <div className="flex items-center gap-3 flex-wrap">
            <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="border border-beige-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink" />
            <span className="text-xs text-ink/50">Пациенток с отчётом: {reports.length}</span>
            <button onClick={downloadWord} disabled={docBusy || loading || reports.length === 0} className="ml-auto px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center gap-1.5">
              <Icon name={docBusy ? "Loader" : "Download"} size={14} className={docBusy ? "animate-spin" : ""} /> Скачать в Word
            </button>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {loading && <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>}
          {!loading && reports.length === 0 && <p className="text-sm text-ink/40 text-center py-4">За эту дату отчётов психолога нет</p>}
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {reports.map((r) => (
              <div key={r.id} className="bg-beige-mid rounded-xl px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{r.patient_name}</span>
                  {r.author && <span className="text-xs text-ink/40">{r.author}</span>}
                </div>
                <p className="text-sm text-ink/70 mt-1 whitespace-pre-line">{r.report_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
