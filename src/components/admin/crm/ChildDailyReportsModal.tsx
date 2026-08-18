import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CHILD_REPORTS_API, ChildDailyReport, ChildScales, CHILD_SCALE_META, fmt } from "@/components/admin/crm/crmShared";

const EMPTY_SCALES: ChildScales = {
  scale_emotional: null, scale_stress: null, scale_sociability: null, scale_activity: null,
  scale_contact_mother: null, scale_contact_peers: null, scale_academic: null, scale_work: null,
  scale_attention: null, scale_discipline: null,
};

function ScaleInput({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-ink/60">{label}</label>
        <span className="text-xs font-semibold text-ink">{value ?? "—"}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value ?? 5}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sage"
      />
    </div>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function ChildDailyReportsModal({ childId, childName, authorName, isAdmin, open, onClose }: { childId: number; childName: string; authorName: string; isAdmin: boolean; open: boolean; onClose: () => void }) {
  const [reports, setReports] = useState<ChildDailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [reportDate, setReportDate] = useState(todayIso());
  const [scales, setScales] = useState<ChildScales>({ ...EMPTY_SCALES });
  const [identifiedProblems, setIdentifiedProblems] = useState("");
  const [takenActions, setTakenActions] = useState("");
  const [results, setResults] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${CHILD_REPORTS_API}?child_id=${childId}`);
      const d = await r.json();
      setReports(d.reports || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) load(); }, [open, childId]);

  const resetForm = () => {
    setScales({ ...EMPTY_SCALES });
    setIdentifiedProblems("");
    setTakenActions("");
    setResults("");
    setEditingId(null);
    setReportDate(todayIso());
    setShowForm(false);
  };

  const startEdit = (r: ChildDailyReport) => {
    setScales({
      scale_emotional: r.scale_emotional, scale_stress: r.scale_stress, scale_sociability: r.scale_sociability, scale_activity: r.scale_activity,
      scale_contact_mother: r.scale_contact_mother, scale_contact_peers: r.scale_contact_peers, scale_academic: r.scale_academic, scale_work: r.scale_work,
      scale_attention: r.scale_attention, scale_discipline: r.scale_discipline,
    });
    setIdentifiedProblems(r.identified_problems ?? "");
    setTakenActions(r.taken_actions ?? "");
    setResults(r.results ?? "");
    setEditingId(r.id);
    setReportDate(r.report_date?.slice(0, 10) ?? todayIso());
    setShowForm(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        child_id: childId,
        author: authorName,
        report_date: reportDate,
        identified_problems: identifiedProblems,
        taken_actions: takenActions,
        results,
        ...scales,
      };
      if (editingId) {
        await fetch(`${CHILD_REPORTS_API}?id=${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(CHILD_REPORTS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const deleteReport = async (id: number) => {
    if (!confirm("Удалить отчёт?")) return;
    await fetch(`${CHILD_REPORTS_API}?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-cormorant text-xl">Ежедневные отчёты — {childName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm rounded-lg border border-dashed border-beige-dark text-ink/60 hover:text-ink hover:border-ink transition-colors"
            >
              <Icon name="Plus" size={14} /> Добавить отчёт за день
            </button>
          )}

          {showForm && (
            <div className="bg-beige-mid rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">{editingId ? "Редактирование отчёта" : "Новый отчёт"}</p>
                <button onClick={resetForm} className="p-1 text-ink/40 hover:text-ink"><Icon name="X" size={16} /></button>
              </div>
              <div>
                <label className="text-xs text-ink/60 mb-1 block">Дата отчёта</label>
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="border border-beige-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {CHILD_SCALE_META.map((s) => (
                  <ScaleInput
                    key={s.key}
                    label={s.label}
                    value={scales[s.key]}
                    onChange={(v) => setScales((prev) => ({ ...prev, [s.key]: v }))}
                  />
                ))}
              </div>
              <div className="space-y-3 pt-1 border-t border-beige-dark/40">
                <div>
                  <label className="text-xs text-ink/60 mb-1 block">Выявленные проблемы</label>
                  <textarea value={identifiedProblems} onChange={(e) => setIdentifiedProblems(e.target.value)} rows={2} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink resize-none" />
                </div>
                <div>
                  <label className="text-xs text-ink/60 mb-1 block">Предпринятые действия</label>
                  <textarea value={takenActions} onChange={(e) => setTakenActions(e.target.value)} rows={2} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink resize-none" />
                </div>
                <div>
                  <label className="text-xs text-ink/60 mb-1 block">Результаты</label>
                  <textarea value={results} onChange={(e) => setResults(e.target.value)} rows={2} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={resetForm} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отмена</button>
                <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center gap-1.5">
                  <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} />
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-3">История отчётов</h3>
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!loading && reports.length === 0 && <p className="text-ink/40 text-sm py-4 text-center">Пока нет ни одного отчёта</p>}
            {!loading && reports.length > 0 && (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {reports.map((r) => (
                  <div key={r.id} className="rounded-xl p-3 bg-beige-mid group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-ink">{fmt(r.report_date)}</span>
                        {r.author && <span className="text-xs text-ink/40">{r.author}</span>}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(r)} className="p-1 text-ink/40 hover:text-ink"><Icon name="Pencil" size={12} /></button>
                        {isAdmin && <button onClick={() => deleteReport(r.id)} className="p-1 text-ink/30 hover:text-red-400"><Icon name="X" size={13} /></button>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {CHILD_SCALE_META.filter((s) => r[s.key] !== null && r[s.key] !== undefined).map((s) => (
                        <span key={s.key} className="text-[10px] px-1.5 py-0.5 rounded bg-white text-ink/60">{s.label}: {r[s.key]}</span>
                      ))}
                    </div>
                    {(r.identified_problems || r.taken_actions || r.results) && (
                      <div className="space-y-0.5">
                        {r.identified_problems && <p className="text-xs text-ink/70"><span className="font-semibold text-ink/50">Проблемы: </span>{r.identified_problems}</p>}
                        {r.taken_actions && <p className="text-xs text-ink/70"><span className="font-semibold text-ink/50">Действия: </span>{r.taken_actions}</p>}
                        {r.results && <p className="text-xs text-ink/70"><span className="font-semibold text-ink/50">Результат: </span>{r.results}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}