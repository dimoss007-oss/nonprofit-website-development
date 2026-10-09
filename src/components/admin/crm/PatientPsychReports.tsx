import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { API, fmt } from "@/components/admin/crm/crmShared";

type PsychReport = { id: number; author: string | null; report_date: string; report_text: string };

export default function PatientPsychReports({ patientId }: { patientId: number }) {
  const [reports, setReports] = useState<PsychReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}?id=${patientId}&view=psychologist_reports`)
      .then((r) => r.json())
      .then((d) => setReports(d.reports || []))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink/60 py-6">
        <Icon name="Loader2" size={16} className="animate-spin" /> Загрузка...
      </div>
    );
  }

  if (!reports.length) {
    return (
      <div className="text-sm text-ink/60 py-6">
        Отчётов психолога пока нет. Они появятся, когда психолог отправит отчёт в чат бота.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div key={r.id} className="rounded-lg border border-ink/10 bg-white p-4">
          <div className="flex items-center justify-between gap-2 mb-2 text-xs text-ink/60">
            <span className="flex items-center gap-1.5 font-semibold text-ink">
              <Icon name="CalendarDays" size={14} /> {fmt(r.report_date)}
            </span>
            {r.author && <span>{r.author}</span>}
          </div>
          <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-wrap">{r.report_text}</p>
        </div>
      ))}
    </div>
  );
}
